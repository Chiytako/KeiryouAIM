/**
 * チャート描画ユーティリティ
 */

export class ChartRenderer {
    /**
     * レーダーチャートを描画
     * @param {HTMLCanvasElement} canvas
     * @param {Object} data - { accuracy: 72, reaction: 68, flick: 75, tracking: 60, consistency: 80 }
     * @param {Object} options - { labels: [...] }
     */
    static drawRadarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        const labels = options.labels || ['精度', '反応', 'フリック', '追従', '安定性'];
        const values = [
            data.accuracy || 0,
            data.reaction || 0,
            data.flick || 0,
            data.tracking || 0,
            data.consistency || 0
        ];
        const numPoints = labels.length;
        const angleStep = (Math.PI * 2) / numPoints;

        // 背景の同心円
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let r = 0.2; r <= 1; r += 0.2) {
            ctx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * r;
                const y = centerY + Math.sin(angle) * radius * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // 軸線
        ctx.strokeStyle = '#ccc';
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius
            );
            ctx.stroke();
        }

        // データエリア
        ctx.fillStyle = 'rgba(232, 123, 53, 0.3)';
        ctx.strokeStyle = '#E87B35';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const value = values[i] / 100;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // データポイント
        ctx.fillStyle = '#E87B35';
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const value = values[i] / 100;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // ラベル
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius + 25);
            const y = centerY + Math.sin(angle) * (radius + 25);
            ctx.fillText(`${labels[i]} (${values[i]})`, x, y);
        }
    }

    /**
     * 成長曲線を描画
     * @param {HTMLCanvasElement} canvas
     * @param {Array} data - [{ week: '4週前', overall: 65 }, ...]
     */
    static drawGrowthChart(canvas, data) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // 有効なデータをフィルタ
        const validData = data.filter(d => d.overall !== null);

        if (validData.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('データがありません', width / 2, height / 2);
            return;
        }

        // Y軸の範囲（0-100）
        const minY = 0;
        const maxY = 100;

        // グリッド
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let y = 0; y <= 100; y += 20) {
            const yPos = padding.top + chartHeight - (y / 100) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, yPos);
            ctx.lineTo(width - padding.right, yPos);
            ctx.stroke();

            ctx.fillStyle = '#999';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(y.toString(), padding.left - 8, yPos + 4);
        }

        // X軸ラベル
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        data.forEach((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            ctx.fillText(d.week, x, height - padding.bottom + 20);
        });

        // データライン
        ctx.strokeStyle = '#E87B35';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        let started = false;
        data.forEach((d, i) => {
            if (d.overall === null) return;

            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - (d.overall / 100) * chartHeight;

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // データポイント
        ctx.fillStyle = '#E87B35';
        data.forEach((d, i) => {
            if (d.overall === null) return;

            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - (d.overall / 100) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // 値ラベル
            ctx.fillStyle = '#333';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.overall.toString(), x, y - 12);
            ctx.fillStyle = '#E87B35';
        });
    }

    /**
     * ヒストグラムを描画
     * @param {HTMLCanvasElement} canvas
     * @param {Array} data - [{ range: '100-149', count: 5 }, ...]
     */
    static drawHistogram(canvas, data) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 10, right: 10, bottom: 30, left: 10 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxCount = Math.max(...data.map(d => d.count), 1);
        // ギャップを小さくしてバーを太くする
        const gap = 2;
        const barWidth = (chartWidth - (data.length - 1) * gap) / data.length;

        data.forEach((d, i) => {
            const barHeight = (d.count / maxCount) * chartHeight;
            const x = padding.left + i * (barWidth + gap);
            const y = padding.top + chartHeight - barHeight;

            // バー
            ctx.fillStyle = d.count > 0 ? '#E87B35' : '#333'; // 0の場合は暗く表示
            ctx.fillRect(x, y, barWidth, barHeight);

            // ラベル (間引き表示: 0, 500, 1000msなど、5つおきに表示)
            if (i % 5 === 0) {
                ctx.fillStyle = '#888';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                const label = d.range.split('-')[0];
                ctx.fillText(label, x + barWidth / 2, height - 5);
            }
        });
    }

    /**
     * 前半/後半比較バーを描画
     * @param {HTMLCanvasElement} canvas
     * @param {Object} firstHalf - { accuracy, hits, total }
     * @param {Object} secondHalf - { accuracy, hits, total }
     */
    static drawComparisonBars(canvas, firstHalf, secondHalf) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        ctx.clearRect(0, 0, width, height);

        const barHeight = 30;
        const gap = 20;
        const startY = (height - barHeight * 2 - gap) / 2;

        // 前半
        const firstWidth = firstHalf.accuracy * (width - 80);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(60, startY, firstWidth, barHeight);

        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('前半', 55, startY + barHeight / 2 + 4);

        ctx.textAlign = 'left';
        ctx.fillText(`${(firstHalf.accuracy * 100).toFixed(1)}%`, firstWidth + 65, startY + barHeight / 2 + 4);

        // 後半
        const secondWidth = secondHalf.accuracy * (width - 80);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(60, startY + barHeight + gap, secondWidth, barHeight);

        ctx.fillStyle = '#333';
        ctx.textAlign = 'right';
        ctx.fillText('後半', 55, startY + barHeight + gap + barHeight / 2 + 4);

        ctx.textAlign = 'left';
        ctx.fillText(`${(secondHalf.accuracy * 100).toFixed(1)}%`, secondWidth + 65, startY + barHeight + gap + barHeight / 2 + 4);
    }

    /**
     * ミニスパークライン描画（メニュー用）
     * @param {HTMLCanvasElement} canvas
     * @param {Array} data - 数値の配列
     */
    static drawSparkline(canvas, data) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) return;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        ctx.strokeStyle = '#E87B35';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();
    }
}

export default ChartRenderer;
