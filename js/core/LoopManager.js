/**
 * KeiryouAIM - LoopManager
 * ゲームループとFPS制御を管理するクラス
 */

export class LoopManager {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.loopId = null;

        // 時間管理
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;

        // FPS制御
        this.fpsLimit = 0; // 0 = 無制限
        this.fpsInterval = 0;

        // コールバック
        this.onUpdate = null;
        this.onRender = null;
    }

    /**
     * ループを開始
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.elapsedTime = 0;

        this._loop();

        console.log('LoopManager: Started');
    }

    /**
     * ループを停止
     */
    stop() {
        this.isRunning = false;
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }
        console.log('LoopManager: Stopped');
    }

    /**
     * 一時停止/再開
     * @param {boolean} paused - 指定しない場合はトグル
     */
    togglePause(paused = null) {
        if (paused === null) {
            this.isPaused = !this.isPaused;
        } else {
            this.isPaused = paused;
        }

        // ポーズ解除時に急激なデルタタイムが発生しないように最終フレーム時間をリセット
        if (!this.isPaused) {
            this.lastFrameTime = performance.now();
        }

        console.log(`LoopManager: ${this.isPaused ? 'Paused' : 'Resumed'}`);
    }

    /**
     * FPS制限を設定
     * @param {number} limit - FPS上限 (0 = 無制限)
     */
    setFPSLimit(limit) {
        this.fpsLimit = limit;
        this.fpsInterval = limit > 0 ? 1000 / limit : 0;
    }

    /**
     * 更新コールバックを設定
     * @param {Function} callback - (deltaTime) => void
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    /**
     * 描画コールバックを設定
     * @param {Function} callback - () => void
     */
    setRenderCallback(callback) {
        this.onRender = callback;
    }

    /**
     * 内部ループ処理
     */
    _loop() {
        if (!this.isRunning) return;

        this.loopId = requestAnimationFrame(this._loop.bind(this));

        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;

        // FPS制限
        if (this.fpsLimit > 0 && elapsed < this.fpsInterval) {
            return;
        }

        // デルタタイム計算 (秒単位)
        // FPS制限がある場合は実際の経過時間ではなくインターバルを使用することで安定させる
        // ただし、極端な遅延（タブ切り替えなど）の場合はcapを設ける
        this.deltaTime = Math.min(elapsed / 1000, 0.1);

        // 次のフレームのために時間を更新
        this.lastFrameTime = currentTime - (this.fpsLimit > 0 ? (elapsed % this.fpsInterval) : 0);

        if (!this.isPaused) {
            this.elapsedTime += this.deltaTime;

            if (this.onUpdate) {
                this.onUpdate(this.deltaTime);
            }
        }

        if (this.onRender) {
            this.onRender();
        }
    }

    /**
     * デバッグ情報を取得
     */
    getInfo() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            fpsLimit: this.fpsLimit,
            deltaTime: this.deltaTime,
            elapsedTime: this.elapsedTime
        };
    }
}

// シングルトンではなく、Gameクラスが必要に応じてインスタンス化することを想定
// ただし、Globalなループが必要な場合はここでexport const loopManager = new LoopManager(); する
