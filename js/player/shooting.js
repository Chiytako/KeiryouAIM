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
                        this.onHitCallback(hitInfo, hit.point);
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
                this.onMiss(hit.point);
            }
        } else {
            // 何もヒットしなかった
            this.onMiss(null);
        }

        return {
            hit: false,
            target: null,
            hitInfo: null
        };
    }

    /**
     * ミス時の処理
     * @param {THREE.Vector3|null} hitPoint - ヒット位置（壁など）
     */
    onMiss(hitPoint) {
        this.stats.misses++;

        if (this.onMissCallback) {
            this.onMissCallback(hitPoint);
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
