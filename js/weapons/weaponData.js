/**
 * 武器データ定義
 * タクティカルシューター準拠の武器パラメータとリコイルパターン
 */

/**
 * 武器タイプ
 */
export const WEAPON_TYPES = {
    RIFLE: 'rifle',
    SMG: 'smg',
    PISTOL: 'pistol',
    SNIPER: 'sniper',
};

/**
 * 武器データ
 * 各武器のパラメータを定義
 */
export const WEAPONS = {
    // === ライフル ===
    VANDAL: {
        id: 'vandal',
        name: 'Vandal',
        type: WEAPON_TYPES.RIFLE,
        displayName: {
            ja: 'ヴァンダル',
            en: 'Vandal'
        },

        // 基本ステータス
        fireRate: 9.75,           // 発射レート（発/秒）
        fireMode: 'auto',         // auto | semi | burst
        magazineSize: 25,
        reloadTime: 2.5,          // リロード時間（秒）

        // ダメージ
        damage: {
            head: 160,
            body: 40,
            legs: 34,
        },

        // 精度
        accuracy: {
            standing: 0.25,       // 停止時の分散（度）
            moving: 3.0,          // 移動時の分散
            jumping: 10.0,        // ジャンプ時の分散
            crouching: 0.2,       // しゃがみ時の分散
        },


    },

    PHANTOM: {
        id: 'phantom',
        name: 'Phantom',
        type: WEAPON_TYPES.RIFLE,
        displayName: {
            ja: 'ファントム',
            en: 'Phantom'
        },

        fireRate: 11.0,
        fireMode: 'auto',
        magazineSize: 30,
        reloadTime: 2.5,

        damage: {
            head: 156,
            body: 39,
            legs: 33,
        },

        accuracy: {
            standing: 0.2,
            moving: 2.5,
            jumping: 9.0,
            crouching: 0.15,
        },

    },

    GUARDIAN: {
        id: 'guardian',
        name: 'Guardian',
        type: WEAPON_TYPES.RIFLE,
        displayName: {
            ja: 'ガーディアン',
            en: 'Guardian'
        },

        fireRate: 4.75,
        fireMode: 'semi',
        magazineSize: 12,
        reloadTime: 2.0,

        damage: {
            head: 195,
            body: 65,
            legs: 49,
        },

        accuracy: {
            standing: 0.1,
            moving: 2.0,
            jumping: 8.0,
            crouching: 0.08,
        },

    },

    // === SMG ===
    SPECTRE: {
        id: 'spectre',
        name: 'Spectre',
        type: WEAPON_TYPES.SMG,
        displayName: {
            ja: 'スペクター',
            en: 'Spectre'
        },

        fireRate: 13.33,
        fireMode: 'auto',
        magazineSize: 30,
        reloadTime: 2.25,

        damage: {
            head: 78,
            body: 26,
            legs: 22,
        },

        accuracy: {
            standing: 0.35,
            moving: 1.5,
            jumping: 6.0,
            crouching: 0.3,
        },

    },

    STINGER: {
        id: 'stinger',
        name: 'Stinger',
        type: WEAPON_TYPES.SMG,
        displayName: {
            ja: 'スティンガー',
            en: 'Stinger'
        },

        fireRate: 16.0,
        fireMode: 'auto',
        magazineSize: 20,
        reloadTime: 2.25,

        damage: {
            head: 67,
            body: 27,
            legs: 23,
        },

        accuracy: {
            standing: 0.5,
            moving: 2.0,
            jumping: 5.0,
            crouching: 0.4,
        },

    },

    // === ピストル ===
    SHERIFF: {
        id: 'sheriff',
        name: 'Sheriff',
        type: WEAPON_TYPES.PISTOL,
        displayName: {
            ja: 'シェリフ',
            en: 'Sheriff'
        },

        fireRate: 4.0,
        fireMode: 'semi',
        magazineSize: 6,
        reloadTime: 2.25,

        damage: {
            head: 159,
            body: 55,
            legs: 47,
        },

        accuracy: {
            standing: 0.15,
            moving: 2.5,
            jumping: 10.0,
            crouching: 0.1,
        },

    },

    GHOST: {
        id: 'ghost',
        name: 'Ghost',
        type: WEAPON_TYPES.PISTOL,
        displayName: {
            ja: 'ゴースト',
            en: 'Ghost'
        },

        fireRate: 6.75,
        fireMode: 'semi',
        magazineSize: 15,
        reloadTime: 1.5,

        damage: {
            head: 105,
            body: 30,
            legs: 26,
        },

        accuracy: {
            standing: 0.2,
            moving: 1.8,
            jumping: 8.0,
            crouching: 0.15,
        },

    },

    CLASSIC: {
        id: 'classic',
        name: 'Classic',
        type: WEAPON_TYPES.PISTOL,
        displayName: {
            ja: 'クラシック',
            en: 'Classic'
        },

        fireRate: 6.75,
        fireMode: 'semi',
        magazineSize: 12,
        reloadTime: 1.75,

        damage: {
            head: 78,
            body: 26,
            legs: 22,
        },

        accuracy: {
            standing: 0.3,
            moving: 2.0,
            jumping: 7.0,
            crouching: 0.25,
        },

    },

    // === スナイパー ===
    OPERATOR: {
        id: 'operator',
        name: 'Operator',
        type: WEAPON_TYPES.SNIPER,
        displayName: {
            ja: 'オペレーター',
            en: 'Operator'
        },

        fireRate: 0.6,
        fireMode: 'semi',
        magazineSize: 5,
        reloadTime: 3.7,

        damage: {
            head: 255,
            body: 150,
            legs: 127,
        },

        accuracy: {
            standing: 0.05,
            moving: 5.0,
            jumping: 15.0,
            crouching: 0.03,
        },

    },

    MARSHAL: {
        id: 'marshal',
        name: 'Marshal',
        type: WEAPON_TYPES.SNIPER,
        displayName: {
            ja: 'マーシャル',
            en: 'Marshal'
        },

        fireRate: 1.5,
        fireMode: 'semi',
        magazineSize: 5,
        reloadTime: 2.5,

        damage: {
            head: 202,
            body: 101,
            legs: 85,
        },

        accuracy: {
            standing: 0.1,
            moving: 3.0,
            jumping: 12.0,
            crouching: 0.08,
        },

    },
};

/**
 * 武器カテゴリ
 */
export const WEAPON_CATEGORIES = {
    RIFLES: ['VANDAL', 'PHANTOM', 'GUARDIAN'],
    SMGS: ['SPECTRE', 'STINGER'],
    PISTOLS: ['SHERIFF', 'GHOST', 'CLASSIC'],
    SNIPERS: ['OPERATOR', 'MARSHAL'],
};

/**
 * デフォルト武器
 */
export const DEFAULT_WEAPON = 'VANDAL';

/**
 * 武器IDから武器データを取得
 * @param {string} weaponId - 武器ID（大文字）
 * @returns {Object|null} 武器データ
 */
export function getWeaponData(weaponId) {
    return WEAPONS[weaponId.toUpperCase()] || null;
}

/**
 * 武器タイプから武器リストを取得
 * @param {string} type - 武器タイプ
 * @returns {Array} 武器データの配列
 */
export function getWeaponsByType(type) {
    return Object.values(WEAPONS).filter(weapon => weapon.type === type);
}

/**
 * すべての武器IDを取得
 * @returns {Array} 武器IDの配列
 */
export function getAllWeaponIds() {
    return Object.keys(WEAPONS);
}

export default WEAPONS;
