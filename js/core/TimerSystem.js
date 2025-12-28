/**
 * KeiryouAIM - TimerSystem
 * ゲーム内時間を基準としたタイマー管理システム
 * ポーズ中にタイマーも停止するように制御する
 */

export class TimerSystem {
    constructor() {
        this.timers = [];
        this.idCounter = 0;
    }

    /**
     * タイマーを更新
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(deltaTime) {
        if (this.timers.length === 0) return;

        // 完了したタイマーを削除するためにフィルタリング
        this.timers = this.timers.filter(timer => {
            timer.elapsed += deltaTime;

            if (timer.elapsed >= timer.duration) {
                // コールバック実行
                if (timer.callback) {
                    timer.callback();
                }

                // リピート設定がある場合は時間をリセットして残す
                if (timer.loop) {
                    timer.elapsed -= timer.duration;
                    return true;
                }

                // 完了したら削除
                return false;
            }
            return true;
        });
    }

    /**
     * 遅延実行 (setTimeoutの代替)
     * @param {Function} callback 
     * @param {number} duration - 遅延時間（秒） NOTE: setTimeoutのmsではなく秒
     * @returns {number} timerId
     */
    addTimer(duration, callback) {
        const id = ++this.idCounter;
        this.timers.push({
            id,
            duration,
            callback,
            elapsed: 0,
            loop: false
        });
        return id;
    }

    /**
     * 繰り返し実行 (setIntervalの代替)
     * @param {Function} callback 
     * @param {number} interval - 間隔（秒）
     * @returns {number} timerId
     */
    addInterval(interval, callback) {
        const id = ++this.idCounter;
        this.timers.push({
            id,
            duration: interval,
            callback,
            elapsed: 0,
            loop: true
        });
        return id;
    }

    /**
     * タイマーを削除
     * @param {number} id 
     */
    removeTimer(id) {
        this.timers = this.timers.filter(t => t.id !== id);
    }

    /**
     * 全タイマーをクリア
     */
    clearAll() {
        this.timers = [];
    }
}
