/**
 * 設定管理システム
 * LocalStorageを使用してユーザー設定を永続化
 */

import { VALORANT_CONSTANTS, GRAPHICS_MODES, CROSSHAIR_PRESETS } from '../utils/valorantConst.js';
import { calculateSensitivity } from '../utils/math.js';

class Settings {
    constructor() {
        this.STORAGE_KEY = 'valorant_aim_trainer_settings';

        // デフォルト設定
        this.defaults = {
            // マウス設定
            mouse: {
                dpi: VALORANT_CONSTANTS.DEFAULT_DPI,
                sensitivity: VALORANT_CONSTANTS.DEFAULT_SENSITIVITY,
                globalMultiplier: 1.0, // 全体的な感度倍率（環境差吸収用）
                invertY: false,
                rawInput: true,
                smoothCamera: true,
                smoothSpeed: 10.0
            },

            // グラフィック設定
            graphics: {
                mode: 'STANDARD', // RICH, STANDARD, WIREFRAME
                fov: VALORANT_CONSTANTS.DEFAULT_FOV,
                fpsLimit: 0, // 0 = 制限なし
                vsync: false,
                resolution: 1.0 // レンダリング解像度スケール
            },

            // クロスヘア設定
            crosshair: {
                ...CROSSHAIR_PRESETS.DEFAULT,
                dynamicSpread: true, // 動的拡散（移動エラーの可視化）
                spreadMultiplier: 1.0 // 拡散の強さ倍率
            },

            // オーディオ設定
            audio: {
                masterVolume: 1.0,
                sfxVolume: 0.8,
                musicVolume: 0.3,
                enabled: true
            },

            // ゲームプレイ設定
            gameplay: {
                showHUD: true,
                showStats: true,
                showHitMarkers: true,
                showDamageNumbers: true,
                showTrajectory: false, // デバッグ用
                movementError: true // 移動による精度低下
            },

            // トレーニング設定
            training: {
                defaultMode: 'PREFIRE',
                targetDuration: 3000,
                targetCount: 10,
                showHeatmap: true,
                recordSessions: true
            }
        };

        this.settings = this.load();
    }

    /**
     * 設定を読み込む
     * @returns {Object} 設定オブジェクト
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // デフォルト設定とマージ（新しい設定項目が追加された場合に対応）
                return this.deepMerge(this.defaults, parsed);
            }
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
        }

        return JSON.parse(JSON.stringify(this.defaults));
    }

    /**
     * 設定を保存
     * @returns {boolean} 成功したかどうか
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
            return false;
        }
    }

    /**
     * 特定の設定値を取得
     * @param {string} path - ドット区切りのパス（例: 'mouse.dpi'）
     * @returns {*} 設定値
     */
    get(path) {
        const keys = path.split('.');
        let value = this.settings;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * 特定の設定値を設定
     * @param {string} path - ドット区切りのパス
     * @param {*} value - 設定する値
     * @returns {boolean} 成功したかどうか
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.settings;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
        return this.save();
    }

    /**
     * 設定をリセット
     */
    reset() {
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        this.save();
    }

    /**
     * 特定のカテゴリをリセット
     * @param {string} category - カテゴリ名（例: 'mouse'）
     */
    resetCategory(category) {
        if (category in this.defaults) {
            this.settings[category] = JSON.parse(JSON.stringify(this.defaults[category]));
            this.save();
        }
    }

    /**
     * 計算された感度を取得
     * @returns {number} ブラウザー用の感度
     */
    getCalculatedSensitivity() {
        const dpi = this.get('mouse.dpi');
        const sens = this.get('mouse.sensitivity');
        const multiplier = this.get('mouse.globalMultiplier') || 1.0;
        return calculateSensitivity(dpi, sens, multiplier);
    }

    /**
     * グラフィックモードの詳細設定を取得
     * @returns {Object} グラフィックモードの設定
     */
    getGraphicsMode() {
        const mode = this.get('graphics.mode');
        return GRAPHICS_MODES[mode] || GRAPHICS_MODES.STANDARD;
    }

    /**
     * クロスヘア設定を取得
     * @returns {Object} クロスヘア設定
     */
    getCrosshair() {
        return this.get('crosshair');
    }

    /**
     * クロスヘアプリセットを適用
     * @param {string} presetName - プリセット名
     */
    applyCrosshairPreset(presetName) {
        if (presetName in CROSSHAIR_PRESETS) {
            this.settings.crosshair = { ...CROSSHAIR_PRESETS[presetName] };
            this.save();
        }
    }

    /**
     * 設定をエクスポート
     * @returns {string} JSON文字列
     */
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * 設定をインポート
     * @param {string} jsonString - JSON文字列
     * @returns {boolean} 成功したかどうか
     */
    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = this.deepMerge(this.defaults, imported);
            return this.save();
        } catch (error) {
            console.error('設定のインポートに失敗しました:', error);
            return false;
        }
    }

    /**
     * オブジェクトを深くマージ
     * @param {Object} target - ターゲットオブジェクト
     * @param {Object} source - ソースオブジェクト
     * @returns {Object} マージされたオブジェクト
     */
    deepMerge(target, source) {
        const output = { ...target };

        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                output[key] = this.deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        }

        return output;
    }

    /**
     * 設定変更時のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    /**
     * 設定が変更されたことを通知
     * @param {string} path - 変更されたパス
     * @param {*} value - 新しい値
     */
    notifyChange(path, value) {
        if (this.onChangeCallback) {
            this.onChangeCallback(path, value);
        }
    }

    /**
     * 設定の妥当性を検証
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validate() {
        const errors = [];

        // DPIの範囲チェック
        const dpi = this.get('mouse.dpi');
        if (dpi < 100 || dpi > 20000) {
            errors.push('DPIは100-20000の範囲で設定してください');
        }

        // 感度の範囲チェック
        const sens = this.get('mouse.sensitivity');
        if (sens < 0.001 || sens > 10) {
            errors.push('感度は0.001-10の範囲で設定してください');
        }

        // FOVの範囲チェック
        const fov = this.get('graphics.fov');
        if (fov < VALORANT_CONSTANTS.MIN_FOV || fov > VALORANT_CONSTANTS.MAX_FOV) {
            errors.push(`FOVは${VALORANT_CONSTANTS.MIN_FOV}-${VALORANT_CONSTANTS.MAX_FOV}の範囲で設定してください`);
        }

        // 解像度スケールの範囲チェック
        const resolution = this.get('graphics.resolution');
        if (resolution < 0.5 || resolution > 2.0) {
            errors.push('解像度スケールは0.5-2.0の範囲で設定してください');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * デバッグ情報を出力
     */
    debug() {
        console.log('=== 設定情報 ===');
        console.log('DPI:', this.get('mouse.dpi'));
        console.log('感度:', this.get('mouse.sensitivity'));
        console.log('計算された感度:', this.getCalculatedSensitivity());
        console.log('グラフィックモード:', this.get('graphics.mode'));
        console.log('FOV:', this.get('graphics.fov'));
        console.log('クロスヘア:', this.getCrosshair());
        console.log('================');
    }
}

// シングルトンインスタンスをエクスポート
export const settings = new Settings();
export default settings;
