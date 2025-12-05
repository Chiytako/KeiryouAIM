/**
 * ゲーム内定数値
 * タクティカルシューターの物理システムと一致させるための定数定義
 */

export const PHYSICS_CONSTANTS = {
    // 移動速度（units/sec）
    RUN_SPEED: 4.86,      // デフォルト（走り）5.4 * 0.9
    SHIFT_WALK_SPEED: 2.57, // Shift歩き（約53%）2.86 * 0.9
    CROUCH_SPEED: 1.46,  // しゃがみ（約30%）1.62 * 0.9
    WALK_BACKWARDS_MULTIPLIER: 0.9,
    WALK_SIDEWAYS_MULTIPLIER: 0.9,

    // ストッピング
    FRICTION: 140.0,  // 減速の強さ（キー離した時）- Counter-strafeと同じに統一
    STOP_SPEED: 0.01, // 完全停止判定（units/sec）
    DECELERATION: 140.0, // カウンターストラフィング時の減速率（逆キー入力時）
    ACCELERATION: 280.0, // 最大加速度（Ease-Inのピーク値）

    // ジャンプ
    JUMP_VELOCITY: 7.0,
    GRAVITY: 20.0,
    AIR_ACCELERATION: 1.0,
    AIR_CONTROL: 0.3, // 空中での制御性
    MAX_AIR_SPEED: 2.0,

    // プレイヤー物理
    PLAYER_HEIGHT: 1.8, // メートル
    PLAYER_WIDTH: 0.8,  // 衝突判定の幅
    MAX_STEP_HEIGHT: 0.5, // 乗り越えられる段差の高さ
    CAMERA_HEIGHT: 1.6, // 目の高さ
    CROUCH_HEIGHT: 1.2,

    // マウス感度
    DEFAULT_SENSITIVITY: 0.5,
    DEFAULT_DPI: 800,
    SENSITIVITY_MULTIPLIER: 0.07, // 一般的なタクティカルシューターの感度変換係数

    // 視野角
    DEFAULT_FOV: 103, // 標準FOV（水平）
    MIN_FOV: 70,
    MAX_FOV: 110,

    // 武器関連（標準的なライフル基準）
    WEAPON_FIRE_RATE: 9.75, // 発射レート（rounds/sec）
    WEAPON_DAMAGE_HEAD: 160,
    WEAPON_DAMAGE_BODY: 40,
    WEAPON_DAMAGE_LEGS: 34,
    WEAPON_RANGE: 50, // メートル

    // エイム精度（停止時）
    ACCURACY_STANDING_STILL: 1.0,
    ACCURACY_MOVING: 0.3,
    ACCURACY_JUMPING: 0.1,
    ACCURACY_CROUCHING: 1.1,

    // タイミング
    PEEK_TIME: 0.2, // 標準的なピーク時間（秒）
    REACTION_TIME_AVERAGE: 0.2, // 平均反応時間（秒）

    // ゲーム設定
    TICKRATE: 128, // サーバーティックレート
    UPDATE_RATE: 60, // 推奨更新レート
};

export const HITBOX = {
    HEAD: {
        radius: 0.2,  // 20cm
        heightOffset: 1.6, // 地面から頭の中心まで
        damageMultiplier: 4.0, // ヘッドショット倍率
        color: 0xE87B35, // Claude風の温かみのあるオレンジ
    },
    BODY: {
        height: 0.8,
        width: 0.4,
        heightOffset: 0.9,
        damageMultiplier: 1.0,
        color: 0xD97D54, // Claude風のソフトなコーラル
    },
    LEGS: {
        height: 0.5,
        width: 0.3,
        heightOffset: 0.25,
        damageMultiplier: 0.85,
        color: 0x00ff00, // 緑
    }
};

export const NORMALIZATION_BOUNDS = {
    width: 0.6, // m (Reference width for normalization)
    height: 2.0 // m (Reference height for normalization)
};

