/**
 * 入力処理システム
 * マウスとキーボードの入力を管理
 */

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

        console.log('InputManager initialized');
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
            this.pointerLockElement.requestPointerLock();
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
     */
    onMouseMove(event) {
        if (this.mouse.locked) {
            // Pointer Lock時は movementX/Y を使用
            this.mouse.deltaX += event.movementX || 0;
            this.mouse.deltaY += event.movementY || 0;
        } else {
            // 通常時は clientX/Y
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
    }

    /**
     * Pointer Lock変更イベントハンドラ
     * @private
     */
    onPointerLockChange() {
        this.mouse.locked = document.pointerLockElement === this.pointerLockElement;

        if (this.mouse.locked) {
            console.log('Pointer Lock enabled');
            if (this.onLockCallback) {
                this.onLockCallback();
            }
        } else {
            console.log('Pointer Lock disabled');
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
    }

    /**
     * Pointer Lockコールバックを設定
     * @param {Function} onLock - ロック時のコールバック
     * @param {Function} onUnlock - アンロック時のコールバック
     */
    setPointerLockCallbacks(onLock, onUnlock) {
        this.onLockCallback = onLock;
        this.onUnlockCallback = onUnlock;
    }

    /**
     * WASD入力を取得（正規化されたベクトル）
     * @returns {Object} {x, z} (-1 to 1)
     */
    getMovementInput() {
        let x = 0;
        let z = 0;

        if (this.isKeyDown('KeyW')) z -= 1;
        if (this.isKeyDown('KeyS')) z += 1;
        if (this.isKeyDown('KeyA')) x -= 1;
        if (this.isKeyDown('KeyD')) x += 1;

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
        return this.isKeyPressed('Space');
    }

    /**
     * しゃがみ入力を取得
     * @returns {boolean}
     */
    isCrouching() {
        return this.isKeyDown('ControlLeft') || this.isKeyDown('ControlRight');
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
        return this.isKeyPressed('KeyR');
    }

    /**
     * メニュー開閉入力を取得
     * @returns {boolean}
     */
    isMenuToggle() {
        return this.isKeyPressed('Escape');
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
            pointerLocked: this.mouse.locked
        };
    }
}

// シングルトンインスタンスをエクスポート
export const inputManager = new InputManager();
export default inputManager;
