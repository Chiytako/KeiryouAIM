/**
 * プレイヤー移動システム
 * タクティカルシューター準拠の移動、ストッピング、ジャンプ処理
 */

import * as THREE from 'three';
import { PHYSICS_CONSTANTS } from '../utils/gameConst.js';
import { applyFriction, applyCounterStrafing, clamp, sigmoid } from '../utils/math.js';
import inputManager from '../core/input.js';
import settings from '../core/settings.js';

export class MovementController {
    constructor() {
        // 位置と速度
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // 状態
        this.isGrounded = true;
        this.isCrouching = false;
        this.isJumping = false;

        // 速度パラメータ
        this.runSpeed = PHYSICS_CONSTANTS.RUN_SPEED;
        this.shiftWalkSpeed = PHYSICS_CONSTANTS.SHIFT_WALK_SPEED;
        this.crouchSpeed = PHYSICS_CONSTANTS.CROUCH_SPEED;
        this.friction = PHYSICS_CONSTANTS.FRICTION;
        this.deceleration = PHYSICS_CONSTANTS.DECELERATION;
        this.acceleration = PHYSICS_CONSTANTS.ACCELERATION;

        // ジャンプパラメータ
        this.jumpVelocity = PHYSICS_CONSTANTS.JUMP_VELOCITY;
        this.gravity = PHYSICS_CONSTANTS.GRAVITY;

        // 停止判定
        this.stopSpeed = PHYSICS_CONSTANTS.STOP_SPEED;

        // 精度（移動中は低下）
        this.currentAccuracy = 1.0;

        // 地面の高さ
        this.groundLevel = 0;

        // プレイヤーの衝突判定半径（狭い隙間を抜けられるように小さめに設定）
        // 実際のタクティカルシューターでは、見た目より小さい判定が一般的
        this.radius = 0.3;

        // 物理演算の最大ステップサイズ（トンネリング防止）
        this.MAX_PHYSICS_STEP = 0.05; // 秒
        this.MAX_STEP_DISTANCE = 0.025; // units (最薄の壁0.5の半分以下に設定)
        this.maxStepHeight = PHYSICS_CONSTANTS.MAX_STEP_HEIGHT;

        // レイキャスター（地面判定用）
        this.raycaster = new THREE.Raycaster();
        this.downVector = new THREE.Vector3(0, -1, 0);

        // 衝突判定用の一時変数（GC対策）
        this._tempInverseMatrix = new THREE.Matrix4();
        this._tempPlayerPos = new THREE.Vector3();
        this._tempBox = new THREE.Box3();
    }

    /**
     * 移動システムを更新
     * @param {Object} cameraController - カメラコントローラー
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(cameraController, deltaTime, colliders = []) {
        // デルタタイムをクランプ（極端なラグでの物理破綻を防ぐ）
        deltaTime = Math.min(deltaTime, this.MAX_PHYSICS_STEP);

        // 入力を取得
        const moveInput = inputManager.getMovementInput();
        const jumpInput = inputManager.isJumping();
        const crouchInput = inputManager.isCrouching();
        const walkInput = inputManager.isWalking();

        // しゃがみ状態
        this.isCrouching = crouchInput;
        this.isWalking = walkInput;

        // 移動処理
        this.processMovement(moveInput, cameraController, deltaTime);

        // ジャンプ処理
        this.processJump(jumpInput, deltaTime);

        // 重力適用
        this.applyGravity(deltaTime);

        // 位置更新（衝突判定含む）
        this.updatePosition(deltaTime, colliders);

        // 精度計算
        this.updateAccuracy();

        // 地面判定
        this.checkGrounded(colliders);
    }

    /**
     * 移動処理
     * @param {Object} input - 移動入力 {x, z}
     * @param {Object} cameraController - カメラコントローラー
     * @param {number} deltaTime - 経過時間
     */
    processMovement(input, cameraController, deltaTime) {
        if (!this.isGrounded) {
            // 空中では制御が制限される
            this.processAirMovement(input, cameraController, deltaTime);
            return;
        }

        // カメラの向きに基づいて移動方向を計算
        const forward = cameraController.getForwardVector();
        const right = cameraController.getRightVector();

        // 移動方向ベクトル
        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(forward, -input.z); // W/S
        moveDirection.addScaledVector(right, input.x);    // A/D

        // 移動速度を決定
        let maxSpeed = this.runSpeed;

        if (this.isCrouching) {
            maxSpeed = this.crouchSpeed;
        } else if (this.isWalking) {
            maxSpeed = this.shiftWalkSpeed;
        }

        // 目標速度ベクトルを計算
        const targetVelocity = moveDirection.multiplyScalar(maxSpeed);

        // X軸とZ軸それぞれで加速・減速を適用
        this.velocity.x = this.applyMovementPhysics(this.velocity.x, targetVelocity.x, deltaTime);
        this.velocity.z = this.applyMovementPhysics(this.velocity.z, targetVelocity.z, deltaTime);

        // 完全停止判定
        if (Math.abs(this.velocity.x) < this.stopSpeed) {
            this.velocity.x = 0;
        }
        if (Math.abs(this.velocity.z) < this.stopSpeed) {
            this.velocity.z = 0;
        }
    }

