/**
 * 射撃システム
 * レイキャスティングによる射撃と当たり判定
 */

import * as THREE from 'three';
import inputManager from '../core/input.js';
import audioManager from '../core/audio.js';

import { HITBOX, NORMALIZATION_BOUNDS } from '../utils/gameConst.js';

export class ShootingSystem {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 1000; // 最大射程

        // 射撃統計
        this.stats = {
            totalShots: 0,
            hits: 0,
            misses: 0,
            headshots: 0,
            bodyshots: 0,
            combo: 0,
            score: 0
        };

        // コールバック
        this.onHitCallback = null;
        this.onMissCallback = null;
    }

    /**
     * 射撃を更新
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} deltaTime - 経過時間
     */
    update(player, deltaTime) {
        // Handle shooting input
        if (inputManager.isShooting()) {
            if (this.weaponManager) {
                // Delegate to WeaponManager
                this.shoot(player, this.weaponManager);
            } else if (player.canShootWeapon()) {
                // Fallback to simple player shooting
                this.shoot(player);
            }
        }
    }

    setWeaponManager(manager) {
        this.weaponManager = manager;
    }


    /**
     * 射撃実行
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} weaponManager - 武器マネージャー (Optional)
     */
    shoot(player, weaponManager = null) {
        let shotResult = null;

        if (weaponManager) {
            // 武器マネージャーから射撃
            shotResult = weaponManager.shoot();
            if (!shotResult) {
                return; // 射撃不可（弾切れ、レート制限など）
            }

            // リコイルをカメラに適用
            if (shotResult.recoil) {
                player.cameraController.applyRecoil(
                    shotResult.recoil.x,
                    shotResult.recoil.y
                );
            }
        } else {
            // 後方互換性（managerなしの場合は従来の単純な記録）
            player.recordShot();
        }

        this.stats.totalShots++;

        // 発射音
        audioManager.play('SHOOT');

        // カメラの中心から前方にレイキャスト
        const direction = player.getDirection();

        // 精度による分散を適用
        const accuracy = player.getAccuracy();
        const spread = this.calculateSpread(accuracy);
        const spreadDirection = this.applySpread(direction, spread);

        this.raycaster.set(this.camera.position, spreadDirection);

        // シーン内のすべてのオブジェクトとの交差判定
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        // ターゲットヒット判定
        let hitResult = null;
        let closestTarget = null;

        if (intersects.length > 0) {
            // 交差したオブジェクトを順番にチェック
            for (const hit of intersects) {
                const obj = hit.object;

                // 無視すべきオブジェクトをスキップ
                // 1. アウトライン (userData.isOutline)
                if (obj.userData && obj.userData.isOutline) {
                    continue;
                }

                // 2. 不可視オブジェクト (visible = false)
                // Raycasterはデフォルトでvisible=trueのみを対象にするが、親がvisibleでも子が...というケースはある
                // ここでは念のためチェック（Three.jsのRaycasterは再帰的にチェックする際、親のvisibleも考慮するはずだが）
                if (obj.visible === false) {
                    continue;
                }

                // 3. マテリアルが完全透明かつ透明設定有効な場合（当たり判定用透明メッシュは除く必要があるか？）
                // Targetの透明メッシュは当たり判定用なので除外してはいけない (wireframeモード時など)
                // ただし、もし「見えない壁」が邪魔しているなら、ここでフィルタリングが必要
                // 現状はTargetの透明メッシュはヒットさせたいので、opacityチェックはしない

                // ターゲット判定
                if (obj.userData && obj.userData.target) {
                    const target = obj.userData.target;
                    const hitPart = obj.userData.type;

                    // ターゲットにヒット
                    const hitInfo = target.hit(hitPart, hit.point);

                    if (hitInfo) {
                        this.stats.hits++;

                        if (hitInfo.isHeadshot) {
                            this.stats.headshots++;
                        } else {
                            this.stats.bodyshots++;
                        }

                        // コンボ加算
                        this.stats.combo++;

                        // スコア計算 (StatsManagerと同じロジックで簡易計算)
                        let shotScore = 100;
                        if (hitInfo.isHeadshot) shotScore *= 1.5;
                        const comboBonusMultiplier = 1 + (this.stats.combo * 0.1);
                        this.stats.score += Math.round(shotScore * comboBonusMultiplier);

                        // カメラシェイク
                        player.addCameraShake(0.01, 0.1);

                        // コールバック呼び出し
                        if (this.onHitCallback) {
                            // 相対位置を計算 (ターゲットの正面から見た相対位置)
                            const relativePos = this.calculateRelativePosition(target, hit.point, this.camera.position);

                            this.onHitCallback(hitInfo, hit.point, relativePos);
                        }

                        console.log('Hit:', hitPart, 'at distance:', hit.distance.toFixed(2));

                        return {
                            hit: true,
                            target: target,
                            hitInfo: hitInfo,
                            distance: hit.distance,
                            point: hit.point
                        };
                    }
                    // hit()がnullを返した場合（既に死んでいるなど）は、貫通して後ろのものをチェックするか？
                    // 基本的には死体撃ちはヒット扱いしないが、壁判定もしない（スルー）
                    continue;

                } else {
                    // 壁などにヒット
                    // ターゲット以外で、かつ無視リストに入っていないものは障害物とみなす
                    hitResult = { point: hit.point, distance: hit.distance };

                    // 壁に当たったらそこで判定終了（貫通しない）
                    break;
                }
            }
        } else {
            // 何もヒットしなかった（空へ発射）
            // 仮想的なヒットポイント（遠方）を作成
            const farPoint = this.camera.position.clone().add(spreadDirection.multiplyScalar(50));
            hitResult = { point: farPoint, distance: 50 };
        }

        // ミスの場合、最も近いターゲットを探して相対位置を計算
        if (hitResult) {
            // アクティブなターゲットを探す
            // シーンから探すのは非効率だが、TargetManagerへの参照がないため
            // userData.targetを持つオブジェクトを探索するか、
            // あるいはGameクラスからTargetManagerを渡してもらうのが良いが、
            // ここでは簡易的にシーン走査（ただしintersectsで取れたもの以外も見る必要がある）

            // 最も視線に近いターゲットを探す
            const targets = [];
            this.scene.traverse((obj) => {
                // isHitであっても、まだActive（消滅アニメーション中）ならターゲットとして認識する
                if (obj.userData && obj.userData.target && obj.userData.target.isActive) {
                    // 重複を避ける（ヘッドとボディで同じターゲット）
                    if (!targets.includes(obj.userData.target)) {
                        targets.push(obj.userData.target);
                    }
                }
            });

            let minAngle = Infinity;
            let bestTarget = null;

            targets.forEach(target => {
                // ターゲットへのベクトル
                const toTarget = target.group.position.clone().sub(this.camera.position).normalize();
                // 視線ベクトル
                const lookDir = spreadDirection.clone().normalize(); // 既に正規化されているはずだが念のため

                // 角度（ラジアン）
                const angle = toTarget.angleTo(lookDir);

                if (angle < minAngle) {
                    minAngle = angle;
                    bestTarget = target;
                }
            });

            // 視野角内（例えば10度以内）なら「狙った」とみなす
            // 10度 = 0.17 rad, 0.5 rad = 28度
            if (bestTarget && minAngle < 0.5) { // 少し広めに
                // ターゲット平面への投影点を計算
                // ターゲットの位置を通り、視線に垂直な平面...ではなく、
                // ターゲットの位置を通り、カメラ->ターゲットベクトルに垂直な平面に、視線を投影

                // 簡易的に、ターゲットの距離でのレイの位置を計算
                const distToTarget = bestTarget.group.position.distanceTo(this.camera.position);
                const projectedPoint = this.camera.position.clone().add(spreadDirection.clone().multiplyScalar(distToTarget));

                const relativePos = this.calculateRelativePosition(bestTarget, projectedPoint, this.camera.position);

                this.onMiss(hitResult.point, relativePos);
            } else {
                this.onMiss(hitResult.point, null);
            }
        }

        return {
            hit: false,
            target: null,
            hitInfo: null
        };
    }

    /**
     * ターゲット中心からの相対位置を計算（視点からの投影）
     * @param {Object} target - ターゲット
     * @param {THREE.Vector3} hitPoint - ヒット位置（または投影位置）
     * @param {THREE.Vector3} viewPos - 視点位置
     * @returns {Object} {x, y, rawX, rawY} 正規化された相対座標と生のオフセット
     */
    calculateRelativePosition(target, hitPoint, viewPos) {
        // ターゲットの中心位置（正規化の基準点）
        // HITBOX.HEAD.heightOffset (1.6) と HITBOX.BODY.heightOffset (0.9) の間くらい
        // NORMALIZATION_BOUNDS.height が 2.0 なので、中心は y=1.0 くらいが良いが、
        // ターゲットの足元が y=0 なので、中心は y=1.0 とする

        // ワールド座標を取得（親オブジェクトの影響を考慮）
        const targetCenter = new THREE.Vector3();
        target.group.getWorldPosition(targetCenter);
        targetCenter.y += 1.0;

        // ビュー座標系でのオフセットを計算
        // カメラからターゲットへのベクトル（Z軸）
        const zAxis = targetCenter.clone().sub(viewPos).normalize();

        // 上ベクトル（Y軸）
        const up = new THREE.Vector3(0, 1, 0);
        const xAxis = new THREE.Vector3().crossVectors(zAxis, up).normalize();
        const yAxis = new THREE.Vector3().crossVectors(xAxis, zAxis).normalize();

        const offset = hitPoint.clone().sub(targetCenter);

        const rawX = offset.dot(xAxis);
        const rawY = offset.dot(yAxis);

        // 正規化 (-1.0 ~ 1.0)
        // 幅: ±NORMALIZATION_BOUNDS.width / 2
        // 高さ: ±NORMALIZATION_BOUNDS.height / 2
        const x = rawX / (NORMALIZATION_BOUNDS.width / 2);
        const y = rawY / (NORMALIZATION_BOUNDS.height / 2);

        // デバッグログ（値が異常な場合に確認用）
        // console.log(`RelPos: Raw(${rawX.toFixed(2)}, ${rawY.toFixed(2)}) -> Norm(${x.toFixed(2)}, ${y.toFixed(2)})`);

        return { x, y, rawX, rawY };
    }

    /**
     * ミス時の処理
     * @param {THREE.Vector3|null} hitPoint - ヒット位置（壁など）
     * @param {Object} relativePos - 相対位置 {x, y}
     */
    onMiss(hitPoint, relativePos) {
        this.stats.misses++;
        this.stats.combo = 0; // コンボリセット

        if (this.onMissCallback) {
            this.onMissCallback(hitPoint, relativePos);
        }

        // ミス音（壁に当たった音など）
        audioManager.play('MISS');

        console.log('Miss');
    }

    /**
     * 精度から弾の分散を計算
     * @param {number} accuracy - 精度（0-1）
     * @returns {number} 分散角度（ラジアン）
     */
    calculateSpread(accuracy) {
        // 精度が高いほど分散が小さい
        const maxSpread = 0.05; // 最大分散（ラジアン）約2.86度
        return maxSpread * (1 - accuracy);
    }

    /**
     * 方向ベクトルに分散を適用
     * @param {THREE.Vector3} direction - 元の方向ベクトル
     * @param {number} spread - 分散角度（ラジアン）
     * @returns {THREE.Vector3} 分散が適用された方向ベクトル
     */
    applySpread(direction, spread) {
        if (spread === 0) {
            return direction.clone();
        }

        // ランダムな分散を生成
        const randomX = (Math.random() - 0.5) * spread;
        const randomY = (Math.random() - 0.5) * spread;

        // 方向ベクトルに直交する2つのベクトルを計算
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3();
        right.crossVectors(direction, up).normalize();

        const actualUp = new THREE.Vector3();
        actualUp.crossVectors(right, direction).normalize();

        // 分散を適用
        const newDirection = direction.clone();
        newDirection.addScaledVector(right, randomX);
        newDirection.addScaledVector(actualUp, randomY);
        newDirection.normalize();

        return newDirection;
    }

    /**
     * ヒットコールバックを設定
     * @param {Function} callback - コールバック関数
     */
    setOnHitCallback(callback) {
        this.onHitCallback = callback;
    }

    /**
     * ミスコールバックを設定
     * @param {Function} callback - コールバック関数
     */
    setOnMissCallback(callback) {
        this.onMissCallback = callback;
    }

    /**
     * 統計をリセット
     */
    resetStats() {
        this.stats = {
            totalShots: 0,
            hits: 0,
            misses: 0,
            headshots: 0,
            bodyshots: 0,
            combo: 0,
            score: 0
        };
    }

    /**
     * 精度率を取得
     * @returns {number} 精度（0-1）
     */
    getAccuracyRate() {
        if (this.stats.totalShots === 0) return 0;
        return this.stats.hits / this.stats.totalShots;
    }

    /**
     * ヘッドショット率を取得
     * @returns {number} ヘッドショット率（0-1）
     */
    getHeadshotRate() {
        if (this.stats.hits === 0) return 0;
        return this.stats.headshots / this.stats.hits;
    }

    /**
     * 統計を取得
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            accuracy: this.getAccuracyRate(),
            headshotRate: this.getHeadshotRate()
        };
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            stats: this.getStats(),
            raycaster: {
                far: this.raycaster.far,
                near: this.raycaster.near
            }
        };
    }
}

export default ShootingSystem;
