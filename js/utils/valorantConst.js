/**
 * Valorant準拠の定数値
 * Valorantの物理システムと完全に一致させるための定数定義
 */

export const VALORANT_CONSTANTS = {
    // 移動速度（units/sec）
    WALK_SPEED: 5.4,
    RUN_SPEED: 5.4, // Valorantは走りなし
    CROUCH_SPEED: 2.7,
    WALK_BACKWARDS_MULTIPLIER: 0.9,
    WALK_SIDEWAYS_MULTIPLIER: 0.9,

    // ストッピング
    FRICTION: 10.0,  // 減速の強さ
    STOP_SPEED: 0.1, // 完全停止判定（units/sec）
    DECELERATION: 12.0, // カウンターストラフィング時の減速率

    // ジャンプ
    JUMP_VELOCITY: 7.0,
    GRAVITY: 20.0,
    AIR_ACCELERATION: 1.0,
    AIR_CONTROL: 0.3, // 空中での制御性
    MAX_AIR_SPEED: 2.0,

    // プレイヤー物理
    PLAYER_HEIGHT: 1.8, // メートル
    PLAYER_WIDTH: 0.8,  // 衝突判定の幅
    CAMERA_HEIGHT: 1.6, // 目の高さ
    CROUCH_HEIGHT: 1.2,

    // マウス感度
    DEFAULT_SENSITIVITY: 0.5,
    DEFAULT_DPI: 800,
    SENSITIVITY_MULTIPLIER: 0.07, // Valorantの感度変換係数

    // 視野角
    DEFAULT_FOV: 103, // Valorant標準FOV（水平）
    MIN_FOV: 70,
    MAX_FOV: 110,

    // 武器関連（Vandal基準）
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
        color: 0xff0000, // 赤
    },
    BODY: {
        height: 0.8,
        width: 0.4,
        heightOffset: 0.9,
        damageMultiplier: 1.0,
        color: 0x0000ff, // 青
    },
    LEGS: {
        height: 0.5,
        width: 0.3,
        heightOffset: 0.25,
        damageMultiplier: 0.85,
        color: 0x00ff00, // 緑
    }
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
        targetDelay: 500,
        randomPosition: true,
        movementType: 'STRAFE', // ランダムな左右移動
        movementSpeed: 3.0,
        health: 100, // 耐久値（トラッキング用）
        difficulty: 'expert'
    },
    PREFIRE: {
        name: 'プリエイム練習',
        description: '固定位置でのクロスヘア配置練習',
        targetCount: 1,
        targetDuration: 3000, // ミリ秒
        targetDelay: 500,
        randomPosition: false,
        difficulty: 'beginner'
    },
    MICROFLICK: {
        name: 'マイクロフリック練習',
        description: '近～中距離フリック練習',
        targetCount: 1,
        targetDuration: 1500,
        targetDelay: 200,
        randomPosition: true,
        angleRange: [5, 30], // 度
        difficulty: 'intermediate'
    },
    MULTIFLICK: {
        name: '複数ターゲット連続フリック',
        description: '2-5個のターゲットを順次破壊',
        targetCount: 3,
        targetDuration: 5000,
        targetDelay: 100,
        randomPosition: true,
        angleRange: [15, 90],
        difficulty: 'advanced'
    },
    SCENARIO: {
        name: '実戦シミュレーション',
        description: 'ピーク、クリアリング、接敵の総合練習',
        targetCount: 2,
        targetDuration: 3000,
        targetDelay: 300,
        randomPosition: true,
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
    VALORANT_CONSTANTS,
    HITBOX,
    GRAPHICS_MODES,
    CROSSHAIR_PRESETS,
    TRAINING_MODES,
    AUDIO_SETTINGS,
    ANALYTICS_CONFIG
};
