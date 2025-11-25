/**
 * カメラ制御
 * FPSスタイルのカメラコントローラー
 */

import * as THREE from 'three';
import { VALORANT_CONSTANTS } from '../utils/valorantConst.js';
import { clamp, degToRad, lerp } from '../utils/math.js';
import inputManager from '../core/input.js';
import settings from '../core/settings.js';

export class CameraController {
    constructor(camera) {
        this.camera = camera;

        // 回転角度（ラジアン）
        this.yaw = 0;  // 水平回転（Y軸）
        this.pitch = 0; // 垂直回転（X軸）

        // 回転制限
        this.minPitch = degToRad(-89); // 下方向の制限
        this.maxPitch = degToRad(89);  // 上方向の制限

        // カメラ位置オフセット
        this.heightOffset = VALORANT_CONSTANTS.CAMERA_HEIGHT;
        this.crouchHeightOffset = VALORANT_CONSTANTS.CROUCH_HEIGHT - 0.2;

        // カメラの揺れ（後で実装）
        this.shake = {
            intensity: 0,
            duration: 0,
            elapsed: 0
        };

        // ボブ（歩行時の揺れ、後で実装）
        this.bob = {
            amount: 0.05,
            frequency: 10,
            elapsed: 0
        };

        // スムージング設定（初期値は設定から読み込むが、updateで毎回確認する）
        this.enableSmoothing = settings.get('mouse.smoothCamera');
        this.smoothSpeed = settings.get('mouse.smoothSpeed');

        // 入力スムージング用の現在のデルタ
        this.smoothedDelta = { x: 0, y: 0 };
    }

    /**
     * カメラを更新
     * @param {THREE.Vector3} position - プレイヤーの位置
     * @param {boolean} isCrouching - しゃがんでいるか
     * @param {boolean} isMoving - 移動中か
     * @param {number} deltaTime - 経過時間
     */
    update(position, isCrouching, isMoving, deltaTime) {
        // マウス入力によるカメラ回転
        this.updateRotation(deltaTime);

        // カメラ位置の更新
        this.updatePosition(position, isCrouching, isMoving, deltaTime);

        // カメラの向きを適用
        this.applyRotation();
    }

    /**
     * マウス入力による回転を更新
     * @param {number} deltaTime - 経過時間
     */
    updateRotation(deltaTime) {
        if (!inputManager.isPointerLocked()) {
            return;
        }

        // マウスの移動量を取得
        const mouseDelta = inputManager.getMouseDelta();

        // 異常な移動量を無視（フレーム飛びなどで発生する可能性がある）
        // 1フレームで画面幅の半分以上動くことは稀と仮定
        // 閾値を緩和（1000 -> 10000）: 高DPIマウスでの高速フリックに対応
        if (Math.abs(mouseDelta.x) > 10000 || Math.abs(mouseDelta.y) > 10000) {
            console.warn('Excessive mouse delta detected, ignoring:', mouseDelta);
            return;
        }

        // デバッグ: マウス移動量をログ出力（最初の数回のみ）
        if (!this.debugLogCount) this.debugLogCount = 0;
        if (this.debugLogCount < 5 && (mouseDelta.x !== 0 || mouseDelta.y !== 0)) {
            console.log('Mouse delta:', mouseDelta);
            this.debugLogCount++;
        }

        if (mouseDelta.x === 0 && mouseDelta.y === 0) {
            // 入力がなくてもスムージングのために処理を続行する場合があるが、
            // ここでは入力処理のみを行い、スムージングは後で行う
        }

        // スムージング設定を更新
        this.enableSmoothing = settings.get('mouse.smoothCamera');
        const speed = settings.get('mouse.smoothSpeed');
        // 設定値(1-20程度)を0-1.0の係数に変換
        // speed=10 -> 0.5
        const lerpFactor = clamp(speed * 0.05, 0.01, 1.0);

        let targetDeltaX = mouseDelta.x;
        let targetDeltaY = mouseDelta.y;

        // スムージング適用（入力デルタに対して行う）
        if (this.enableSmoothing) {
            this.smoothedDelta.x = lerp(this.smoothedDelta.x, targetDeltaX, lerpFactor);
            this.smoothedDelta.y = lerp(this.smoothedDelta.y, targetDeltaY, lerpFactor);

            // 非常に小さい値になったら0にする（ドリフト防止）
            if (Math.abs(this.smoothedDelta.x) < 0.01) this.smoothedDelta.x = 0;
            if (Math.abs(this.smoothedDelta.y) < 0.01) this.smoothedDelta.y = 0;
        } else {
            this.smoothedDelta.x = targetDeltaX;
            this.smoothedDelta.y = targetDeltaY;
        }

        // 感度を取得
        const sensitivity = settings.getCalculatedSensitivity();
        const invertY = settings.get('mouse.invertY');

        // 感度を適用（スムージングされたデルタを使用）
        const yawDelta = -this.smoothedDelta.x * sensitivity;
        let pitchDelta = -this.smoothedDelta.y * sensitivity;

        // Y軸反転
        if (invertY) {
            pitchDelta = -pitchDelta;
        }

        // 回転を適用
        this.yaw += yawDelta;
        this.pitch += pitchDelta;

        // ピッチを制限
        this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
    }

