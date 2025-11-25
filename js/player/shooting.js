/**
 * 射撃システム
 * レイキャスティングによる射撃と当たり判定
 */

import * as THREE from 'three';
import inputManager from '../core/input.js';
import audioManager from '../core/audio.js';

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
            bodyshots: 0
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
        // 射撃入力チェック
        if (inputManager.isShootingStarted()) {
            if (player.canShootWeapon()) {
                this.shoot(player);
            }
        }
    }

    /**
     * 射撃実行
     * @param {Object} player - プレイヤーオブジェクト
     */
    shoot(player) {
        player.recordShot();
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
            const hit = intersects[0];

            // ターゲットかどうかをチェック
            if (hit.object.userData && hit.object.userData.target) {
                const target = hit.object.userData.target;
                const hitPart = hit.object.userData.type;

                // ターゲットにヒット
                const hitInfo = target.hit(hitPart, hit.point);

                if (hitInfo) {
                    this.stats.hits++;

                    if (hitInfo.isHeadshot) {
                        this.stats.headshots++;
                    } else {
                        this.stats.bodyshots++;
                    }

                    // カメラシェイク
                    player.addCameraShake(0.01, 0.1);

                    // コールバック呼び出し
                    if (this.onHitCallback) {
                        // 相対位置を計算 (ターゲットの正面から見た相対位置)
                        // ターゲットは常にY軸回転のみと仮定（ビルボードではないが、正面を向いているか、あるいは全方向同じ形状）
                        // ここでは単純にターゲット中心からのオフセットを使用
                        // ただし、ターゲットが回転している場合は考慮が必要だが、現状は球とカプセルなので
                        // 視点方向からの投影平面でのオフセットを計算するのが最も直感的

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
            } else {
                // 壁などにヒット
                hitResult = { point: hit.point, distance: hit.distance };
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
     * @returns {Object} {x, y} 相対座標
     */
    calculateRelativePosition(target, hitPoint, viewPos) {
        // ターゲットの中心位置
        // Targetクラスの実装を見ると、group.positionが足元付近、
        // headはy=1.6, bodyはy=0.9 (HITBOX定数依存だが)
        // ここではターゲットの「中心」を定義する必要がある
        // ヘッドとボディの中間あたり、あるいはヘッドを基準にするか
        // ユーザーの要望は「どこらへんに当たっているか」なので、
        // ターゲットの見た目の中心を原点とすると分かりやすい

        // Target.jsを見ると:
        // headMesh.position.y = HITBOX.HEAD.heightOffset (1.6)
        // bodyMesh.position.y = HITBOX.BODY.heightOffset (0.9)
        // body height is 1.0, so center is roughly 0.9
        // 全体の中心は y=1.25 あたりか

        const targetCenter = target.group.position.clone();
        targetCenter.y += 1.3; // 概ねの中心

        // ビュー座標系でのオフセットを計算
        // カメラからターゲットへのベクトル（Z軸）
        const zAxis = targetCenter.clone().sub(viewPos).normalize();

        // 上ベクトル（Y軸）- カメラのアップベクトルではなく、ワールドのアップを使うと
        // ターゲットが傾いていない限り自然。ただし、プレイヤーが見上げている場合は
        // 視点平面に投影したほうがいい。
        // ここでは「ターゲットの正面」に対するヒット位置を知りたい。
        // ターゲットが常にこちらを向いている（ビルボード）なら、
        // 単純に hitPoint - targetCenter の dx, dy でよい。
        // ターゲットが固定なら、ワールド座標での差分を取るべきか？

        // 最も汎用的なのは、View Matrixで変換することだが、
        // 簡易的に「視線に垂直な平面」でのXY差分を取る

        const up = new THREE.Vector3(0, 1, 0);
        const xAxis = new THREE.Vector3().crossVectors(zAxis, up).normalize();
        const yAxis = new THREE.Vector3().crossVectors(xAxis, zAxis).normalize();

        const offset = hitPoint.clone().sub(targetCenter);

        const x = offset.dot(xAxis);
        const y = offset.dot(yAxis);

        return { x, y };
    }

    /**
     * ミス時の処理
     * @param {THREE.Vector3|null} hitPoint - ヒット位置（壁など）
     * @param {Object} relativePos - 相対位置 {x, y}
     */
    onMiss(hitPoint, relativePos) {
        this.stats.misses++;

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
            bodyshots: 0
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
