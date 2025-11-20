/**
 * プレイヤー移動システム
 * Valorant準拠の移動、ストッピング、ジャンプ処理
 */

import * as THREE from 'three';
import { VALORANT_CONSTANTS } from '../utils/valorantConst.js';
import { applyFriction, applyCounterStrafing, clamp } from '../utils/math.js';
import inputManager from '../core/input.js';

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
        this.walkSpeed = VALORANT_CONSTANTS.WALK_SPEED;
        this.crouchSpeed = VALORANT_CONSTANTS.CROUCH_SPEED;
        this.friction = VALORANT_CONSTANTS.FRICTION;
        this.deceleration = VALORANT_CONSTANTS.DECELERATION;

        // ジャンプパラメータ
        this.jumpVelocity = VALORANT_CONSTANTS.JUMP_VELOCITY;
        this.gravity = VALORANT_CONSTANTS.GRAVITY;

        // 停止判定
        this.stopSpeed = VALORANT_CONSTANTS.STOP_SPEED;

        // 精度（移動中は低下）
        this.currentAccuracy = 1.0;

        // 地面の高さ
        this.groundLevel = 0;
    }

    /**
     * 移動システムを更新
     * @param {Object} cameraController - カメラコントローラー
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(cameraController, deltaTime) {
        // 入力を取得
        const moveInput = inputManager.getMovementInput();
        const jumpInput = inputManager.isJumping();
        const crouchInput = inputManager.isCrouching();

        // しゃがみ状態
        this.isCrouching = crouchInput;

        // 移動処理
        this.processMovement(moveInput, cameraController, deltaTime);

        // ジャンプ処理
        this.processJump(jumpInput, deltaTime);

        // 重力適用
        this.applyGravity(deltaTime);

        // 位置更新
        this.updatePosition(deltaTime);

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
        const currentSpeed = this.isCrouching ? this.crouchSpeed : this.walkSpeed;

        if (input.x !== 0 || input.z !== 0) {
            // 移動中
            const targetVelocity = moveDirection.multiplyScalar(currentSpeed);

            // 目標速度に向かって加速
            this.velocity.x = targetVelocity.x;
            this.velocity.z = targetVelocity.z;
        } else {
            // 入力がない場合は摩擦で減速
            this.velocity.x = applyFriction(this.velocity.x, this.friction, deltaTime);
            this.velocity.z = applyFriction(this.velocity.z, this.friction, deltaTime);
        }

        // カウンターストラフィング
        const inputVector = { x: input.x, z: input.z };
        const velocityVector = { x: this.velocity.x, z: this.velocity.z };
        const newVelocity = applyCounterStrafing(velocityVector, inputVector, this.deceleration, deltaTime);

        this.velocity.x = newVelocity.x;
        this.velocity.z = newVelocity.z;

        // 完全停止判定
        if (Math.abs(this.velocity.x) < this.stopSpeed) {
            this.velocity.x = 0;
        }
        if (Math.abs(this.velocity.z) < this.stopSpeed) {
            this.velocity.z = 0;
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
        const airControl = VALORANT_CONSTANTS.AIR_CONTROL;
        const airAcceleration = VALORANT_CONSTANTS.AIR_ACCELERATION * deltaTime;

        const targetVelocity = moveDirection.multiplyScalar(this.walkSpeed * airControl);

        this.velocity.x += (targetVelocity.x - this.velocity.x) * airAcceleration;
        this.velocity.z += (targetVelocity.z - this.velocity.z) * airAcceleration;

        // 最大速度制限
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (horizontalSpeed > VALORANT_CONSTANTS.MAX_AIR_SPEED) {
            const scale = VALORANT_CONSTANTS.MAX_AIR_SPEED / horizontalSpeed;
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
     * 位置を更新
     * @param {number} deltaTime - 経過時間
     */
    updatePosition(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;

        // 地面判定
        if (this.position.y <= this.groundLevel) {
            this.position.y = this.groundLevel;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // マップ境界制限（簡易版）
        const mapBoundary = 25; // 50x50マップの半分
        this.position.x = clamp(this.position.x, -mapBoundary, mapBoundary);
        this.position.z = clamp(this.position.z, -mapBoundary, mapBoundary);
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
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

        if (horizontalSpeed < this.stopSpeed) {
            // 停止中
            if (this.isCrouching) {
                this.currentAccuracy = VALORANT_CONSTANTS.ACCURACY_CROUCHING;
            } else {
                this.currentAccuracy = VALORANT_CONSTANTS.ACCURACY_STANDING_STILL;
            }
        } else {
            // 移動中
            this.currentAccuracy = VALORANT_CONSTANTS.ACCURACY_MOVING;
        }

        if (!this.isGrounded) {
            // ジャンプ中
            this.currentAccuracy = VALORANT_CONSTANTS.ACCURACY_JUMPING;
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
