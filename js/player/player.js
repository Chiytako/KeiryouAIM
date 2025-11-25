/**
 * プレイヤークラス
 * カメラ制御と移動システムを統合
 */

import CameraController from './camera.js';
import MovementController from './movement.js';

export class Player {
    constructor(camera) {
        // コントローラー
        this.cameraController = new CameraController(camera);
        this.movementController = new MovementController();

        // 参照
        this.camera = camera;

        // 射撃関連
        this.canShoot = true;
        this.lastShotTime = 0;
        this.fireRate = 1000 / 9.75; // Vandal: 9.75発/秒 → ミリ秒間隔

        console.log('Player initialized');
    }

    /**
     * プレイヤーを更新
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(deltaTime, colliders = []) {
        // 移動を更新
        this.movementController.update(this.cameraController, deltaTime, colliders);

        // カメラを更新
        const position = this.movementController.getPosition();
        const isCrouching = this.movementController.isCrouching;
        const isMoving = this.movementController.isMoving();

        this.cameraController.update(position, isCrouching, isMoving, deltaTime);
    }

    /**
     * プレイヤー位置を取得
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.movementController.getPosition();
    }

    /**
     * プレイヤー位置を設定
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z) {
        this.movementController.setPosition(x, y, z);
    }

    /**
     * カメラの向きを取得
     * @returns {THREE.Vector3} 向きベクトル
     */
    getDirection() {
        return this.cameraController.getDirectionVector();
    }

    /**
     * カメラの前方向を取得（水平のみ）
     * @returns {THREE.Vector3}
     */
    getForward() {
        return this.cameraController.getForwardVector();
    }

    /**
     * カメラの右方向を取得
     * @returns {THREE.Vector3}
     */
    getRight() {
        return this.cameraController.getRightVector();
    }

    /**
     * 現在の精度を取得
     * @returns {number} 0-1
     */
    getAccuracy() {
        return this.movementController.getAccuracy();
    }

    /**
     * 移動中かどうか
     * @returns {boolean}
     */
    isMoving() {
        return this.movementController.isMoving();
    }

    /**
     * 完全に停止しているか
     * @returns {boolean}
     */
    isStopped() {
        return this.movementController.isStopped();
    }

    /**
     * しゃがんでいるか
     * @returns {boolean}
     */
    isCrouching() {
        return this.movementController.isCrouching;
    }

    /**
     * 地面にいるか
     * @returns {boolean}
     */
    isGrounded() {
        return this.movementController.isGrounded;
    }

    /**
     * 射撃可能かチェック
     * @returns {boolean}
     */
    canShootWeapon() {
        const now = performance.now();
        const timeSinceLastShot = now - this.lastShotTime;

        return this.canShoot && timeSinceLastShot >= this.fireRate;
    }

    /**
     * 射撃を記録
     */
    recordShot() {
        this.lastShotTime = performance.now();
    }

    /**
     * カメラシェイクを追加
     * @param {number} intensity - 強度
     * @param {number} duration - 持続時間（秒）
     */
    addCameraShake(intensity, duration) {
        this.cameraController.addCameraShake(intensity, duration);
    }

    /**
     * FOVを設定
     * @param {number} fov - 視野角（度）
     */
    setFOV(fov) {
        this.cameraController.setFOV(fov);
    }

    /**
     * プレイヤーをリセット
     */
    reset() {
        this.movementController.reset();
        this.cameraController.reset();
        this.lastShotTime = 0;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            camera: this.cameraController.getDebugInfo(),
            movement: this.movementController.getDebugInfo(),
            shooting: {
                canShoot: this.canShootWeapon(),
                fireRate: this.fireRate.toFixed(2) + 'ms',
                lastShot: this.lastShotTime
            }
        };
    }
}

export default Player;
