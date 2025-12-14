/**
 * リコイルシステム
 * 武器の反動パターンを管理し、カメラに適用する
 */

import settings from '../core/settings.js';
import { degToRad, lerp, clamp } from '../utils/math.js';

export class RecoilSystem {
    constructor() {
        // 現在のリコイル状態
        this.currentShotIndex = 0;      // 現在の発射数（パターンのインデックス）
        this.accumulatedRecoil = {       // 累積リコイル量
            x: 0,
            y: 0
        };
        this.visualRecoil = {            // 視覚的なリコイル（実際にカメラに適用される量）
            x: 0,
            y: 0
        };

        // リセットタイマー
        this.timeSinceLastShot = 0;
        this.isRecovering = false;

        // 現在の武器データ
        this.currentWeapon = null;

        // 設定
        this.enabled = settings.get('gameplay.recoil.enabled') ?? true;
        this.intensityMultiplier = settings.get('gameplay.recoil.intensity') ?? 1.0;

        // デバッグ用
        this.debug = false;
    }

    /**
     * 武器を設定
     * @param {Object} weaponData - 武器データ
     */
    setWeapon(weaponData) {
        this.currentWeapon = weaponData;
        this.reset();
    }

    /**
     * リコイル状態をリセット
     */
    reset() {
        this.currentShotIndex = 0;
        this.accumulatedRecoil = { x: 0, y: 0 };
        this.visualRecoil = { x: 0, y: 0 };
        this.timeSinceLastShot = 0;
        this.isRecovering = false;
    }

    /**
     * 射撃時に呼び出される
     * @returns {Object} 適用すべきリコイル {x, y} （度単位）
     */
    applyShot() {
        if (!this.enabled || !this.currentWeapon) {
            return { x: 0, y: 0 };
        }

        const recoilData = this.currentWeapon.recoil;
        if (!recoilData || !recoilData.pattern) {
            return { x: 0, y: 0 };
        }

        // リカバリー中なら停止
        this.isRecovering = false;
        this.timeSinceLastShot = 0;

        // パターンからリコイル値を取得
        const patternIndex = Math.min(this.currentShotIndex, recoilData.pattern.length - 1);
        const [baseX, baseY] = recoilData.pattern[patternIndex];

        // 初弾補正を適用
        let shotMultiplier = 1.0;
        if (this.currentShotIndex < recoilData.firstShotCount) {
            shotMultiplier = recoilData.firstShotMultiplier;
        }

        // 最終的なリコイル量を計算
        const recoilX = baseX * recoilData.multiplier * shotMultiplier * this.intensityMultiplier;
        const recoilY = baseY * recoilData.multiplier * shotMultiplier * this.intensityMultiplier;

        // ランダムな揺らぎを追加（±15%）
        const randomFactor = 0.15;
        const finalX = recoilX * (1 + (Math.random() - 0.5) * 2 * randomFactor);
        const finalY = recoilY * (1 + (Math.random() - 0.5) * 2 * randomFactor);

        // 累積リコイルに追加
        this.accumulatedRecoil.x += finalX;
        this.accumulatedRecoil.y += finalY;

        // 視覚的リコイルも更新
        this.visualRecoil.x += finalX;
        this.visualRecoil.y += finalY;

        // 発射カウントを増加
        this.currentShotIndex++;

        if (this.debug) {
            console.log(`Recoil shot ${this.currentShotIndex}: x=${finalX.toFixed(3)}, y=${finalY.toFixed(3)}`);
        }

        return {
            x: finalX,
            y: finalY
        };
    }

    /**
     * 毎フレーム更新
     * @param {number} deltaTime - 経過時間（秒）
     * @returns {Object} カメラに適用すべき回復量 {x, y} （度単位）
     */
    update(deltaTime) {
        if (!this.enabled || !this.currentWeapon) {
            return { x: 0, y: 0 };
        }

        const recoilData = this.currentWeapon.recoil;
        if (!recoilData) {
            return { x: 0, y: 0 };
        }

        // 最後の射撃からの時間を追跡
        this.timeSinceLastShot += deltaTime;

        // リセット時間を超えたらリカバリー開始
        if (this.timeSinceLastShot >= recoilData.resetTime) {
            this.isRecovering = true;
        }

        // リカバリー処理
        if (this.isRecovering && (this.visualRecoil.x !== 0 || this.visualRecoil.y !== 0)) {
            const recoveryAmount = recoilData.recoveryRate * deltaTime;

            // 視覚的リコイルを回復
            const recoveryX = this.getRecoveryAmount(this.visualRecoil.x, recoveryAmount);
            const recoveryY = this.getRecoveryAmount(this.visualRecoil.y, recoveryAmount);

            this.visualRecoil.x -= recoveryX;
            this.visualRecoil.y -= recoveryY;

            // 累積リコイルも減少
            this.accumulatedRecoil.x = lerp(this.accumulatedRecoil.x, 0, deltaTime * 3);
            this.accumulatedRecoil.y = lerp(this.accumulatedRecoil.y, 0, deltaTime * 3);

            // 完全にリセット
            if (Math.abs(this.visualRecoil.x) < 0.01 && Math.abs(this.visualRecoil.y) < 0.01) {
                this.reset();
            }

            return {
                x: -recoveryX,  // カメラを元に戻す方向
                y: -recoveryY
            };
        }

        return { x: 0, y: 0 };
    }

    /**
     * 回復量を計算
     * @param {number} current - 現在の値
     * @param {number} maxRecovery - 最大回復量
     * @returns {number} 実際の回復量
     */
    getRecoveryAmount(current, maxRecovery) {
        if (current === 0) return 0;

        const sign = current > 0 ? 1 : -1;
        const absValue = Math.abs(current);
        const recovery = Math.min(absValue, maxRecovery);

        return recovery * sign;
    }

    /**
     * 現在の累積リコイルを取得
     * @returns {Object} {x, y}
     */
    getAccumulatedRecoil() {
        return { ...this.accumulatedRecoil };
    }

    /**
     * 現在の視覚的リコイルを取得
     * @returns {Object} {x, y}
     */
    getVisualRecoil() {
        return { ...this.visualRecoil };
    }

    /**
     * リコイルを有効/無効にする
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.reset();
        }
    }

    /**
     * リコイル強度を設定
     * @param {number} intensity - 0.0 ~ 2.0
     */
    setIntensity(intensity) {
        this.intensityMultiplier = clamp(intensity, 0, 2);
    }

    /**
     * 現在リカバリー中かどうか
     * @returns {boolean}
     */
    isInRecovery() {
        return this.isRecovering;
    }

    /**
     * 現在の発射数を取得
     * @returns {number}
     */
    getShotCount() {
        return this.currentShotIndex;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            enabled: this.enabled,
            intensity: this.intensityMultiplier,
            shotIndex: this.currentShotIndex,
            accumulated: { ...this.accumulatedRecoil },
            visual: { ...this.visualRecoil },
            timeSinceLastShot: this.timeSinceLastShot.toFixed(3),
            isRecovering: this.isRecovering,
            weapon: this.currentWeapon?.name || 'none'
        };
    }
}

export default RecoilSystem;