    /**
     * 移動物理演算（加速・減速・摩擦）
     * @param {number} current - 現在の速度
     * @param {number} target - 目標速度
     * @param {number} deltaTime - 経過時間
     * @returns {number} 新しい速度
     */
    applyMovementPhysics(current, target, deltaTime) {
        // 共通の指数関数的スケーリング計算
        // 速度の割合（0.0 ~ 1.0）
        // ストッピング時は現在の速度、加速時は目標速度（または現在の速度）を基準にするが、
        // 「速度が出ているほど力が強い」という挙動で統一するなら、常に「現在の速度 / 最高速度」を見るのが自然
        // ただし加速時は「目標速度」に対する比率で計算していたため、それに合わせる

        let speedRatio = 0;
        if (target === 0) {
            // 停止中（摩擦）: 現在の速度 / 走り速度
            speedRatio = Math.min(Math.abs(current) / this.runSpeed, 1.0);
        } else {
            // 移動中: 現在の速度 / 目標速度
            speedRatio = Math.min(Math.abs(current) / Math.abs(target), 1.0);
        }

        // 係数を計算 (Sigmoid)
        // 速度比率(0~1)を入力とし、シグモイドカーブで係数(0~1)を得る
        // k=10, midpoint=0.5 の場合:
        // 0.0 -> 0.006 (ほぼ0)
        // 0.5 -> 0.5
        // 1.0 -> 0.993 (ほぼ1)
        // これにより「動き出しはゆっくり(係数小) -> 中盤で急加速 -> 終盤は最大加速維持」となる
        // ※ユーザー要望の「走るときの加速はもう少しスローに」を実現するため、
        //   立ち上がりを遅くする（midpointを右にずらす）か、kを調整する

        // midpoint=0.6 にすると、速度が60%に乗るまで本気を出さない＝動き出しが重くなる
        const k = 12;
        const midpoint = 0.6;

        // シグモイドの出力は0~1だが、最小値を保証するために少しオフセット
        const sigVal = sigmoid(speedRatio, k, midpoint);
        const baseFactor = 0.05; // 最小係数

        const multiplier = baseFactor + (1 - baseFactor) * sigVal;

        // 入力がない（目標速度が0）場合は摩擦で減速
        if (target === 0) {
            // 摩擦にも指数カーブを適用
            // 高速時は強く減速、低速時は弱く減速（＝自然な減衰）
            const effectiveFriction = this.friction * multiplier;
            return applyFriction(current, effectiveFriction, deltaTime);
        }

        // カウンターストラフィング判定
        const isCounterStrafing = (current !== 0 && Math.sign(current) !== Math.sign(target));

        if (isCounterStrafing) {
            // カウンターストラフィングは即座に反応させるため、カーブを適用しない（定数減速）
            const effectiveDecel = this.deceleration;
            const delta = effectiveDecel * deltaTime;

            if (current < target) {
                return Math.min(current + delta, target);
            } else {
                return Math.max(current - delta, target);
            }
        } else {
            // 通常の加速：指数関数的（Ease-In）な立ち上がり
            const effectiveAccel = this.acceleration * multiplier;

            // 直線移動（Linear）ベースに可変加速度を適用
            const delta = effectiveAccel * deltaTime;

            if (current < target) {
                return Math.min(current + delta, target);
            } else {
                return Math.max(current - delta, target);
            }
        }
    }