    /**
     * カメラ位置を更新
     * @param {THREE.Vector3} position - プレイヤーの位置
     * @param {boolean} isCrouching - しゃがんでいるか
     * @param {boolean} isMoving - 移動中か
     * @param {number} deltaTime - 経過時間
     */
    updatePosition(position, isCrouching, isMoving, deltaTime) {
        // 高さオフセット
        const targetHeight = isCrouching ? this.crouchHeightOffset : this.heightOffset;

        // カメラ位置を設定
        this.camera.position.x = position.x;
        this.camera.position.y = position.y + targetHeight;
        this.camera.position.z = position.z;

        // ボブ効果（歩行時の揺れ）
        if (isMoving && !isCrouching) {
            this.bob.elapsed += deltaTime;
            const bobY = Math.sin(this.bob.elapsed * this.bob.frequency) * this.bob.amount;
            this.camera.position.y += bobY;
        } else {
            this.bob.elapsed = 0;
        }

        // カメラシェイク（射撃時など）
        if (this.shake.duration > 0) {
            this.shake.elapsed += deltaTime;

            if (this.shake.elapsed < this.shake.duration) {
                const shakeIntensity = this.shake.intensity * (1 - this.shake.elapsed / this.shake.duration);
                this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.z += (Math.random() - 0.5) * shakeIntensity;
            } else {
                this.shake.duration = 0;
            }
        }
    }

    /**
     * カメラの向きを適用
     */
    applyRotation() {
        // オイラー角を使用してカメラの向きを設定
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }

    /**
     * カメラの前方向ベクトルを取得
     * @returns {THREE.Vector3} 前方向ベクトル（Y成分は0）
     */
    getForwardVector() {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        // 水平方向のみ（Y成分を0に）
        forward.y = 0;
        forward.normalize();

        return forward;
    }

    /**
     * カメラの右方向ベクトルを取得
     * @returns {THREE.Vector3} 右方向ベクトル
     */
    getRightVector() {
        const forward = this.getForwardVector();
        const right = new THREE.Vector3();

        // 前方向と上方向の外積で右方向を計算
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        right.normalize();

        return right;
    }

    /**
     * カメラの向きベクトルを取得（3D、Y成分含む）
     * @returns {THREE.Vector3} 向きベクトル
     */
    getDirectionVector() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    /**
     * カメラシェイクを追加
     * @param {number} intensity - 強度
     * @param {number} duration - 持続時間（秒）
     */
    addCameraShake(intensity, duration) {
        this.shake.intensity = intensity;
        this.shake.duration = duration;
        this.shake.elapsed = 0;
    }

    /**
     * カメラをリセット
     */
    reset() {
        this.yaw = 0;
        this.pitch = 0;
        this.smoothedDelta = { x: 0, y: 0 };
        this.shake = { intensity: 0, duration: 0, elapsed: 0 };
        this.bob.elapsed = 0;

        this.applyRotation();
    }

    /**
     * FOVを設定
     * @param {number} fov - 視野角（度）
     */
    setFOV(fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            yaw: (this.yaw * 180 / Math.PI).toFixed(2) + '°',
            pitch: (this.pitch * 180 / Math.PI).toFixed(2) + '°',
            delta: `x:${this.smoothedDelta.x.toFixed(2)}, y:${this.smoothedDelta.y.toFixed(2)}`,
            position: {
                x: this.camera.position.x.toFixed(2),
                y: this.camera.position.y.toFixed(2),
                z: this.camera.position.z.toFixed(2)
            },
            forward: this.getForwardVector(),
            right: this.getRightVector()
        };
    }
}

export default CameraController;
