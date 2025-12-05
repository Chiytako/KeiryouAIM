/**
 * 診断エンジン
 * セッション分析から自動アドバイスを生成
 */

import i18n from '../utils/i18n.js';

export class DiagnosticsEngine {
    /**
     * セッションを分析してコメントを生成
     * @param {Object} session - 今回のセッション
     * @param {Object} comparison - 比較データ { previous, average, best }
     * @param {Object} analysis - セッション内分析データ
     * @returns {Array} コメント配列 [{ type: 'positive'|'warning'|'suggestion', text: string }]
     */
    static analyzeSession(session, comparison, analysis) {
        const comments = [];

        // === ポジティブなフィードバック ===

        // 精度が平均を上回っている
        if (comparison.average && session.accuracy > comparison.average.accuracy * 1.1) {
            comments.push({
                type: 'positive',
                text: i18n.t('diagnostics.positive.accuracyAboveAvg', {
                    value: ((session.accuracy / comparison.average.accuracy - 1) * 100).toFixed(0)
                })
            });
        }

        // 前回より改善
        if (comparison.previous && session.accuracy > comparison.previous.accuracy) {
            const improvement = ((session.accuracy - comparison.previous.accuracy) * 100).toFixed(1);
            comments.push({
                type: 'positive',
                text: i18n.t('diagnostics.positive.accuracyImproved', { value: improvement })
            });
        }

        // 反応時間がベストに近い
        if (comparison.best && session.avgReactionTime > 0) {
            if (session.avgReactionTime <= comparison.best.avgReactionTime * 1.1) {
                comments.push({
                    type: 'positive',
                    text: i18n.t('diagnostics.positive.reactionGood')
                });
            }
        }

        // ヘッドショット率が高い
        const hsRate = session.hits > 0 ? session.headshots / session.hits : 0;
        if (hsRate >= 0.5 && session.hits >= 5) {
            comments.push({
                type: 'positive',
                text: i18n.t('diagnostics.positive.headshotHigh', { value: (hsRate * 100).toFixed(0) })
            });
        }

        // === 警告・改善点 ===

        // 後半の精度低下
        if (analysis.firstHalf && analysis.secondHalf) {
            if (analysis.secondHalf.accuracy < analysis.firstHalf.accuracy * 0.85) {
                comments.push({
                    type: 'warning',
                    text: i18n.t('diagnostics.warning.fatigue')
                });
            }
        }

        // 精度が平均を下回っている
        if (comparison.average && session.accuracy < comparison.average.accuracy * 0.9) {
            comments.push({
                type: 'warning',
                text: i18n.t('diagnostics.warning.accuracyBelowAvg')
            });
        }

        // ミスが連続している
        if (analysis.maxMissStreak >= 5) {
            comments.push({
                type: 'warning',
                text: i18n.t('diagnostics.warning.missStreak', { value: analysis.maxMissStreak })
            });
        }

        // === 提案 ===

        // 反応時間は良いが精度が低い
        if (session.avgReactionTime > 0 && session.avgReactionTime < 250 && session.accuracy < 0.6) {
            comments.push({
                type: 'suggestion',
                text: i18n.t('diagnostics.suggestion.slowDown')
            });
        }

        // 精度は高いが反応が遅い
        if (session.accuracy > 0.8 && session.avgReactionTime > 400) {
            comments.push({
                type: 'suggestion',
                text: i18n.t('diagnostics.suggestion.speedUp')
            });
        }

        // ヘッドショット率が低い
        if (hsRate < 0.2 && session.hits >= 10) {
            comments.push({
                type: 'suggestion',
                text: i18n.t('diagnostics.suggestion.aimHead')
            });
        }

        // モード別の提案
        if (session.mode === 'MICROFLICK' && session.accuracy < 0.5) {
            comments.push({
                type: 'suggestion',
                text: i18n.t('diagnostics.suggestion.flickPractice')
            });
        }

        // コメントがない場合のデフォルト
        if (comments.length === 0) {
            comments.push({
                type: 'positive',
                text: i18n.t('diagnostics.positive.stable')
            });
        }

        return comments;
    }

    /**
     * 推奨練習モードを提案
     * @param {Object} skillRating - スキルレーティング
     */
    static suggestTrainingMode(skillRating) {
        const suggestions = [];

        // 最も低いスキルを特定
        const skills = [
            { key: 'accuracy', name: '精度', mode: 'GRIDSHOT', value: skillRating.accuracy },
            { key: 'reaction', name: '反応速度', mode: 'SPIDERSHOT', value: skillRating.reaction },
            { key: 'flick', name: 'フリック', mode: 'MICROFLICK', value: skillRating.flick },
            { key: 'tracking', name: '追従', mode: 'TRACKING', value: skillRating.tracking }
        ];

        skills.sort((a, b) => a.value - b.value);

        const weakest = skills[0];
        suggestions.push({
            mode: weakest.mode,
            reason: i18n.t('diagnostics.suggestion.trainingMode', { mode: weakest.name })
        });

        return suggestions;
    }
}

export default DiagnosticsEngine;