    /**
     * 空中移動処理
     * @param {Object} input - 移動入力
     * @param {Object} cameraController - カメラコントローラー
     * @param {number} deltaTime - 経過時間
     */
    processAirMovement(input, cameraController, deltaTime) {
        const forward = cameraController.getForwardVector();
        const right = cameraController.getRightVector();

        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(forward, -input.z);
        moveDirection.addScaledVector(right, input.x);

        // 空中での制御は制限される
        const airControl = PHYSICS_CONSTANTS.AIR_CONTROL;
        const airAcceleration = PHYSICS_CONSTANTS.AIR_ACCELERATION * deltaTime;

        const targetVelocity = moveDirection.multiplyScalar(this.runSpeed * airControl);

        this.velocity.x += (targetVelocity.x - this.velocity.x) * airAcceleration;
        this.velocity.z += (targetVelocity.z - this.velocity.z) * airAcceleration;

        // 最大速度制限
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (horizontalSpeed > PHYSICS_CONSTANTS.MAX_AIR_SPEED) {
            const scale = PHYSICS_CONSTANTS.MAX_AIR_SPEED / horizontalSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }
    }

    /**
     * ジャンプ処理
     * @param {boolean} jumpInput - ジャンプ入力
     * @param {number} deltaTime - 経過時間
     */
    processJump(jumpInput, deltaTime) {
        if (jumpInput && this.isGrounded && !this.isJumping) {
            // ジャンプ開始
            this.velocity.y = this.jumpVelocity;
            this.isGrounded = false;
            this.isJumping = true;
        }

        if (!jumpInput) {
            this.isJumping = false;
        }
    }

