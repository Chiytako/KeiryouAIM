/**
 * 診断エンジン
 * セッション分析から自動アドバイスを生成
 */

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
                text: `精度が平均を${((session.accuracy / comparison.average.accuracy - 1) * 100).toFixed(0)}%上回っています！`
            });
        }

        // 前回より改善
        if (comparison.previous && session.accuracy > comparison.previous.accuracy) {
            const improvement = ((session.accuracy - comparison.previous.accuracy) * 100).toFixed(1);
            comments.push({
                type: 'positive',
                text: `前回より精度が${improvement}%向上しています`
            });
        }

        // 反応時間がベストに近い
        if (comparison.best && session.avgReactionTime > 0) {
            if (session.avgReactionTime <= comparison.best.avgReactionTime * 1.1) {
                comments.push({
                    type: 'positive',
                    text: '反応速度がベストに近い水準です！'
                });
            }
        }

        // ヘッドショット率が高い
        const hsRate = session.hits > 0 ? session.headshots / session.hits : 0;
        if (hsRate >= 0.5 && session.hits >= 5) {
            comments.push({
                type: 'positive',
                text: `ヘッドショット率${(hsRate * 100).toFixed(0)}%！素晴らしい精密さです`
            });
        }

        // === 警告・改善点 ===

        // 後半の精度低下
        if (analysis.firstHalf && analysis.secondHalf) {
            if (analysis.secondHalf.accuracy < analysis.firstHalf.accuracy * 0.85) {
                comments.push({
                    type: 'warning',
                    text: '後半に精度が低下しています。休憩を取ることを検討してください'
                });
            }
        }

        // 精度が平均を下回っている
        if (comparison.average && session.accuracy < comparison.average.accuracy * 0.9) {
            comments.push({
                type: 'warning',
                text: '今回の精度は平均を下回っています。調子が悪いかもしれません'
            });
        }

        // ミスが連続している
        if (analysis.maxMissStreak >= 5) {
            comments.push({
                type: 'warning',
                text: `${analysis.maxMissStreak}連続ミスがありました。焦らず狙いましょう`
            });
        }

        // === 提案 ===

        // 反応時間は良いが精度が低い
        if (session.avgReactionTime > 0 && session.avgReactionTime < 250 && session.accuracy < 0.6) {
            comments.push({
                type: 'suggestion',
                text: '反応は速いですが精度が低めです。少しゆっくり狙ってみましょう'
            });
        }

        // 精度は高いが反応が遅い
        if (session.accuracy > 0.8 && session.avgReactionTime > 400) {
            comments.push({
                type: 'suggestion',
                text: '精度は高いですが反応がやや遅めです。速度を意識してみましょう'
            });
        }

        // ヘッドショット率が低い
        if (hsRate < 0.2 && session.hits >= 10) {
            comments.push({
                type: 'suggestion',
                text: 'ヘッドラインを意識してクロスヘアを配置してみましょう'
            });
        }

        // モード別の提案
        if (session.mode === 'MICROFLICK' && session.accuracy < 0.5) {
            comments.push({
                type: 'suggestion',
                text: 'フリック精度が低めです。まずは遅めに確実に狙う練習を'
            });
        }

        // コメントがない場合のデフォルト
        if (comments.length === 0) {
            comments.push({
                type: 'positive',
                text: '安定したパフォーマンスです。この調子で続けましょう！'
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
            reason: `${weakest.name}スコアが最も低いため`
        });

        return suggestions;
    }
}

export default DiagnosticsEngine;
