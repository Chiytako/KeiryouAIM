/**
 * 統計・分析管理システム
 * プレイヤーのパフォーマンスデータを管理・保存
 */

import { ANALYTICS_CONFIG } from '../utils/gameConst.js';

class StatsManager {
    constructor() {
        this.STORAGE_KEY = 'keiryou_aim_stats';

        // デフォルトの統計データ構造
        // デフォルトの統計データ構造
        this.data = {
            totalHits: 0,
            totalMisses: 0,
            totalShots: 0,
            totalHeadshots: 0,
            playTime: 0, // 秒
            sessions: [], // 過去のセッション履歴

            // 日別統計
            dailyStats: {},  // キー: "YYYY-MM-DD", 値: { sessions, totalTime, hits, shots, avgAccuracy, avgReaction }

            // スキルレーティング履歴
            skillHistory: [],  // { date, ratings: { accuracy, reaction, flick, tracking, consistency }, overall }

            // ストリーク情報
            streak: {
                current: 0,
                best: 0,
                lastPlayedDate: null
            },

            // パーソナルベスト
            personalBests: {
                accuracy: { value: 0, date: null, mode: null, sessionId: null },
                reactionTime: { value: Infinity, date: null, mode: null, sessionId: null },
                headshotRate: { value: 0, date: null, mode: null, sessionId: null },
                combo: { value: 0, date: null, mode: null, sessionId: null },
                score: { value: 0, date: null, mode: null, sessionId: null }
            }
        };

        this.currentSession = null;
        this.load();
    }