    /**
     * 重力を適用
     * @param {number} deltaTime - 経過時間
     */
    applyGravity(deltaTime) {
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * deltaTime;
        }
    }

    /**
     * 位置を更新（サブステップ実装でトンネリングを防止）
     * @param {number} deltaTime - 経過時間
     */
    updatePosition(deltaTime, colliders = []) {
        // 移動距離を計算
        const displacement = new THREE.Vector3(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime,
            this.velocity.z * deltaTime
        );

        // 水平移動距離
        const horizontalDistance = Math.sqrt(displacement.x * displacement.x + displacement.z * displacement.z);

        // サブステップ数を計算（最大ステップ距離を超えないように）
        const steps = Math.max(1, Math.ceil(horizontalDistance / this.MAX_STEP_DISTANCE));
        const subDelta = deltaTime / steps;

        // サブステップで移動
        for (let i = 0; i < steps; i++) {
            // X軸の移動と衝突判定
            const originalX = this.position.x;
            this.position.x += this.velocity.x * subDelta;

            if (this.checkCollision(this.position, colliders)) {
                // 段差乗り越え判定
                let targetGroundY = this.getGroundY(this.position, colliders);

                // エッジ検出（体の端が段差に乗っている場合）
                // 中心点での判定で段差が見つからない、または現在の高さと同じ場合、
                // 進行方向の端（半径分先）で再チェックする
                if (targetGroundY === -Infinity || targetGroundY <= this.position.y + 0.01) {
                    const directionX = Math.sign(this.velocity.x);
                    if (directionX !== 0) {
                        const edgePos = this.position.clone();
                        // 半径 + 僅かなオフセットで壁の内部をチェック
                        edgePos.x += directionX * (this.radius + 0.1);
                        const edgeY = this.getGroundY(edgePos, colliders);

                        // エッジで有効な段差が見つかったら採用
                        if (edgeY > -Infinity && edgeY > this.position.y) {
                            targetGroundY = edgeY;
                        }
                    }
                }

                let stepped = false;

                // 乗り越え可能な高さかチェック
                if (targetGroundY > -Infinity &&
                    targetGroundY >= this.position.y &&
                    targetGroundY - this.position.y <= this.maxStepHeight) {

                    // 天井チェック：持ち上げた位置で衝突しないか
                    const originalY = this.position.y;
                    this.position.y = targetGroundY;

                    if (!this.checkCollision(this.position, colliders)) {
                        // 成功
                        if (this.velocity.y > 0) {
                            // ジャンプ中（上昇中）は接地扱いせず、速度も維持
                            this.isGrounded = false;
                        } else {
                            // 通常の歩き、または落下中
                            this.isGrounded = true;
                            this.velocity.y = 0;
                        }
                        this.groundLevel = targetGroundY;
                        stepped = true;
                    } else {
                        // 失敗（頭がぶつかる）
                        this.position.y = originalY;
                    }
                }

                if (!stepped) {
                    // 衝突（壁）
                    this.position.x = originalX;
                    this.velocity.x = 0;
                }
            }

            // Z軸の移動と衝突判定
            const originalZ = this.position.z;
            this.position.z += this.velocity.z * subDelta;

            if (this.checkCollision(this.position, colliders)) {
                // 段差乗り越え判定
                let targetGroundY = this.getGroundY(this.position, colliders);

                // エッジ検出（Z軸）
                if (targetGroundY === -Infinity || targetGroundY <= this.position.y + 0.01) {
                    const directionZ = Math.sign(this.velocity.z);
                    if (directionZ !== 0) {
                        const edgePos = this.position.clone();
                        edgePos.z += directionZ * (this.radius + 0.1);
                        const edgeY = this.getGroundY(edgePos, colliders);

                        if (edgeY > -Infinity && edgeY > this.position.y) {
                            targetGroundY = edgeY;
                        }
                    }
                }

                let stepped = false;

                if (targetGroundY > -Infinity &&
                    targetGroundY >= this.position.y &&
                    targetGroundY - this.position.y <= this.maxStepHeight) {

                    const originalY = this.position.y;
                    this.position.y = targetGroundY;

                    if (!this.checkCollision(this.position, colliders)) {
                        if (this.velocity.y > 0) {
                            this.isGrounded = false;
                        } else {
                            this.isGrounded = true;
                            this.velocity.y = 0;
                        }
                        this.groundLevel = targetGroundY;
                        stepped = true;
                    } else {
                        this.position.y = originalY;
                    }
                }

                if (!stepped) {
                    // 衝突（壁）
                    this.position.z = originalZ;
                    this.velocity.z = 0;
                }
            }

            // 段差降下チェック（階段を降りる処理）
            // 接地中で、衝突がない場合、足元に低い地面があれば降下する
            if (this.isGrounded && !this.checkCollision(this.position, colliders)) {
                const groundY = this.getGroundY(this.position, colliders);

                // 足元に地面があり、現在位置より低い場合
                if (groundY > -Infinity && groundY < this.position.y - 0.01) {
                    const dropDistance = this.position.y - groundY;

                    // 段差の高さ以内であれば降下
                    if (dropDistance <= this.maxStepHeight) {
                        // 降下後の位置で衝突しないかチェック
                        const originalY = this.position.y;
                        this.position.y = groundY;

                        if (!this.checkCollision(this.position, colliders)) {
                            this.groundLevel = groundY;
                            // 降下後も接地状態を維持
                            this.isGrounded = true;
                            this.velocity.y = 0;
                        } else {
                            // 衝突する場合は降下しない（空中に浮いたまま＝落下扱いになるか、次のフレームで処理）
                            this.position.y = originalY;
                        }
                    }
                    // それ以上の高さの場合は落下扱い（重力で処理されるため何もしない）
                }
            }
        }

        // Y軸（重力）
        // 接地していない、またはジャンプ中の場合
        if (!this.isGrounded || this.velocity.y > 0) {
            const originalY = this.position.y;
            this.position.y += this.velocity.y * deltaTime;

            // Y軸移動後の衝突判定（天井や床への衝突）
            if (this.checkCollision(this.position, colliders)) {
                this.position.y = originalY;
                this.velocity.y = 0;
            }
        }

        // 落下中の着地判定（空中から地面に降りる場合）
        if (this.velocity.y < 0) {
            const groundY = this.getGroundY(this.position, colliders);
            if (groundY > -Infinity && this.position.y <= groundY + 0.1) {
                // 着地位置で衝突しないかチェック
                const originalY = this.position.y;
                this.position.y = groundY;

                if (!this.checkCollision(this.position, colliders)) {
                    this.velocity.y = 0;
                    this.isGrounded = true;
                    this.groundLevel = groundY;
                } else {
                    // 衝突する場合は着地させない（壁際などで引っかかっている場合など）
                    this.position.y = originalY;
                }
            }
        }

        // 最低高度制限（奈落落ち防止）
        if (this.position.y < -50) {
            this.position.y = 10;
            this.velocity.set(0, 0, 0);
        }

        // マップ境界制限（簡易版）
        const mapBoundary = 25; // 50x50マップの半分
        // 壁へのめり込みを防ぐために半径分だけ手前で止める
        const limit = mapBoundary - this.radius;

        this.position.x = clamp(this.position.x, -limit, limit);
        this.position.z = clamp(this.position.z, -limit, limit);
    }

    /**
     * 衝突判定（OBB対応）
     * @param {THREE.Vector3} position - プレイヤー位置（ワールド座標）
     * @param {Array<THREE.Mesh>} colliders - 衝突対象のメッシュ配列
     * @returns {boolean} 衝突しているか
     */
    checkCollision(position, colliders) {
        if (!colliders || colliders.length === 0) return false;

        const playerHeight = PHYSICS_CONSTANTS.PLAYER_HEIGHT;
        const playerRadius = this.radius;

        for (const collider of colliders) {
            // 地面は水平衝突判定から除外（getGroundYで処理）
            if (collider.userData && collider.userData.isGround) continue;

            if (!collider.geometry.boundingBox) {
                collider.geometry.computeBoundingBox();
            }

            // マトリックスを強制更新
            collider.updateMatrixWorld();

            // プレイヤーの位置をコライダーのローカル座標系に変換
            // これにより、回転した箱（OBB）を、軸に沿った箱（AABB）として扱える
            this._tempInverseMatrix.copy(collider.matrixWorld).invert();
            this._tempPlayerPos.copy(position).applyMatrix4(this._tempInverseMatrix);

            // ローカル座標系でのバウンディングボックス
            const box = collider.geometry.boundingBox;

            // ローカル座標系でのプレイヤーの範囲（円柱近似 -> AABB近似）
            // ローカル空間ではスケールも適用されているため、半径もスケールで割る必要があるが、
            // 簡易的に一律スケールと仮定するか、安全側に倒してそのままの半径を使う
            // 厳密には collider.scale を考慮すべきだが、壁のスケールが極端でない限り許容範囲

            // ローカル座標でのAABB交差判定
            // プレイヤーのAABB（ローカル）
            const localMinX = this._tempPlayerPos.x - playerRadius;
            const localMaxX = this._tempPlayerPos.x + playerRadius;
            const localMinZ = this._tempPlayerPos.z - playerRadius;
            const localMaxZ = this._tempPlayerPos.z + playerRadius;

            // Y軸（高さ）
            // ローカル座標系でのY軸方向のチェック
            // プレイヤーの足元(y)から頭(y+height)まで
            const localMinY = this._tempPlayerPos.y;
            const localMaxY = this._tempPlayerPos.y + playerHeight;

            // 交差判定
            if (localMaxX > box.min.x && localMinX < box.max.x &&
                localMaxZ > box.min.z && localMinZ < box.max.z &&
                localMaxY > box.min.y && localMinY < box.max.y) {
                return true;
            }
        }

        return false;
    }

    /**
     * 現在位置の直下の地面の高さを取得
     * @param {THREE.Vector3} position - チェックする位置
     * @param {Array<THREE.Mesh>} colliders - 衝突対象
     * @returns {number} 地面のY座標（見つからない場合は-Infinity）
     */
    getGroundY(position, colliders) {
        if (!colliders || colliders.length === 0) return -Infinity;

        // 足元から少し上から下方向にレイを飛ばす
        // 始点を少し高くして、坂道や段差の縁でも検出できるようにする
        // 以前は maxStepHeight だけだったが、ギリギリの高さで判定漏れすることがあるため少し余裕を持たせる
        const rayStart = position.clone();
        rayStart.y += this.maxStepHeight + 0.2;

        this.raycaster.set(rayStart, this.downVector);

        // レイの長さは (開始高さオフセット + 検出したい深さ)
        // ここでは maxStepHeight * 2 程度を見る（足元より下も見るため）
        this.raycaster.far = this.maxStepHeight * 2 + 1.2; // 余裕を持たせる

        const intersects = this.raycaster.intersectObjects(colliders, false);

        if (intersects.length > 0) {
            // 最も高い交点（一番近い交点）を返す
            // intersectObjectsは距離順にソートされているため、最初の要素が最も近い（高い）
            return intersects[0].point.y;
        }

        return -Infinity;
    }

    /**
     * 地面判定
     */
    checkGrounded(colliders = []) {
        // レイキャストによる正確な接地判定
        const groundY = this.getGroundY(this.position, colliders);

        // 地面との距離が僅かであれば接地とみなす
        // 坂道などを考慮して少し余裕を持たせる
        const threshold = 0.1;

        if (groundY > -Infinity && Math.abs(this.position.y - groundY) <= threshold && this.velocity.y <= 0) {
            // 接地時はY座標を地面に合わせる（吸着）
            // ただし、吸着先で衝突しないかチェック
            const originalY = this.position.y;

            if (this.velocity.y <= 0) {
                this.position.y = groundY;

                if (!this.checkCollision(this.position, colliders)) {
                    this.isGrounded = true;
                    this.groundLevel = groundY;
                    this.velocity.y = 0;
                } else {
                    // 吸着すると埋まる場合は元に戻す（接地扱いしない、または次のフレームで処理）
                    this.position.y = originalY;
                    this.isGrounded = false;
                }
            } else {
                this.isGrounded = true;
                this.groundLevel = groundY;
            }
        } else {
            this.isGrounded = false;
        }
    }

    /**
     * 精度を更新
     */
    updateAccuracy() {
        // 移動エラーが無効な場合は常に最高精度
        if (!settings.get('gameplay.movementError')) {
            this.currentAccuracy = 1.0;
            return;
        }

        if (!this.isGrounded) {
            // ジャンプ中
            this.currentAccuracy = PHYSICS_CONSTANTS.ACCURACY_JUMPING;
            return;
        }

        // 水平速度
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

        // 速度比率 (0.0 - 1.0)
        // 走り速度を基準にする
        let speedRatio = horizontalSpeed / this.runSpeed;
        speedRatio = clamp(speedRatio, 0, 1);

        // ベース精度（停止時）
        let baseAccuracy = PHYSICS_CONSTANTS.ACCURACY_STANDING_STILL;
        if (this.isCrouching) {
            baseAccuracy = PHYSICS_CONSTANTS.ACCURACY_CROUCHING;
        }

        // 移動時精度
        const movingAccuracy = PHYSICS_CONSTANTS.ACCURACY_MOVING;

        // 速度に応じて補間
        // 速度0ならbaseAccuracy, 速度MAXならmovingAccuracy
        // 線形補間だと少しの変化で精度が落ちすぎるかもしれないので、
        // 必要ならカーブをかけるが、まずはLinearで実装

        // lerp(start, end, t) = start + (end - start) * t
        // t=0 -> start (High accuracy = 1.0)
        // t=1 -> end (Low accuracy = 0.3)

        // 注意: accuracyの値は「精度率」であり、1.0が良い、0.0が悪い。
        // gameConst.jsを見ると:
        // ACCURACY_STANDING_STILL: 1.0
        // ACCURACY_MOVING: 0.3

        // 単純なLerp
        this.currentAccuracy = baseAccuracy + (movingAccuracy - baseAccuracy) * speedRatio;
    }

    /**
     * 移動中かどうか
     * @returns {boolean}
     */
    isMoving() {
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        return horizontalSpeed > this.stopSpeed;
    }

    /**
     * 完全に停止しているか
     * @returns {boolean}
     */
    isStopped() {
        return Math.abs(this.velocity.x) < this.stopSpeed &&
            Math.abs(this.velocity.z) < this.stopSpeed &&
            this.isGrounded;
    }

    /**
     * 現在の精度を取得
     * @returns {number} 精度（0-1）
     */
    getAccuracy() {
        return this.currentAccuracy;
    }

    /**
     * 位置を取得
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.position.clone();
    }

    /**
     * 位置を設定
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    /**
     * 速度をリセット
     */
    resetVelocity() {
        this.velocity.set(0, 0, 0);
    }

    /**
     * リセット
     */
    reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.isGrounded = true;
        this.isCrouching = false;
        this.isJumping = false;
        this.currentAccuracy = 1.0;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

        return {
            position: {
                x: this.position.x.toFixed(2),
                y: this.position.y.toFixed(2),
                z: this.position.z.toFixed(2)
            },
            velocity: {
                x: this.velocity.x.toFixed(2),
                y: this.velocity.y.toFixed(2),
                z: this.velocity.z.toFixed(2),
                horizontal: horizontalSpeed.toFixed(2)
            },
            isGrounded: this.isGrounded,
            isCrouching: this.isCrouching,
            isMoving: this.isMoving(),
            isStopped: this.isStopped(),
            accuracy: (this.currentAccuracy * 100).toFixed(1) + '%'
        };
    }
}

export default MovementController;
