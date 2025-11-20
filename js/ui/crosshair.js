/**
 * クロスヘア描画システム
 * Canvas 2Dを使用してクロスヘアを描画
 */

import settings from '../core/settings.js';

export class CrosshairRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // キャンバスサイズを設定
        this.resize();

        // ウィンドウリサイズイベント
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * キャンバスサイズを調整
     */
    resize() {
        const size = 100; // クロスヘア描画エリアのサイズ
        this.canvas.width = size;
        this.canvas.height = size;
    }

    /**
     * クロスヘアを描画
     */
    draw() {
        const config = settings.getCrosshair();

        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // クロスヘアタイプに応じて描画
        switch (config.type) {
            case 'cross':
                this.drawCross(centerX, centerY, config);
                break;
            case 'dot':
                this.drawDot(centerX, centerY, config);
                break;
            case 'circle':
                this.drawCircle(centerX, centerY, config);
                break;
            case 'cross_dot':
                this.drawCross(centerX, centerY, config);
                this.drawDot(centerX, centerY, config);
                break;
            default:
                this.drawCross(centerX, centerY, config);
        }
    }

    /**
     * 十字クロスヘアを描画
     * @param {number} x - 中心X
     * @param {number} y - 中心Y
     * @param {Object} config - クロスヘア設定
     */
    drawCross(x, y, config) {
        const size = config.size || 4;
        const thickness = config.thickness || 2;
        const gap = config.gap || 2;
        const color = config.color || '#00FF00';
        const opacity = config.opacity || 1.0;

        this.ctx.globalAlpha = opacity;

        // アウトライン
        if (config.outline) {
            this.ctx.strokeStyle = config.outlineColor || '#000000';
            this.ctx.lineWidth = thickness + (config.outlineThickness || 1) * 2;

            // 上
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - gap);
            this.ctx.lineTo(x, y - gap - size);
            this.ctx.stroke();

            // 下
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + gap);
            this.ctx.lineTo(x, y + gap + size);
            this.ctx.stroke();

            // 左
            this.ctx.beginPath();
            this.ctx.moveTo(x - gap, y);
            this.ctx.lineTo(x - gap - size, y);
            this.ctx.stroke();

            // 右
            this.ctx.beginPath();
            this.ctx.moveTo(x + gap, y);
            this.ctx.lineTo(x + gap + size, y);
            this.ctx.stroke();
        }

        // メインライン
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;

        // 上
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - gap);
        this.ctx.lineTo(x, y - gap - size);
        this.ctx.stroke();

        // 下
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + gap);
        this.ctx.lineTo(x, y + gap + size);
        this.ctx.stroke();

        // 左
        this.ctx.beginPath();
        this.ctx.moveTo(x - gap, y);
        this.ctx.lineTo(x - gap - size, y);
        this.ctx.stroke();

        // 右
        this.ctx.beginPath();
        this.ctx.moveTo(x + gap, y);
        this.ctx.lineTo(x + gap + size, y);
        this.ctx.stroke();

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * ドットクロスヘアを描画
     * @param {number} x - 中心X
     * @param {number} y - 中心Y
     * @param {Object} config - クロスヘア設定
     */
    drawDot(x, y, config) {
        const size = config.dotSize || config.size || 2;
        const color = config.color || '#FFFFFF';
        const opacity = config.opacity || 1.0;

        this.ctx.globalAlpha = opacity;

        // アウトライン
        if (config.outline) {
            this.ctx.fillStyle = config.outlineColor || '#000000';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size + (config.outlineThickness || 1), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // メインドット
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 円クロスヘアを描画
     * @param {number} x - 中心X
     * @param {number} y - 中心Y
     * @param {Object} config - クロスヘア設定
     */
    drawCircle(x, y, config) {
        const size = config.size || 6;
        const thickness = config.thickness || 2;
        const color = config.color || '#00FFFF';
        const opacity = config.opacity || 0.8;

        this.ctx.globalAlpha = opacity;

        // アウトライン
        if (config.outline) {
            this.ctx.strokeStyle = config.outlineColor || '#000000';
            this.ctx.lineWidth = thickness + (config.outlineThickness || 1) * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // メインサークル
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * クロスヘア設定が変更されたときに再描画
     */
    refresh() {
        this.draw();
    }
}

export default CrosshairRenderer;
