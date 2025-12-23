/**
 * 入力処理システム
 * マウスとキーボードの入力を管理
 * 
 * 修正内容:
 * - Pointer Lock APIのスパイク値フィルタリングを強化
 * - 前フレームとの変化率チェックを追加
 * - Pointer Lock有効化直後のガード期間を追加
 * - デバッグログオプションを追加
 */

import { settings } from './settings.js';

class InputManager {
    constructor() {
        // キーボード状態
        this.keys = {};
        this.keysPressed = {}; // このフレームで押された
        this.keysReleased = {}; // このフレームで離された

        // マウス状態
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            buttons: {},
            buttonsPressed: {},
            buttonsReleased: {},
            locked: false
        };

        // Pointer Lock状態
        this.pointerLockElement = null;
        this.pointerLockEnabled = false;

        // ======= 新規追加: スパイクフィルタリング用の変数 =======

        // 前回の有効なデルタ値（スパイク検出用）
        this.lastValidDelta = { x: 0, y: 0 };

        // Pointer Lock有効化時刻（ガード期間用）
        this.pointerLockActivatedTime = 0;

        // ガード期間（ミリ秒）- ロック直後はマウス入力を無視
        this.POINTER_LOCK_GUARD_MS = 100;

        // フィルタリング設定
        this.FILTER_CONFIG = {
            // 絶対値の上限閾値（これを超えたら無条件でフィルタ）
            MAX_DELTA: 500,

            // 変化率の閾値（前フレームからの急激な変化を検出）
            // 前回値の何倍以上の変化を異常とみなすか
            MAX_DELTA_RATIO: 8.0,

            // 変化率チェックの最小値（小さい値からの変化は比率が大きくなりすぎるため）
            MIN_DELTA_FOR_RATIO_CHECK: 5,

            // 連続フィルタ回数の上限（連続でフィルタされたらリセット）
            MAX_CONSECUTIVE_FILTERS: 3,

            // デバッグログを出力するか
            DEBUG_LOG: false
        };

        // 連続フィルタカウント
        this.consecutiveFilterCount = 0;

        // ======= 既存コード =======

