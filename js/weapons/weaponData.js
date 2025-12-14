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
        
        // リコイル設定
        recoil: {
            // リコイルパターン（発射ごとの反動）
            // [x方向（右が正）, y方向（上が正）]
            pattern: [
                [0, 0.8],      // 1発目
                [0, 0.85],     // 2発目
                [0.1, 0.9],    // 3発目
                [-0.15, 0.95], // 4発目
                [0.1, 1.0],    // 5発目
                [-0.2, 0.9],   // 6発目
                [0.25, 0.85],  // 7発目
                [-0.1, 0.8],   // 8発目
                [0.3, 0.75],   // 9発目
                [-0.35, 0.7],  // 10発目
                [0.2, 0.65],   // 11発目
                [-0.25, 0.6],  // 12発目
                [0.3, 0.55],   // 13発目
                [-0.15, 0.5],  // 14発目
                [0.1, 0.45],   // 15発目
                [-0.2, 0.4],   // 16発目
                [0.25, 0.35],  // 17発目
                [-0.1, 0.3],   // 18発目
                [0.15, 0.25],  // 19発目
                [-0.2, 0.2],   // 20発目
                [0.1, 0.15],   // 21発目
                [-0.15, 0.1],  // 22発目
                [0.1, 0.1],    // 23発目
                [-0.1, 0.1],   // 24発目
                [0, 0.1],      // 25発目
            ],
            
            // リコイルの基本倍率
            multiplier: 1.0,
            
            // リコイル回復
            resetTime: 0.4,       // リコイルがリセットされるまでの時間（秒）
            recoveryRate: 4.0,    // 回復速度（度/秒）
            
            // 最初の数発の反動軽減（初弾精度）
            firstShotMultiplier: 0.3,
            firstShotCount: 2,
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
        
        recoil: {
            pattern: [
                [0, 0.6],
                [0.05, 0.65],
                [-0.05, 0.7],
                [0.1, 0.75],
                [-0.1, 0.8],
                [0.15, 0.75],
                [-0.15, 0.7],
                [0.1, 0.65],
                [-0.1, 0.6],
                [0.2, 0.55],
                [-0.2, 0.5],
                [0.15, 0.45],
                [-0.15, 0.4],
                [0.1, 0.35],
                [-0.1, 0.3],
                [0.2, 0.25],
                [-0.2, 0.2],
                [0.1, 0.15],
                [-0.1, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0.1, 0.1],
                [-0.1, 0.1],
                [0, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0, 0.05],
                [0, 0.05],
                [0, 0.05],
                [0, 0.05],
            ],
            multiplier: 0.85,
            resetTime: 0.35,
            recoveryRate: 5.0,
            firstShotMultiplier: 0.25,
            firstShotCount: 3,
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
        
        recoil: {
            pattern: [
                [0, 1.2],
                [0.1, 1.3],
                [-0.1, 1.25],
                [0.15, 1.2],
                [-0.15, 1.15],
                [0.1, 1.1],
                [-0.1, 1.0],
                [0.05, 0.9],
                [-0.05, 0.8],
                [0, 0.7],
                [0.05, 0.6],
                [-0.05, 0.5],
            ],
            multiplier: 1.5,
            resetTime: 0.3,
            recoveryRate: 8.0,
            firstShotMultiplier: 0.2,
            firstShotCount: 1,
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
        
        recoil: {
            pattern: [
                [0, 0.4],
                [0.05, 0.45],
                [-0.05, 0.5],
                [0.1, 0.5],
                [-0.1, 0.5],
                [0.1, 0.45],
                [-0.1, 0.4],
                [0.15, 0.35],
                [-0.15, 0.3],
                [0.1, 0.25],
                [-0.1, 0.2],
                [0.05, 0.15],
                [-0.05, 0.1],
                [0.1, 0.1],
                [-0.1, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0, 0.05],
                [0.05, 0.05],
                [-0.05, 0.05],
                [0, 0.05],
                [0.05, 0.05],
                [-0.05, 0.05],
                [0, 0.05],
                [0, 0.05],
                [0, 0.05],
                [0, 0.05],
            ],
            multiplier: 0.6,
            resetTime: 0.25,
            recoveryRate: 6.0,
            firstShotMultiplier: 0.3,
            firstShotCount: 3,
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
        
        recoil: {
            pattern: [
                [0, 0.3],
                [0.1, 0.35],
                [-0.1, 0.4],
                [0.15, 0.4],
                [-0.15, 0.4],
                [0.1, 0.35],
                [-0.1, 0.3],
                [0.2, 0.25],
                [-0.2, 0.2],
                [0.15, 0.15],
                [-0.15, 0.1],
                [0.1, 0.1],
                [-0.1, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0.1, 0.05],
                [-0.1, 0.05],
                [0.05, 0.05],
                [-0.05, 0.05],
                [0, 0.05],
            ],
            multiplier: 0.5,
            resetTime: 0.2,
            recoveryRate: 7.0,
            firstShotMultiplier: 0.4,
            firstShotCount: 2,
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
        
        recoil: {
            pattern: [
                [0, 1.8],
                [0.2, 1.6],
                [-0.2, 1.4],
                [0.15, 1.2],
                [-0.15, 1.0],
                [0.1, 0.8],
            ],
            multiplier: 1.8,
            resetTime: 0.5,
            recoveryRate: 6.0,
            firstShotMultiplier: 0.5,
            firstShotCount: 1,
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
        
        recoil: {
            pattern: [
                [0, 0.6],
                [0.1, 0.55],
                [-0.1, 0.5],
                [0.1, 0.45],
                [-0.1, 0.4],
                [0.05, 0.35],
                [-0.05, 0.3],
                [0.1, 0.25],
                [-0.1, 0.2],
                [0.05, 0.15],
                [-0.05, 0.1],
                [0, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0, 0.1],
            ],
            multiplier: 0.8,
            resetTime: 0.35,
            recoveryRate: 5.0,
            firstShotMultiplier: 0.3,
            firstShotCount: 2,
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
        
        recoil: {
            pattern: [
                [0, 0.5],
                [0.1, 0.45],
                [-0.1, 0.4],
                [0.1, 0.35],
                [-0.1, 0.3],
                [0.05, 0.25],
                [-0.05, 0.2],
                [0.1, 0.15],
                [-0.1, 0.1],
                [0.05, 0.1],
                [-0.05, 0.1],
                [0, 0.1],
            ],
            multiplier: 0.7,
            resetTime: 0.3,
            recoveryRate: 5.5,
            firstShotMultiplier: 0.3,
            firstShotCount: 2,
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
        
        recoil: {
            pattern: [
                [0, 3.5],
                [0.3, 3.0],
                [-0.3, 2.5],
                [0.2, 2.0],
                [-0.2, 1.5],
            ],
            multiplier: 2.5,
            resetTime: 1.0,
            recoveryRate: 3.0,
            firstShotMultiplier: 1.0,
            firstShotCount: 0,
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
        
        recoil: {
            pattern: [
                [0, 2.0],
                [0.2, 1.8],
                [-0.2, 1.5],
                [0.15, 1.2],
                [-0.15, 1.0],
            ],
            multiplier: 1.5,
            resetTime: 0.6,
            recoveryRate: 4.0,
            firstShotMultiplier: 0.8,
            firstShotCount: 1,
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