export const GRAPHICS_MODES = {
    RICH: {
        mode: 'RICH',
        shadows: true,
        shadowMapSize: 2048,
        particles: true,
        particleCount: 500,
        postProcessing: true,
        effects: ['bloom', 'ssao'],
        modelDetail: 'high',
        textureQuality: 'high',
        textureResolution: 2048,
        antialiasing: 'MSAA',
        targetFPS: 120,
        description: 'リッチ版 - 視覚的に豪華で没入感のある体験'
    },
    STANDARD: {
        mode: 'STANDARD',
        shadows: false,
        particles: 'minimal',
        particleCount: 50,
        postProcessing: false,
        modelDetail: 'medium',
        textureQuality: 'medium',
        textureResolution: 1024,
        antialiasing: 'FXAA',
        targetFPS: 60,
        description: '標準版 - バランスの取れた実用的デザイン'
    },
    WIREFRAME: {
        mode: 'WIREFRAME',
        shadows: false,
        particles: false,
        postProcessing: false,
        modelDetail: 'low',
        wireframeMode: true,
        wireframeLinewidth: 2,
        glowEffect: true,
        scanlines: true,
        targetFPS: 144,
        description: '線画版 - ミニマリストで集中力を高めるデザイン'
    }
};

export const CROSSHAIR_PRESETS = {
    DEFAULT: {
        type: 'cross',
        color: '#00FF00',
        size: 4,
        thickness: 2,
        gap: 2,
        opacity: 1.0,
        outline: true,
        outlineThickness: 1,
        outlineColor: '#000000'
    },
    DOT: {
        type: 'dot',
        color: '#FFFFFF',
        size: 2,
        opacity: 1.0,
        outline: true,
        outlineThickness: 1,
        outlineColor: '#000000'
    },
    CIRCLE: {
        type: 'circle',
        color: '#00FFFF',
        size: 6,
        thickness: 2,
        opacity: 0.8,
        outline: false
    },
    CROSS_DOT: {
        type: 'cross_dot',
        color: '#FF0000',
        size: 4,
        thickness: 2,
        gap: 2,
        dotSize: 2,
        opacity: 1.0,
        outline: true,
        outlineThickness: 1,
        outlineColor: '#000000'
    }
};

export const TRAINING_MODES = {
    GRIDSHOT: {
        name: 'グリッドショット',
        description: '3x3のグリッド上に現れるターゲットを素早く破壊',
        targetCount: 3,
        targetDuration: 4000,
        targetDelay: 0,
        randomPosition: false, // グリッドロジックを使用
        gridSize: 3,
        difficulty: 'intermediate'
    },
    SPIDERSHOT: {
        name: 'スパイダーショット',
        description: '中央とランダムな位置を交互に撃つ',
        targetCount: 1, // 常に1つずつ（中央か外側）
        targetDuration: 3000,
        targetDelay: 0,
        randomPosition: true,
        centerPosition: { x: 0, y: 1.5, z: -10 },
        difficulty: 'advanced'
    },
    TRACKING: {
        name: 'トラッキング',
        description: '動くターゲットを追い続ける',
        targetCount: 1,
        targetDuration: 10000, // 長時間生存
        targetDelay: 250,
        randomPosition: true,
        movementType: 'STRAFE', // ランダムな左右移動
        movementSpeed: 3.0,
        health: 100, // 耐久値（トラッキング用）
        difficulty: 'expert'
    },
    PREFIRE: {
        name: 'アングルクリアリング練習',
        description: 'ピークする際のクロスヘア配置とクリアリングの練習',
        targetCount: 1,
        targetDuration: Infinity, // 時間制限なし
        targetDelay: 250,
        randomPosition: true, // シナリオからランダムに選択
        difficulty: 'intermediate'
    },
    MICROFLICK: {
        name: 'フリック練習',
        description: '近～中距離フリック練習',
        targetCount: 1,
        targetDuration: 1500,
        targetDelay: 100,
        randomPosition: true,
        angleRange: [5, 30], // 度
        difficulty: 'intermediate'
    },
    MULTIFLICK: {
        name: '複数ターゲット連続フリック',
        description: '2-5個のターゲットを順次破壊',
        targetCount: 3,
        targetDuration: 5000,
        targetDelay: 50,
        randomPosition: true,
        angleRange: [15, 90],
        difficulty: 'advanced'
    },
    SCENARIO: {
        name: '実践モード',
        description: 'Valorantの対面シーンを再現した実践的練習',
        targetCount: 1, // シナリオごとに上書き
        targetDuration: 10000,
        targetDelay: 500,
        randomPosition: false, // 固定配置
        includeMovement: true,
        difficulty: 'expert'
    },
    FREEPLAY: {
        name: 'フリープレイ',
        description: '自由な練習モード',
        targetCount: 5,
        targetDuration: 10000,
        targetDelay: 0,
        randomPosition: true,
        customizable: true,
        difficulty: 'custom'
    }
};