        // イベントリスナーのバインド
        this.boundHandlers = {
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this),
            mouseDown: this.onMouseDown.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            pointerLockChange: this.onPointerLockChange.bind(this),
            pointerLockError: this.onPointerLockError.bind(this)
        };

        // コールバック
        this.onLockCallback = null;
        this.onUnlockCallback = null;
        this.onErrorCallback = null;
    }

    /**
     * 入力システムを初期化
     * @param {HTMLElement} element - Pointer Lockを適用する要素（通常はcanvas）
     */
    init(element) {
        this.pointerLockElement = element;

        // キーボードイベント
        document.addEventListener('keydown', this.boundHandlers.keyDown);
        document.addEventListener('keyup', this.boundHandlers.keyUp);

        // マウスイベント
        document.addEventListener('mousedown', this.boundHandlers.mouseDown);
        document.addEventListener('mouseup', this.boundHandlers.mouseUp);
        document.addEventListener('mousemove', this.boundHandlers.mouseMove);

        // Pointer Lockイベント
        document.addEventListener('pointerlockchange', this.boundHandlers.pointerLockChange);
        document.addEventListener('pointerlockerror', this.boundHandlers.pointerLockError);

        console.log('InputManager initialized with enhanced spike filtering');
    }

    /**
     * リソースを解放
     */
    dispose() {
        document.removeEventListener('keydown', this.boundHandlers.keyDown);
        document.removeEventListener('keyup', this.boundHandlers.keyUp);
        document.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        document.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        document.removeEventListener('pointerlockchange', this.boundHandlers.pointerLockChange);
        document.removeEventListener('pointerlockerror', this.boundHandlers.pointerLockError);
    }

    /**
     * 入力状態をリセット
     */
    reset() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.buttons = {};
        this.mouse.buttonsPressed = {};
        this.mouse.buttonsReleased = {};
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;

        // スパイクフィルタ用の状態もリセット
        this.lastValidDelta = { x: 0, y: 0 };
        this.consecutiveFilterCount = 0;
    }

    /**
     * フレームごとの更新（keysPressed/Releasedをクリア）
     */
    update() {
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.buttonsPressed = {};
        this.mouse.buttonsReleased = {};
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }

    /**
     * キーが押されているか
     * @param {string} key - キー名
     * @returns {boolean}
     */
    isKeyDown(key) {
        return this.keys[key] === true;
    }

    /**
     * キーがこのフレームで押されたか
     * @param {string} key - キー名
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keysPressed[key] === true;
    }

    /**
     * キーがこのフレームで離されたか
     * @param {string} key - キー名
     * @returns {boolean}
     */
    isKeyReleased(key) {
        return this.keysReleased[key] === true;
    }

    /**
     * マウスボタンが押されているか
     * @param {number} button - ボタン番号（0: 左, 1: 中, 2: 右）
     * @returns {boolean}
     */
    isMouseDown(button) {
        return this.mouse.buttons[button] === true;
    }

    /**
     * マウスボタンがこのフレームで押されたか
     * @param {number} button - ボタン番号
     * @returns {boolean}
     */
    isMousePressed(button) {
        return this.mouse.buttonsPressed[button] === true;
    }

    /**
     * マウスボタンがこのフレームで離されたか
     * @param {number} button - ボタン番号
     * @returns {boolean}
     */
    isMouseReleased(button) {
        return this.mouse.buttonsReleased[button] === true;
    }

    /**
     * マウスの移動量を取得
     * @returns {Object} {x, y}
     */
    getMouseDelta() {
        return {
            x: this.mouse.deltaX,
            y: this.mouse.deltaY
        };
    }

    /**
     * Pointer Lockをリクエスト
     */
    requestPointerLock() {
        if (this.pointerLockElement) {
            const promise = this.pointerLockElement.requestPointerLock();
            // Chrome 88+ returns a promise
            if (promise && promise.catch) {
                promise.catch(err => {
                    console.warn('Pointer Lock request failed:', err);
                    this.onPointerLockError();
                });
            }
        }
    }

    /**
     * Pointer Lockを解除
     */
    exitPointerLock() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    /**
     * Pointer Lockが有効か
     * @returns {boolean}
     */
    isPointerLocked() {
        return this.mouse.locked;
    }

    /**
     * キー押下イベントハンドラ
     * @private
     */
    onKeyDown(event) {
        const key = event.code;

        if (!this.keys[key]) {
            this.keysPressed[key] = true;
        }

        this.keys[key] = true;

        // デフォルトの挙動を防ぐ（スペースキーでスクロールなど）
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            event.preventDefault();
        }
    }

    /**
     * キー解放イベントハンドラ
     * @private
     */
    onKeyUp(event) {
        const key = event.code;

        this.keys[key] = false;
        this.keysReleased[key] = true;
    }

    /**
     * マウスボタン押下イベントハンドラ
     * @private
     */
    onMouseDown(event) {
        const button = event.button;

        if (!this.mouse.buttons[button]) {
            this.mouse.buttonsPressed[button] = true;
        }

        this.mouse.buttons[button] = true;

        // Pointer Lockがまだの場合はリクエスト（有効な場合のみ）
        if (!this.mouse.locked && this.pointerLockElement && this.pointerLockEnabled) {
            this.requestPointerLock();
        }
    }

    /**
     * マウスボタン解放イベントハンドラ
     * @private
     */
    onMouseUp(event) {
        const button = event.button;

        this.mouse.buttons[button] = false;
        this.mouse.buttonsReleased[button] = true;
    }

    /**
     * マウス移動イベントハンドラ
     * @private
     * 
     * 【重要】Pointer Lock APIのバグ対策
     * 
     * Chrome/Firefox等のブラウザでは、Pointer Lock中にマウスカーソルが
     * 画面端に到達して中央にリセットされる際、movementX/Yに異常に大きな値
     * （スパイク値）が発生することがあります。
     * 
     * このバグは以下の状況で発生しやすい：
     * 1. マウスを高速で動かしたとき
     * 2. Pointer Lock有効化直後
     * 3. ブラウザのフレームレートが不安定なとき
     * 
     * 対策として、複数のフィルタリング手法を組み合わせて実装しています。
     */
    onMouseMove(event) {
        if (this.mouse.locked) {
            // Pointer Lock時は movementX/Y を使用
            let newDeltaX = event.movementX || 0;
            let newDeltaY = event.movementY || 0;

            // ======= フィルタリング処理 =======
            const filterResult = this.filterMouseDelta(newDeltaX, newDeltaY);

            if (filterResult.filtered) {
                // 異常値は無視
                newDeltaX = 0;
                newDeltaY = 0;
            } else {
                // 正常値として記録
                this.lastValidDelta = { x: newDeltaX, y: newDeltaY };
                this.consecutiveFilterCount = 0;
            }

            this.mouse.deltaX = newDeltaX;
            this.mouse.deltaY = newDeltaY;
        } else {
            // 通常時は clientX/Y
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
    }

    /**
     * マウスデルタ値のフィルタリング
     * @private
     * @param {number} deltaX - X方向の移動量
     * @param {number} deltaY - Y方向の移動量
     * @returns {Object} { filtered: boolean, reason: string }
     */
    filterMouseDelta(deltaX, deltaY) {
        const config = this.FILTER_CONFIG;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // 1. Pointer Lock有効化直後のガード期間チェック
        const timeSinceLock = performance.now() - this.pointerLockActivatedTime;
        if (timeSinceLock < this.POINTER_LOCK_GUARD_MS) {
            if (config.DEBUG_LOG) {
                console.log(`[Input] Guard period active (${timeSinceLock.toFixed(0)}ms): delta=(${deltaX}, ${deltaY})`);
            }
            return { filtered: true, reason: 'guard_period' };
        }

        // 2. 絶対値の閾値チェック
        if (absX > config.MAX_DELTA || absY > config.MAX_DELTA) {
            this.consecutiveFilterCount++;

            if (config.DEBUG_LOG) {
                console.warn(`[Input] Absolute threshold exceeded: (${deltaX}, ${deltaY}) > ${config.MAX_DELTA}`);
            }

            // 連続でフィルタされすぎた場合は、ユーザーが本当に高速で動かしている可能性
            if (this.consecutiveFilterCount >= config.MAX_CONSECUTIVE_FILTERS) {
                if (config.DEBUG_LOG) {
                    console.log(`[Input] Consecutive filter limit reached, resetting baseline`);
                }
                // ベースラインをリセットして次回は通す
                this.lastValidDelta = { x: 0, y: 0 };
                this.consecutiveFilterCount = 0;
            }

            return { filtered: true, reason: 'absolute_threshold' };
        }

        // 3. 変化率チェック（急激な加速を検出）
        const lastAbsX = Math.abs(this.lastValidDelta.x);
        const lastAbsY = Math.abs(this.lastValidDelta.y);

        // 前回値が十分大きい場合のみ比率チェックを行う
        if (lastAbsX >= config.MIN_DELTA_FOR_RATIO_CHECK ||
            lastAbsY >= config.MIN_DELTA_FOR_RATIO_CHECK) {

            // X方向の変化率
            if (lastAbsX >= config.MIN_DELTA_FOR_RATIO_CHECK) {
                const ratioX = absX / lastAbsX;
                if (ratioX > config.MAX_DELTA_RATIO) {
                    this.consecutiveFilterCount++;

                    if (config.DEBUG_LOG) {
                        console.warn(`[Input] X ratio spike: ${ratioX.toFixed(1)}x (${lastAbsX} -> ${absX})`);
                    }
                    return { filtered: true, reason: 'ratio_spike_x' };
                }
            }

            // Y方向の変化率
            if (lastAbsY >= config.MIN_DELTA_FOR_RATIO_CHECK) {
                const ratioY = absY / lastAbsY;
                if (ratioY > config.MAX_DELTA_RATIO) {
                    this.consecutiveFilterCount++;

                    if (config.DEBUG_LOG) {
                        console.warn(`[Input] Y ratio spike: ${ratioY.toFixed(1)}x (${lastAbsY} -> ${absY})`);
                    }
                    return { filtered: true, reason: 'ratio_spike_y' };
                }
            }
        }

        // 4. 方向の急激な反転チェック（オプション）
        // 前フレームと今フレームで方向が逆かつ両方とも大きい値の場合
        const signChangeX = (this.lastValidDelta.x * deltaX) < 0;
        const signChangeY = (this.lastValidDelta.y * deltaY) < 0;

        const DIRECTION_CHANGE_THRESHOLD = 50; // この閾値以上で方向反転は疑わしい

        if (signChangeX && lastAbsX > DIRECTION_CHANGE_THRESHOLD && absX > DIRECTION_CHANGE_THRESHOLD) {
            if (config.DEBUG_LOG) {
                console.warn(`[Input] Suspicious X direction change: ${this.lastValidDelta.x} -> ${deltaX}`);
            }
            // 方向反転は必ずしも異常ではないので、警告のみでフィルタはしない
            // 必要に応じてここでreturnしてフィルタ可能
        }

        // 全てのチェックをパス
        return { filtered: false, reason: null };
    }

    /**
     * Pointer Lock変更イベントハンドラ
     * @private
     */
    onPointerLockChange() {
        const wasLocked = this.mouse.locked;
        this.mouse.locked = document.pointerLockElement === this.pointerLockElement;

        if (this.mouse.locked) {
            console.log('Pointer Lock enabled');

            // ロック有効化時刻を記録（ガード期間用）
            this.pointerLockActivatedTime = performance.now();

            // 前回のデルタ値をリセット
            this.lastValidDelta = { x: 0, y: 0 };
            this.consecutiveFilterCount = 0;

            if (this.onLockCallback) {
                this.onLockCallback();
            }
        } else {
            console.log('Pointer Lock disabled');

            // ロック解除時もリセット
            this.lastValidDelta = { x: 0, y: 0 };
            this.consecutiveFilterCount = 0;

            if (this.onUnlockCallback) {
                this.onUnlockCallback();
            }
        }
    }

    /**
     * Pointer Lockエラーイベントハンドラ
     * @private
     */
    onPointerLockError() {
        console.error('Pointer Lock error');
        if (this.onErrorCallback) {
            this.onErrorCallback();
        }
    }

    /**
     * Pointer Lockコールバックを設定
     * @param {Function} onLock - ロック時のコールバック
     * @param {Function} onUnlock - アンロック時のコールバック
     */
    setPointerLockCallbacks(onLock, onUnlock, onError) {
        this.onLockCallback = onLock;
        this.onUnlockCallback = onUnlock;
        this.onErrorCallback = onError;
    }

    /**
     * WASD入力を取得（正規化されたベクトル）
     * @returns {Object} {x, z} (-1 to 1)
     */
    getMovementInput() {
        let x = 0;
        let z = 0;

        const forwardKey = settings.get('keybindings.forward');
        const backwardKey = settings.get('keybindings.backward');
        const leftKey = settings.get('keybindings.left');
        const rightKey = settings.get('keybindings.right');

        if (this.isKeyDown(forwardKey)) z -= 1;
        if (this.isKeyDown(backwardKey)) z += 1;
        if (this.isKeyDown(leftKey)) x -= 1;
        if (this.isKeyDown(rightKey)) x += 1;

        // 正規化（斜め移動が速くならないように）
        const length = Math.sqrt(x * x + z * z);
        if (length > 0) {
            x /= length;
            z /= length;
        }

        return { x, z };
    }

    /**
     * ジャンプ入力を取得
     * @returns {boolean}
     */
    isJumping() {
        return this.isKeyPressed(settings.get('keybindings.jump'));
    }

    /**
     * しゃがみ入力を取得
     * @returns {boolean}
     */
    isCrouching() {
        const crouchKey = settings.get('keybindings.crouch');
        return this.isKeyDown(crouchKey);
    }

    /**
     * 歩き（Shift）入力を取得
     * @returns {boolean}
     */
    isWalking() {
        const walkKey = settings.get('keybindings.walk');
        return this.isKeyDown(walkKey);
    }

    /**
     * 射撃入力を取得
     * @returns {boolean}
     */
    isShooting() {
        return this.isMouseDown(0); // 左クリック
    }

    /**
     * 射撃開始を取得
     * @returns {boolean}
     */
    isShootingStarted() {
        return this.isMousePressed(0);
    }

    /**
     * リロード入力を取得
     * @returns {boolean}
     */
    isReloading() {
        return this.isKeyPressed(settings.get('keybindings.reload'));
    }

    /**
     * メニュー開閉入力を取得
     * @returns {boolean}
     */
    isMenuToggle() {
        return this.isKeyPressed(settings.get('keybindings.menu'));
    }

    /**
     * フィルタリング設定を更新
     * @param {Object} config - 設定オブジェクト
     */
    setFilterConfig(config) {
        Object.assign(this.FILTER_CONFIG, config);
    }

    /**
     * デバッグログを有効/無効にする
     * @param {boolean} enabled
     */
    setDebugLog(enabled) {
        this.FILTER_CONFIG.DEBUG_LOG = enabled;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            keysDown: Object.keys(this.keys).filter(k => this.keys[k]),
            mouseButtons: Object.keys(this.mouse.buttons).filter(b => this.mouse.buttons[b]),
            mouseDelta: { x: this.mouse.deltaX, y: this.mouse.deltaY },
            lastValidDelta: this.lastValidDelta,
            consecutiveFilterCount: this.consecutiveFilterCount,
            pointerLocked: this.mouse.locked,
            filterConfig: this.FILTER_CONFIG
        };
    }
}

// シングルトンインスタンスをエクスポート
export const inputManager = new InputManager();
export default inputManager;