    /**
     * 統計データを読み込む
     */
    /**
     * 統計データを読み込む
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // 既存のデータ構造を維持しつつマージ（簡易的なディープマージ）
                // 既存のデータ構造を維持しつつマージ（簡易的なディープマージ）
                this.data = {
                    ...this.data,
                    ...parsed,
                    // セッション配列はそのまま上書き（または結合）
                    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
                    // オブジェクト型のプロパティをマージ（存在しない場合はデフォルトを使用）
                    dailyStats: parsed.dailyStats || this.data.dailyStats,
                    skillHistory: Array.isArray(parsed.skillHistory) ? parsed.skillHistory : this.data.skillHistory,
                    streak: { ...this.data.streak, ...(parsed.streak || {}) },
                    personalBests: { ...this.data.personalBests, ...(parsed.personalBests || {}) }
                };

                // 数値型の安全性確保
                this.data.totalHits = Number(this.data.totalHits) || 0;
                this.data.totalMisses = Number(this.data.totalMisses) || 0;
                this.data.totalShots = Number(this.data.totalShots) || 0;
                this.data.totalHeadshots = Number(this.data.totalHeadshots) || 0;
                this.data.playTime = Number(this.data.playTime) || 0;
            }
        } catch (error) {
            console.error('統計データの読み込みに失敗しました:', error);
            // 読み込み失敗時はデフォルト値を維持
        }
    }

    /**
     * 統計データを保存
     */
    /**
     * 統計データを保存
     */
    save() {
        try {
            // セッション履歴の制限
            if (this.data.sessions.length > ANALYTICS_CONFIG.MAX_SESSIONS_STORED) {
                this.data.sessions = this.data.sessions.slice(-ANALYTICS_CONFIG.MAX_SESSIONS_STORED);
            }

            const dataString = JSON.stringify(this.data);
            localStorage.setItem(this.STORAGE_KEY, dataString);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.warn('LocalStorageの容量制限に達しました。古いセッションを削除して再試行します。');
                // 古いセッションを半分削除して再試行
                if (this.data.sessions.length > 0) {
                    this.data.sessions = this.data.sessions.slice(-Math.floor(this.data.sessions.length / 2));
                    this.save(); // 再帰呼び出し
                }
            } else {
                console.error('統計データの保存に失敗しました:', error);
            }
        }
    }

    /**
     * 今日の日付文字列を取得（YYYY-MM-DD形式）
     */
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * ストリークを更新
     * セッション開始時に呼び出す
     */
    updateStreak() {
        const today = this.getTodayString();
        const lastPlayed = this.data.streak.lastPlayedDate;

        if (!lastPlayed) {
            // 初回プレイ
            this.data.streak.current = 1;
            this.data.streak.lastPlayedDate = today;
        } else if (lastPlayed === today) {
            // 今日すでにプレイ済み - 何もしない
        } else {
            // 日付計算
            const lastDate = new Date(lastPlayed);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // 連続
                this.data.streak.current++;
            } else {
                // 途切れた
                this.data.streak.current = 1;
            }

            this.data.streak.lastPlayedDate = today;
        }

        // ベスト更新チェック
        if (this.data.streak.current > this.data.streak.best) {
            this.data.streak.best = this.data.streak.current;
        }

        this.save();
    }

    /**
     * ストリーク情報を取得
     */
    getStreak() {
        // 最終プレイ日が昨日より前なら、currentは0として返す（表示用）
        const today = this.getTodayString();
        const lastPlayed = this.data.streak.lastPlayedDate;

        if (!lastPlayed) {
            return { current: 0, best: this.data.streak.best };
        }

        const lastDate = new Date(lastPlayed);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // 途切れている（まだupdateStreakが呼ばれていない）
            return { current: 0, best: this.data.streak.best };
        }

        return {
            current: this.data.streak.current,
            best: this.data.streak.best
        };
    }

    /**
     * 新しいセッションを開始
     * @param {string} mode - ゲームモード
     */
    startSession(mode) {
        this.updateStreak();

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
     * 日別統計を更新
     * endSession()から呼び出す
     */
    updateDailyStats(session) {
        const today = this.getTodayString();

        if (!this.data.dailyStats[today]) {
            this.data.dailyStats[today] = {
                sessions: 0,
                totalTime: 0,
                hits: 0,
                shots: 0,
                headshots: 0,
                totalAccuracy: 0,
                totalReaction: 0,
                reactionCount: 0
            };
        }

        const daily = this.data.dailyStats[today];
        daily.sessions++;
        daily.totalTime += (session.endTime - session.startTime) / 1000;
        daily.hits += session.hits;
        daily.shots += session.shots;
        daily.headshots += session.headshots;
        daily.totalAccuracy += session.accuracy;

        if (session.avgReactionTime > 0) {
            daily.totalReaction += session.avgReactionTime;
            daily.reactionCount++;
        }
    }

    /**
     * 週間プレイ時間を取得（秒）
     */
    getWeeklyPlayTime() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let totalTime = 0;

        Object.entries(this.data.dailyStats).forEach(([dateStr, stats]) => {
            const date = new Date(dateStr);
            if (date >= weekAgo) {
                totalTime += stats.totalTime;
            }
        });

        return totalTime;
    }

    /**
     * 週間サマリーを取得
     */
    getWeeklySummary() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 今週の集計
        let thisWeek = { sessions: 0, time: 0, hits: 0, shots: 0, headshots: 0, accuracy: 0, reaction: 0, reactionCount: 0 };
        // 先週の集計
        let lastWeek = { sessions: 0, time: 0, hits: 0, shots: 0, headshots: 0, accuracy: 0, reaction: 0, reactionCount: 0 };

        Object.entries(this.data.dailyStats).forEach(([dateStr, stats]) => {
            const date = new Date(dateStr);

            if (date >= weekAgo) {
                thisWeek.sessions += stats.sessions;
                thisWeek.time += stats.totalTime;
                thisWeek.hits += stats.hits;
                thisWeek.shots += stats.shots;
                thisWeek.headshots += stats.headshots;
                thisWeek.accuracy += stats.totalAccuracy;
                if (stats.reactionCount > 0) {
                    thisWeek.reaction += stats.totalReaction;
                    thisWeek.reactionCount += stats.reactionCount;
                }
            } else if (date >= twoWeeksAgo) {
                lastWeek.sessions += stats.sessions;
                lastWeek.time += stats.totalTime;
                lastWeek.hits += stats.hits;
                lastWeek.shots += stats.shots;
                lastWeek.accuracy += stats.totalAccuracy;
                if (stats.reactionCount > 0) {
                    lastWeek.reaction += stats.totalReaction;
                    lastWeek.reactionCount += stats.reactionCount;
                }
            }
        });

        // 平均計算
        const thisWeekAvgAccuracy = thisWeek.sessions > 0 ? thisWeek.accuracy / thisWeek.sessions : 0;
        const lastWeekAvgAccuracy = lastWeek.sessions > 0 ? lastWeek.accuracy / lastWeek.sessions : 0;
        const thisWeekAvgReaction = thisWeek.reactionCount > 0 ? thisWeek.reaction / thisWeek.reactionCount : 0;
        const lastWeekAvgReaction = lastWeek.reactionCount > 0 ? lastWeek.reaction / lastWeek.reactionCount : 0;

        return {
            sessions: thisWeek.sessions,
            playTime: thisWeek.time,
            avgAccuracy: thisWeekAvgAccuracy,
            avgReaction: thisWeekAvgReaction,
            accuracyChange: thisWeekAvgAccuracy - lastWeekAvgAccuracy,
            reactionChange: thisWeekAvgReaction - lastWeekAvgReaction,
            sessionChange: thisWeek.sessions - lastWeek.sessions
        };
    }

    /**
     * パーソナルベストをチェック・更新
     * endSession()から呼び出す
     * @returns {Array} 更新されたベストのキー配列
     */
    checkPersonalBests(session) {
        const updated = [];
        const today = this.getTodayString();

        // 精度
        if (session.accuracy > this.data.personalBests.accuracy.value) {
            this.data.personalBests.accuracy = {
                value: session.accuracy,
                date: today,
                mode: session.mode,
                sessionId: session.id
            };
            updated.push('accuracy');
        }

        // 反応時間（低いほど良い）
        if (session.avgReactionTime > 0 && session.avgReactionTime < this.data.personalBests.reactionTime.value) {
            this.data.personalBests.reactionTime = {
                value: session.avgReactionTime,
                date: today,
                mode: session.mode,
                sessionId: session.id
            };
            updated.push('reactionTime');
        }

        // ヘッドショット率
        const hsRate = session.hits > 0 ? session.headshots / session.hits : 0;
        if (hsRate > this.data.personalBests.headshotRate.value && session.hits >= 5) { // 最低5ヒット必要
            this.data.personalBests.headshotRate = {
                value: hsRate,
                date: today,
                mode: session.mode,
                sessionId: session.id
            };
            updated.push('headshotRate');
        }

        // 最大コンボ
        if (session.maxCombo > this.data.personalBests.combo.value) {
            this.data.personalBests.combo = {
                value: session.maxCombo,
                date: today,
                mode: session.mode,
                sessionId: session.id
            };
            updated.push('combo');
        }

        // スコア
        if (session.score > this.data.personalBests.score.value) {
            this.data.personalBests.score = {
                value: session.score,
                date: today,
                mode: session.mode,
                sessionId: session.id
            };
            updated.push('score');
        }

        return updated;
    }

    /**
     * パーソナルベストを取得
     */
    getPersonalBests() {
        return this.data.personalBests;
    }

    /**
     * スキルレーティングを計算
     * @param {number} recentCount - 計算に使う直近セッション数
     */
    calculateSkillRating(recentCount = 20) {
        const sessions = this.data.sessions.slice(-recentCount);

        if (sessions.length === 0) {
            return {
                accuracy: 0,
                reaction: 0,
                flick: 0,
                tracking: 0,
                consistency: 0,
                overall: 0,
                weeklyChange: 0
            };
        }

        // 精度スコア（0-100）: 平均精度 * 100
        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
        const accuracyScore = Math.min(100, avgAccuracy * 100);

        // 反応速度スコア（0-100）: 200ms = 100点, 500ms = 0点 として線形補間
        const validReactionSessions = sessions.filter(s => s.avgReactionTime > 0);
        let reactionScore = 50; // デフォルト
        if (validReactionSessions.length > 0) {
            const avgReaction = validReactionSessions.reduce((sum, s) => sum + s.avgReactionTime, 0) / validReactionSessions.length;
            reactionScore = Math.max(0, Math.min(100, (500 - avgReaction) / 3));
        }

        // フリックスコア: MICROFLICKとMULTIFLICKモードの成績
        const flickSessions = sessions.filter(s => s.mode === 'MICROFLICK' || s.mode === 'MULTIFLICK');
        let flickScore = 50;
        if (flickSessions.length > 0) {
            const flickAccuracy = flickSessions.reduce((sum, s) => sum + s.accuracy, 0) / flickSessions.length;
            flickScore = Math.min(100, flickAccuracy * 110); // フリックは難しいので補正
        }

        // トラッキングスコア: TRACKINGモードの成績
        const trackingSessions = sessions.filter(s => s.mode === 'TRACKING');
        let trackingScore = 50;
        if (trackingSessions.length > 0) {
            const trackingAccuracy = trackingSessions.reduce((sum, s) => sum + s.accuracy, 0) / trackingSessions.length;
            trackingScore = Math.min(100, trackingAccuracy * 100);
        }

        // 安定性スコア: 精度の標準偏差が小さいほど高い
        let consistencyScore = 50;
        if (sessions.length >= 3) {
            const accuracies = sessions.map(s => s.accuracy);
            const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
            const variance = accuracies.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / accuracies.length;
            const stdDev = Math.sqrt(variance);
            // 標準偏差0.05以下 = 100点, 0.3以上 = 0点
            consistencyScore = Math.max(0, Math.min(100, (0.3 - stdDev) / 0.25 * 100));
        }

        // 総合スコア（加重平均）
        const overall = Math.round(
            accuracyScore * 0.3 +
            reactionScore * 0.25 +
            flickScore * 0.2 +
            trackingScore * 0.1 +
            consistencyScore * 0.15
        );

        // 週間変化を計算
        const weeklyChange = this.calculateWeeklyRatingChange(overall);

        return {
            accuracy: Math.round(accuracyScore),
            reaction: Math.round(reactionScore),
            flick: Math.round(flickScore),
            tracking: Math.round(trackingScore),
            consistency: Math.round(consistencyScore),
            overall,
            weeklyChange
        };
    }

    /**
     * 週間レーティング変化を計算
     */
    calculateWeeklyRatingChange(currentOverall) {
        // 1週間前のスキル履歴を探す
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const oldEntry = this.data.skillHistory.find(h => h.date <= weekAgo);

        if (oldEntry) {
            return currentOverall - oldEntry.overall;
        }

        return 0;
    }

    /**
     * スキル履歴を保存（1日1回）
     */
    saveSkillHistory() {
        const today = this.getTodayString();

        // 今日すでに保存済みなら更新
        const existingIndex = this.data.skillHistory.findIndex(h => h.date === today);
        const rating = this.calculateSkillRating();

        const entry = {
            date: today,
            ratings: {
                accuracy: rating.accuracy,
                reaction: rating.reaction,
                flick: rating.flick,
                tracking: rating.tracking,
                consistency: rating.consistency
            },
            overall: rating.overall
        };

        if (existingIndex >= 0) {
            this.data.skillHistory[existingIndex] = entry;
        } else {
            this.data.skillHistory.push(entry);
        }

        // 古いデータは削除（90日分のみ保持）
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        this.data.skillHistory = this.data.skillHistory.filter(h => h.date >= cutoff);

        this.save();
    }

    /**
     * 成長データを取得（グラフ用）
     * @param {number} weeks - 取得する週数
     */
    getGrowthData(weeks = 4) {
        const data = [];
        const now = new Date();

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

            const weekStartStr = weekStart.toISOString().split('T')[0];
            const weekEndStr = weekEnd.toISOString().split('T')[0];

            // この週のスキル履歴を取得
            const weekHistory = this.data.skillHistory.filter(h => h.date >= weekStartStr && h.date < weekEndStr);

            if (weekHistory.length > 0) {
                // 週の最後の値を使用
                const lastEntry = weekHistory[weekHistory.length - 1];
                data.push({
                    week: `${weeks - i}週前`,
                    ...lastEntry.ratings,
                    overall: lastEntry.overall
                });
            } else {
                data.push({
                    week: `${weeks - i}週前`,
                    accuracy: null,
                    reaction: null,
                    flick: null,
                    tracking: null,
                    consistency: null,
                    overall: null
                });
            }
        }

        return data;
    }

    /**
     * セッション内分析を計算
     */
    calculateSessionAnalysis(session) {
        const history = session.shotsHistory || [];

        if (history.length === 0) {
            return {
                firstHalf: { accuracy: 0, avgReaction: 0 },
                secondHalf: { accuracy: 0, avgReaction: 0 },
                reactionDistribution: [],
                maxCombo: 0,
                maxMissStreak: 0
            };
        }

        // 前半・後半を分割
        const midPoint = Math.floor(history.length / 2);
        const firstHalf = history.slice(0, midPoint);
        const secondHalf = history.slice(midPoint);

        const calcHalfStats = (half) => {
            if (half.length === 0) return { accuracy: 0, hits: 0, total: 0 };
            const hits = half.filter(s => s.hit).length;
            return {
                accuracy: hits / half.length,
                hits: hits,
                total: half.length
            };
        };

        // 反応時間の分布（50ms刻み、100-500ms）
        const reactionTimes = session.reactionTimes || [];
        const distribution = [];
        for (let i = 100; i <= 500; i += 50) {
            const count = reactionTimes.filter(r => r >= i && r < i + 50).length;
            distribution.push({ range: `${i}-${i + 49}`, count });
        }

        // 連続ヒット・ミスの最長
        let maxCombo = 0;
        let maxMissStreak = 0;
        let currentCombo = 0;
        let currentMissStreak = 0;

        history.forEach(shot => {
            if (shot.hit) {
                currentCombo++;
                maxCombo = Math.max(maxCombo, currentCombo);
                currentMissStreak = 0;
            } else {
                currentMissStreak++;
                maxMissStreak = Math.max(maxMissStreak, currentMissStreak);
                currentCombo = 0;
            }
        });

        return {
            firstHalf: calcHalfStats(firstHalf),
            secondHalf: calcHalfStats(secondHalf),
            reactionDistribution: distribution,
            maxCombo,
            maxMissStreak
        };
    }

    /**
     * 比較用データを取得（前回、平均、ベスト）
     */
    getComparisonData() {
        const sessions = this.data.sessions;

        if (sessions.length === 0) {
            return { previous: null, average: null, best: null };
        }

        // 前回（最後から2番目）
        const previous = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

        // 平均
        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
        const validReactionSessions = sessions.filter(s => s.avgReactionTime > 0);
        const avgReaction = validReactionSessions.length > 0
            ? validReactionSessions.reduce((sum, s) => sum + s.avgReactionTime, 0) / validReactionSessions.length
            : 0;
        const avgHsRate = sessions.reduce((sum, s) => {
            const rate = s.hits > 0 ? s.headshots / s.hits : 0;
            return sum + rate;
        }, 0) / sessions.length;

        // ベスト
        const bestAccuracy = Math.max(...sessions.map(s => s.accuracy));
        const bestReaction = Math.min(...sessions.filter(s => s.avgReactionTime > 0).map(s => s.avgReactionTime)) || 0;
        const bestHsRate = Math.max(...sessions.map(s => s.hits > 0 ? s.headshots / s.hits : 0));

        return {
            previous: previous ? {
                accuracy: previous.accuracy,
                avgReactionTime: previous.avgReactionTime,
                headshotRate: previous.hits > 0 ? previous.headshots / previous.hits : 0
            } : null,
            average: {
                accuracy: avgAccuracy,
                avgReactionTime: avgReaction,
                headshotRate: avgHsRate
            },
            best: {
                accuracy: bestAccuracy,
                avgReactionTime: bestReaction,
                headshotRate: bestHsRate
            }
        };
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
        this.updateDailyStats(this.currentSession);
        this.saveSkillHistory();

        const newPersonalBests = this.checkPersonalBests(this.currentSession);

        const sessionSummary = { ...this.currentSession, newPersonalBests };
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
