/**
 * 武器・リコイル設定のデフォルト値
 * このファイルの内容をsettings.jsのDEFAULT_SETTINGSに追加してください
 */

export const WEAPON_SETTINGS_DEFAULTS = {
    // 武器設定
    weapon: {
        selected: 'VANDAL',      // 選択中の武器ID
        ammoEnabled: false,       // 弾薬システムの有効/無効
    },
    
    // リコイル設定
    recoil: {
        enabled: true,           // リコイルの有効/無効
        intensity: 1.0,          // リコイル強度（0.0 ~ 2.0）
        visualFeedback: true,    // 視覚的フィードバック（クロスヘア拡大など）
    },
};

/**
 * 設定のデフォルト値をマージするヘルパー関数
 * settings.jsで使用
 */
export function mergeWeaponDefaults(existingDefaults) {
    return {
        ...existingDefaults,
        ...WEAPON_SETTINGS_DEFAULTS,
    };
}

export default WEAPON_SETTINGS_DEFAULTS;