export const PREAIM_SCENARIOS = [
    // === コーナーピーク系 ===
    {
        id: 'corner_left',
        situationType: 'corner_clear',
        walls: [
            { x: -2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット出現可能領域（壁の裏側）
        spawnArea: {
            minX: -8, maxX: -3,
            minZ: -18, maxZ: -9,
            minY: 0, maxY: 0
        },
        // プレイヤーがピークすべき方向
        peekDirections: ['left'],
        // 難易度調整用のヒント
        difficulty: 'beginner'
    },
    {
        id: 'corner_right',
        situationType: 'corner_clear',
        walls: [
            { x: 2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: 3, maxX: 8,
            minZ: -18, maxZ: -9,
            minY: 0, maxY: 0
        },
        peekDirections: ['right'],
        difficulty: 'beginner'
    },

    // === ダブルドア/隙間系 ===
    {
        id: 'double_door',
        situationType: 'gap_shot',
        walls: [
            { x: -4, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 },
            { x: 4, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -3, maxX: 3,
            minZ: -18, maxZ: -12,
            minY: 0, maxY: 0
        },
        peekDirections: ['left', 'right', 'forward'],
        difficulty: 'intermediate'
    },

    // === 高所（ヘヴン）系 ===
    {
        id: 'heaven_right',
        situationType: 'elevation',
        walls: [
            // 高台
            { x: 4, z: -12, width: 4, height: 2, depth: 4, rotation: 0, y: 1.0 },
            // 視線を切る壁
            { x: 2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: 2, maxX: 6,
            minZ: -15, maxZ: -10,
            minY: 2.0, maxY: 2.0  // 高台の上
        },
        peekDirections: ['right', 'forward-right'],
        difficulty: 'intermediate'
    },
    {
        id: 'heaven_left',
        situationType: 'elevation',
        walls: [
            { x: -4, z: -12, width: 4, height: 2, depth: 4, rotation: 0, y: 1.0 },
            { x: -2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -6, maxX: -2,
            minZ: -15, maxZ: -10,
            minY: 2.0, maxY: 2.0
        },
        peekDirections: ['left', 'forward-left'],
        difficulty: 'intermediate'
    },

    // === L字クリアリング ===
    {
        id: 'l_shape',
        situationType: 'multi_angle',
        walls: [
            { x: -4, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 },
            { x: -1, z: -14, width: 0.5, height: 4, depth: 8, rotation: 0 }
        ],
        spawnArea: {
            minX: -8, maxX: -2,
            minZ: -18, maxZ: -11,
            minY: 0, maxY: 0
        },
        peekDirections: ['left', 'forward'],
        difficulty: 'advanced'
    },

    // === 箱/オブジェクト系 ===
    {
        id: 'site_box',
        situationType: 'object_clear',
        walls: [
            // メインの箱
            { x: 0, z: -12, width: 2.5, height: 1.5, depth: 2.5, rotation: 0.3, y: 0.75 },
            // 視線を切る壁
            { x: -4, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -4, maxX: 4,
            minZ: -16, maxZ: -10,
            minY: 0, maxY: 0  // 箱の上にも出現可能だが、浮き防止のため床チェックに任せる
        },
        peekDirections: ['left', 'right', 'forward'],
        difficulty: 'intermediate'
    },

    // === ナロー通路 ===
    {
        id: 'narrow_corridor',
        situationType: 'corridor',
        walls: [
            { x: -2, z: -12, width: 0.5, height: 4, depth: 10, rotation: 0 },
            { x: 2, z: -12, width: 0.5, height: 4, depth: 10, rotation: 0 },
            // 入口を塞ぐ壁（片側）
            { x: -1, z: -8, width: 2, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -1.5, maxX: 1.5,
            minZ: -16, maxZ: -10,
            minY: 0, maxY: 0
        },
        peekDirections: ['right', 'forward'],
        difficulty: 'intermediate'
    },

    // === オフアングル（壁から離れた位置） ===
    {
        id: 'off_angle_left',
        situationType: 'off_angle',
        walls: [
            { x: -3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -10, maxX: -5,  // 壁の端からさらに外側
            minZ: -18, maxZ: -11,
            minY: 0, maxY: 0
        },
        peekDirections: ['left', 'forward-left'],
        difficulty: 'advanced'
    },
    {
        id: 'off_angle_right',
        situationType: 'off_angle',
        walls: [
            { x: 3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: 5, maxX: 10,
            minZ: -18, maxZ: -11,
            minY: 0, maxY: 0
        },
        peekDirections: ['right', 'forward-right'],
        difficulty: 'advanced'
    },

    // === Valorantマップ再現系 ===
    // Ascent A Main風
    {
        id: 'ascent_a_main',
        situationType: 'site_entry',
        walls: [
            // ジェネレーター
            { x: 3, z: -14, width: 3, height: 2.5, depth: 3, rotation: 0, y: 1.25 },
            // サイト入口
            { x: -3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -2, maxX: 6,
            minZ: -18, maxZ: -12,
            minY: 0, maxY: 0  // ジェネ上も含むが、浮き防止のため床チェックに任せる
        },
        peekDirections: ['left', 'forward', 'right'],
        difficulty: 'advanced'
    },

    // Bind B Hookah風
    {
        id: 'bind_hookah',
        situationType: 'window_peek',
        walls: [
            // 窓枠
            { x: -3, z: -12, width: 4, height: 1.5, depth: 0.5, rotation: 0, y: 0.75 },
            { x: -3, z: -12, width: 4, height: 1, depth: 0.5, rotation: 0, y: 3.5 },
            { x: 2, z: -15, width: 4, height: 0.5, depth: 4, rotation: 0, y: 0.25 },
            { x: 2, z: -16, width: 4, height: 1.0, depth: 3, rotation: 0, y: 0.5 },
            { x: 2, z: -17, width: 4, height: 1.5, depth: 2, rotation: 0, y: 0.75 },
            // 手前の壁
            { x: -2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: 0, maxX: 4,
            minZ: -18, maxZ: -16,
            minY: 1.5, maxY: 1.5 // 丘の上
        },
        peekDirections: ['right'],
        difficulty: 'advanced'
    },
    // Pearl B Long (Long range + Pillar)
    {
        id: 'pearl_b_long',
        walls: [
            // 柱
            { x: 0, z: -25, width: 1.5, height: 4, depth: 1.5, rotation: 0 },
            // 遠くの壁
            { x: -5, z: -30, width: 10, height: 4, depth: 0.5, rotation: -0.2 },
            // 手前の壁
            { x: -3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -3, maxX: -1,
            minZ: -26, maxZ: -24,
            minY: 0, maxY: 0
        },
        peekDirections: ['right'],
        difficulty: 'advanced'
    },
    // Fracture A Main (Under/Over)
    {
        id: 'fracture_a_main',
        walls: [
            // 上のフロア
            { x: 0, z: -15, width: 8, height: 0.5, depth: 4, rotation: 0, y: 3.0 },
            // 下の柱
            { x: -3, z: -15, width: 1, height: 3, depth: 1, rotation: 0, y: 1.5 },
            { x: 3, z: -15, width: 1, height: 3, depth: 1, rotation: 0, y: 1.5 },
            // 手前の壁
            { x: 0, z: -10, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        spawnArea: {
            minX: -2, maxX: 2,
            minZ: -18, maxZ: -14,
            minY: 0, maxY: 0
        },
        peekDirections: ['left', 'right'],
        difficulty: 'advanced'
    }
];

export const PRACTICAL_SCENARIOS = [
    // === Ascent A Main (Generator/Dice) ===
    {
        id: 'ascent_a_main_peek',
        map: 'Ascent',
        location: 'A Main',
        description: 'ジェネレーター裏からのピーク',
        walls: [
            // ジェネレーター (黒い箱)
            { x: 3, z: -15, width: 2.5, height: 2.5, depth: 2.5, rotation: 0 },
            // ダイス (手前の箱)
            { x: -2, z: -12, width: 1.5, height: 1.5, depth: 1.5, rotation: 0.2 },
            // メイン入口の壁
            { x: -5, z: -8, width: 4, height: 4, depth: 0.5, rotation: 0 },
            { x: 5, z: -8, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        enemies: [
            {
                type: 'peek', // 壁から出てくる
                position: { x: 4.5, y: 0, z: -15 }, // ジェネ裏
                moveType: 'STRAFE', // 左右移動
                moveSpeed: 2.5,
                peekDirection: 'left', // 左に出てくる
                triggerDistance: 15 // プレイヤーが近づいたら
            }
        ],
        playerStart: { x: 0, z: 0 }
    },
    // === Bind Hookah (Close Range) ===
    {
        id: 'bind_hookah_entry',
        map: 'Bind',
        location: 'B Hookah',
        description: 'フッカー出口のクリアリング',
        walls: [
            // 窓枠
            { x: 0, z: -8, width: 3, height: 1, depth: 0.5, y: 0.5, rotation: 0 }, // 下
            { x: 0, z: -8, width: 3, height: 1, depth: 0.5, y: 3.5, rotation: 0 }, // 上
            { x: -2, z: -8, width: 1, height: 4, depth: 0.5, rotation: 0 }, // 左
            { x: 2, z: -8, width: 1, height: 4, depth: 0.5, rotation: 0 }, // 右
            // 内部の箱
            { x: -1.5, z: -10, width: 1, height: 1, depth: 1, rotation: 0 }
        ],
        enemies: [
            {
                type: 'hold', // 待っている
                position: { x: -1.5, y: 0, z: -12 }, // 左角待ち
                moveType: 'CROUCH_PEEK', // しゃがみピーク
                moveSpeed: 1.5
            }
        ]
    },
    // === Haven C Long (Long Range) ===
    {
        id: 'haven_c_long',
        map: 'Haven',
        location: 'C Long',
        description: 'Cロングでの撃ち合い',
        walls: [
            // 左側の壁
            { x: -4, z: -20, width: 1, height: 4, depth: 30, rotation: 0 },
            // 右側の壁
            { x: 4, z: -20, width: 1, height: 4, depth: 30, rotation: 0 },
            // 奥の箱
            { x: 2, z: -35, width: 2, height: 1.5, depth: 2, rotation: 0 }
        ],
        enemies: [
            {
                type: 'jiggle', // ジグルピーク
                position: { x: 2, y: 0, z: -35 }, // 箱裏
                moveType: 'JIGGLE',
                moveSpeed: 3.0,
                width: 1.0 // ジグル幅
            }
        ]
    },
    // === Split B Heaven (Vertical) ===
    {
        id: 'split_b_heaven',
        map: 'Split',
        location: 'B Heaven',
        description: 'ヘヴン下からの撃ち上げ',
        walls: [
            // ヘヴンの床
            { x: 0, z: -15, width: 10, height: 0.5, depth: 4, y: 3.0, rotation: 0 },
            // 柱
            { x: 0, z: -15, width: 1, height: 3, depth: 1, y: 1.5, rotation: 0 },
            // 手前の箱
            { x: -2, z: -10, width: 1.5, height: 1.5, depth: 1.5, rotation: 0 }
        ],
        enemies: [
            {
                type: 'peek',
                position: { x: 2, y: 3.0, z: -15 }, // ヘヴン上
                moveType: 'STRAFE',
                moveSpeed: 2.0
            }
        ]
    },
    // === Icebox A Site (Maze) ===
    {
        id: 'icebox_a_site',
        map: 'Icebox',
        location: 'A Site',
        description: '複雑な地形でのクリアリング',
        walls: [
            // 中央の構造物
            { x: 0, z: -12, width: 3, height: 2, depth: 3, rotation: 0 },
            // 上の足場
            { x: 0, z: -12, width: 4, height: 0.2, depth: 4, y: 2.1, rotation: 0 },
            // ジップライン（柱で表現）
            { x: 3, z: -12, width: 0.2, height: 5, depth: 0.2, rotation: 0 }
        ],
        enemies: [
            {
                type: 'patrol', // 巡回
                position: { x: -2, y: 0, z: -12 },
                moveType: 'PATROL',
                points: [
                    { x: -2, z: -12 },
                    { x: 2, z: -12 }
                ],
                moveSpeed: 2.2
            }
        ]
    },
    // === Split A Heaven (Downward Flick) ===
    {
        id: 'split_a_heaven_defense',
        map: 'Split',
        location: 'A Heaven',
        description: 'ヘヴンからサイト下への撃ち下ろし',
        walls: [
            // ヘヴンの床（プレイヤーが立つ場所）
            { x: 0, z: 0, width: 10, height: 0.5, depth: 5, y: 3.5, rotation: 0 },
            // 手すり/壁
            { x: 0, z: -2.5, width: 10, height: 1.0, depth: 0.5, y: 4.0, rotation: 0 },
            // サイト内の障害物（エルボー）
            { x: -3, z: -15, width: 4, height: 3, depth: 4, rotation: 0 }
        ],
        enemies: [
            {
                type: 'peek',
                position: { x: -3, y: 0, z: -12 }, // サイト下
                moveType: 'STRAFE',
                moveSpeed: 2.5,
                triggerDistance: 20
            }
        ],
        playerStart: { x: 0, y: 3.5, z: 0 } // 高所スタート
    },
    // === Ascent B Heaven (Downward Flick) ===
    {
        id: 'ascent_b_heaven_defense',
        map: 'Ascent',
        location: 'B Heaven',
        description: 'Bヘヴンからサイトへの防衛',
        walls: [
            // ヘヴンの床
            { x: 0, z: 0, width: 8, height: 0.5, depth: 4, y: 3.0, rotation: 0 },
            // 階段部分（スロープ）
            { x: -5, z: -5, width: 4, height: 0.5, depth: 8, y: 1.5, rotation: -0.5 },
            // サイト中央の箱
            { x: 0, z: -15, width: 2, height: 1.5, depth: 2, rotation: 0 }
        ],
        enemies: [
            {
                type: 'run_in', // 走り込んでくる
                position: { x: 5, y: 0, z: -15 }, // メインから
                moveType: 'LINEAR',
                moveSpeed: 3.5, // 速め
                points: [
                    { x: 5, z: -15 },
                    { x: -5, z: -10 } // サイト奥へ
                ]
            }
        ],
        playerStart: { x: 0, y: 3.0, z: 0 } // 高所スタート
    }

];

export const AUDIO_SETTINGS = {
    MASTER_VOLUME: 1.0,
    SFX_VOLUME: 0.8,
    MUSIC_VOLUME: 0.3,

    SOUNDS: {
        SHOOT: 'assets/sounds/shoot.mp3',
        HIT: 'assets/sounds/hit.mp3',
        HEADSHOT: 'assets/sounds/headshot.mp3',
        MISS: 'assets/sounds/miss.mp3',
        UI_CLICK: 'assets/sounds/ui/click.mp3',
        UI_HOVER: 'assets/sounds/ui/hover.mp3',
        COUNTDOWN: 'assets/sounds/ui/countdown.mp3',
        TIMER_END: 'assets/sounds/ui/timer_end.mp3'
    }
};

export const ANALYTICS_CONFIG = {
    // データ収集間隔
    MOUSE_TRACKING_INTERVAL: 16, // ミリ秒（約60Hz）
    STAT_UPDATE_INTERVAL: 100,

    // 保存設定
    MAX_SESSIONS_STORED: 100,
    MAX_REPLAY_LENGTH: 300, // 秒

    // ヒートマップ設定
    HEATMAP_RESOLUTION: 64, // グリッド解像度
    HEATMAP_DECAY: 0.95, // 減衰率

    // 分析閾値
    ACCURACY_THRESHOLD_GOOD: 0.7,
    ACCURACY_THRESHOLD_AVERAGE: 0.5,
    REACTION_TIME_THRESHOLD_FAST: 0.15,
    REACTION_TIME_THRESHOLD_AVERAGE: 0.25,
};

export default {
    PHYSICS_CONSTANTS,
    HITBOX,
    GRAPHICS_MODES,
    CROSSHAIR_PRESETS,
    TRAINING_MODES,
    AUDIO_SETTINGS,
    ANALYTICS_CONFIG
};
