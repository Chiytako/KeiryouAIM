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
        this.checkGrounded();
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
            // カウンターストラフィングにも指数カーブを適用
            const effectiveDecel = this.deceleration * multiplier;
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
                this.position.x = originalX;
                this.velocity.x = 0;
            }

            // Z軸の移動と衝突判定
            const originalZ = this.position.z;
            this.position.z += this.velocity.z * subDelta;
            if (this.checkCollision(this.position, colliders)) {
                this.position.z = originalZ;
                this.velocity.z = 0;
            }
        }

        // Y軸（重力）は簡易的に処理（壁との垂直衝突は考慮しない、床のみ）
        this.position.y += this.velocity.y * deltaTime;

        // 地面判定
        if (this.position.y <= this.groundLevel) {
            this.position.y = this.groundLevel;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // マップ境界制限（簡易版）
        const mapBoundary = 25; // 50x50マップの半分
        // 壁へのめり込みを防ぐために半径分だけ手前で止める
        const limit = mapBoundary - this.radius;

        this.position.x = clamp(this.position.x, -limit, limit);
        this.position.z = clamp(this.position.z, -limit, limit);
    }

    /**
     * 衝突判定（AABB）
     * @param {THREE.Vector3} position - プレイヤー位置
     * @param {Array<THREE.Mesh>} colliders - 衝突対象のメッシュ配列
     * @returns {boolean} 衝突しているか
     */
    checkCollision(position, colliders) {
        if (!colliders || colliders.length === 0) return false;

        // プレイヤーのバウンディングボックス（簡易）
        const playerMinX = position.x - this.radius;
        const playerMaxX = position.x + this.radius;
        const playerMinZ = position.z - this.radius;
        const playerMaxZ = position.z + this.radius;
        // Y軸は今回は簡易的に無視（壁は高さがあると仮定）
        // 必要ならY軸もチェックするが、現状はXZ平面での壁判定が主

        for (const collider of colliders) {
            if (!collider.geometry.boundingBox) {
                collider.geometry.computeBoundingBox();
            }

            // マトリックスを強制更新（動的に生成された直後のオブジェクト用）
            collider.updateMatrixWorld();

            // ワールド座標系でのバウンディングボックスを取得
            // 注意: 回転している壁の場合、AABBは大きくなるが、簡易判定としては許容
            // 正確にはOBBが必要だが、Three.jsのBox3はAABB
            const box = new THREE.Box3().copy(collider.geometry.boundingBox).applyMatrix4(collider.matrixWorld);

            // XZ平面での交差判定
            if (playerMaxX > box.min.x && playerMinX < box.max.x &&
                playerMaxZ > box.min.z && playerMinZ < box.max.z) {

                // Y軸の判定も追加（高さのある障害物に乗れるようにするか、ぶつかるか）
                // ここでは「壁」として扱うため、プレイヤーの足元～頭が壁の高さ内なら衝突
                const playerMinY = position.y;
                const playerMaxY = position.y + PHYSICS_CONSTANTS.PLAYER_HEIGHT;

                if (playerMaxY > box.min.y && playerMinY < box.max.y) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 地面判定
     */
    checkGrounded() {
        // 簡易的な地面判定
        // 実際のレイキャストは後で実装可能
        this.isGrounded = this.position.y <= this.groundLevel + 0.1;
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

        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

        if (horizontalSpeed < this.stopSpeed) {
            // 停止中
            if (this.isCrouching) {
                this.currentAccuracy = PHYSICS_CONSTANTS.ACCURACY_CROUCHING;
            } else {
                this.currentAccuracy = PHYSICS_CONSTANTS.ACCURACY_STANDING_STILL;
            }
        } else {
            // 移動中
            this.currentAccuracy = PHYSICS_CONSTANTS.ACCURACY_MOVING;
        }

        if (!this.isGrounded) {
            // ジャンプ中
            this.currentAccuracy = PHYSICS_CONSTANTS.ACCURACY_JUMPING;
        }
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
