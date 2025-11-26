/**
 * 統計・分析管理システム
 * プレイヤーのパフォーマンスデータを管理・保存
 */

import { ANALYTICS_CONFIG } from '../utils/gameConst.js';

class StatsManager {
    constructor() {
        this.STORAGE_KEY = 'keiryou_aim_stats';

        // デフォルトの統計データ構造
        this.data = {
            totalHits: 0,
            totalMisses: 0,
            totalShots: 0,
            totalHeadshots: 0,
            playTime: 0, // 秒
            sessions: [] // 過去のセッション履歴
        };

        this.currentSession = null;
        this.load();
    }

    /**
     * 統計データを読み込む
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.data = { ...this.data, ...parsed };
            }
        } catch (error) {
            console.error('統計データの読み込みに失敗しました:', error);
        }
    }

    /**
     * 統計データを保存
     */
    save() {
        try {
            // セッション履歴の制限
            if (this.data.sessions.length > ANALYTICS_CONFIG.MAX_SESSIONS_STORED) {
                this.data.sessions = this.data.sessions.slice(-ANALYTICS_CONFIG.MAX_SESSIONS_STORED);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('統計データの保存に失敗しました:', error);
        }
    }

    /**
     * 新しいセッションを開始
     * @param {string} mode - ゲームモード
     */
    startSession(mode) {
        this.currentSession = {
            id: Date.now(),
            date: new Date().toISOString(),
            mode: mode,
            hits: 0,
            misses: 0,
            shots: 0,
            headshots: 0,
            damage: 0,
            startTime: Date.now(),
            endTime: null,
            accuracy: 0,
            currentCombo: 0,
            maxCombo: 0,
            score: 0,
            reactionTimes: [],
            hitPositions: [], // {x, y, z, isHeadshot}
            shotsHistory: [] // {time, hit, accuracy}
        };
    }

    /**
     * ショットを記録
     * @param {Object} result - ショット結果 { hit: boolean, isHeadshot: boolean, damage: number, position: {x, y, z} }
     */
    recordShot(result) {
        if (!this.currentSession) return;

        this.currentSession.shots++;

        if (result.hit) {
            this.currentSession.hits++;
            this.currentSession.damage += result.damage || 0;

            // コンボ加算
            this.currentSession.currentCombo++;
            if (this.currentSession.currentCombo > this.currentSession.maxCombo) {
                this.currentSession.maxCombo = this.currentSession.currentCombo;
            }

            // スコア計算 (基本点100 + コンボボーナス)
            // ヘッドショットならさらにボーナス
            let shotScore = 100;
            if (result.isHeadshot) {
                this.currentSession.headshots++;
                shotScore *= 1.5; // ヘッドショット1.5倍
            }

            // コンボボーナス: (コンボ数 * 10%) 加算
            const comboBonusMultiplier = 1 + (this.currentSession.currentCombo * 0.1);
            this.currentSession.score += Math.round(shotScore * comboBonusMultiplier);

            // ヒット位置を記録
            if (result.position) {
                this.currentSession.hitPositions.push({
                    x: result.position.x,
                    y: result.position.y,
                    z: result.position.z,
                    relative: result.relativePosition || null, // 相対位置を追加
                    isHeadshot: result.isHeadshot
                });
            }
        } else {
            this.currentSession.misses++;

            // コンボリセット
            this.currentSession.currentCombo = 0;

            // ミス位置も記録（壁など）
            if (result.position) {
                this.currentSession.hitPositions.push({
                    x: result.position.x,
                    y: result.position.y,
                    z: result.position.z,
                    relative: result.relativePosition || null, // 相対位置を追加
                    isHeadshot: false,
                    isMiss: true
                });
            }
        }

        // リアルタイム精度の更新
        this.currentSession.accuracy = this.currentSession.hits / this.currentSession.shots;

        // 履歴を記録
        this.currentSession.shotsHistory.push({
            time: (Date.now() - this.currentSession.startTime) / 1000,
            hit: result.hit,
            currentAccuracy: this.currentSession.accuracy
        });
    }

    /**
     * 反応時間を記録
     * @param {number} ms - 反応時間（ミリ秒）
     */
    recordReactionTime(ms) {
        if (!this.currentSession) return;
        this.currentSession.reactionTimes.push(ms);
    }

    /**
     * セッションを終了して保存
     */
    endSession() {
        if (!this.currentSession) return;

        this.currentSession.endTime = Date.now();
        const duration = (this.currentSession.endTime - this.currentSession.startTime) / 1000;

        // セッションの平均反応時間を計算
        if (this.currentSession.reactionTimes.length > 0) {
            const sum = this.currentSession.reactionTimes.reduce((a, b) => a + b, 0);
            this.currentSession.avgReactionTime = sum / this.currentSession.reactionTimes.length;
        } else {
            this.currentSession.avgReactionTime = 0;
        }

        // 総合データへの加算
        this.data.totalHits += this.currentSession.hits;
        this.data.totalMisses += this.currentSession.misses;
        this.data.totalShots += this.currentSession.shots;
        this.data.totalHeadshots += this.currentSession.headshots;
        this.data.playTime += duration;

        // セッション保存
        this.data.sessions.push(this.currentSession);
        this.save();

        const sessionSummary = { ...this.currentSession };
        this.currentSession = null;

        return sessionSummary;
    }

    /**
     * 総合統計を取得
     */
    getTotalStats() {
        const totalAccuracy = this.data.totalShots > 0
            ? (this.data.totalHits / this.data.totalShots)
            : 0;

        const headshotRate = this.data.totalHits > 0
            ? (this.data.totalHeadshots / this.data.totalHits)
            : 0;

        // 全セッションの平均反応時間を計算
        let totalReactionTime = 0;
        let reactionCount = 0;

        this.data.sessions.forEach(session => {
            if (session.reactionTimes && session.reactionTimes.length > 0) {
                const sessionSum = session.reactionTimes.reduce((a, b) => a + b, 0);
                totalReactionTime += sessionSum;
                reactionCount += session.reactionTimes.length;
            }
        });

        const avgReactionTime = reactionCount > 0 ? totalReactionTime / reactionCount : 0;

        return {
            hits: this.data.totalHits,
            shots: this.data.totalShots,
            accuracy: totalAccuracy,
            headshotRate: headshotRate,
            playTime: this.data.playTime,
            avgReactionTime: avgReactionTime
        };
    }

    /**
     * データをクリア
     */
    clearData() {
        this.data = {
            totalHits: 0,
            totalMisses: 0,
            totalShots: 0,
            totalHeadshots: 0,
            playTime: 0,
            sessions: []
        };
        this.save();
    }

    /**
     * データをエクスポート
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }
}

export const statsManager = new StatsManager();
export default statsManager;
