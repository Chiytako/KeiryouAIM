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
        description: '壁越しのピークとクロスヘア配置の練習',
        targetCount: 1,
        targetDuration: Infinity, // 時間制限なし
        targetDelay: 500,
        randomPosition: true, // シナリオからランダムに選択
        difficulty: 'intermediate'
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

export const PREAIM_SCENARIOS = [
    // 左側の壁、右からピーク
    {
        id: 'left_wall_peek_right',
        walls: [
            // 左側の壁：プレイヤーの正面左側を塞ぐ
            // x: -4, width: 8 -> x範囲 [-8, 0]
            // z: -10
            { x: -4, z: -10, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット：壁の裏、少し左側
        // x: -6 (壁の範囲内), z: -15 (壁の奥)
        // プレイヤー(0,0)からは壁(-8~0)に遮られる
        // 右(x>0)に移動すると、壁の右端(0)を超えて見えるようになる
        target: { x: -6, y: 0, z: -15 }
    },
    // 右側の壁、左からピーク
    {
        id: 'right_wall_peek_left',
        walls: [
            // 右側の壁：プレイヤーの正面右側を塞ぐ
            // x: 4, width: 8 -> x範囲 [0, 8]
            { x: 4, z: -10, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット：壁の裏、少し右側
        // x: 6 (壁の範囲内), z: -15
        // プレイヤー(0,0)からは壁(0~8)に遮られる
        // 左(x<0)に移動すると、壁の左端(0)を超えて見えるようになる
        target: { x: 6, y: 0, z: -15 }
    },
    // 中央の柱、左側からピーク
    {
        id: 'center_pillar_left',
        walls: [
            // 中央の柱：幅広めにして確実に隠す
            // x: 0, width: 4 -> x範囲 [-2, 2]
            { x: 0, z: -8, width: 4, height: 4, depth: 2, rotation: 0 }
        ],
        // ターゲット：柱の裏、少し左
        // x: -1, z: -12
        // プレイヤー(0,0)からは柱(-2~2)に遮られる
        // 左に大きく移動して斜めから見るか、右から見るか...
        // "左側からピーク"なら、ターゲットは左にいるべきか？
        // いや、ターゲットが左にいるなら、左に移動して見る
        target: { x: -1.5, y: 0, z: -12 }
    },
    // 中央の柱、右側からピーク
    {
        id: 'center_pillar_right',
        walls: [
            { x: 0, z: -8, width: 4, height: 4, depth: 2, rotation: 0 }
        ],
        target: { x: 1.5, y: 0, z: -12 }
    },
    // ダブルドア風（隙間撃ち）- 隙間を狭くして初期位置からは見えなくする
    {
        id: 'double_door_gap',
        walls: [
            // 左ドア: x: -3.5, width: 6 -> [-6.5, -0.5]
            { x: -3.5, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 },
            // 右ドア: x: 3.5, width: 6 -> [0.5, 6.5]
            { x: 3.5, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
            // 隙間: [-0.5, 0.5] (幅1)
        ],
        target: { x: 2.0, y: 0, z: -15 }
    },
    // 高所（ヘヴン） - 右側
    {
        id: 'heaven_right',
        walls: [
            // 土台（箱）: 高さ2m
            { x: 4, z: -12, width: 4, height: 2, depth: 4, rotation: 0 },
            // 手前の壁（隠す用）
            { x: 4, z: -8, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット: 土台の上 (y=2.0)
        // x: 4, z: -12 (土台の中心)
        // プレイヤーからは手前の壁(z=-8)に隠れている
        // 右に回り込んで見る
        target: { x: 5, y: 2.0, z: -12 }
    },
    // 高所（ヘヴン） - 左側
    {
        id: 'heaven_left',
        walls: [
            // 土台
            { x: -4, z: -12, width: 4, height: 2, depth: 4, rotation: 0 },
            // 手前の壁
            { x: -4, z: -8, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -5, y: 2.0, z: -12 }
    },
    // ワイドピーク（遠距離）
    {
        id: 'wide_peek_right',
        walls: [
            // 左壁
            { x: -2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット: 壁から離れた位置
        // 通常より右奥
        target: { x: -8, y: 0, z: -18 }
    },
    // タイトアングル（近距離）
    {
        id: 'tight_angle_left',
        walls: [
            // 右壁
            { x: 2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット: 壁のすぐ裏
        target: { x: 5.5, y: 0, z: -11 }
    },
    // 上下差（スロープ風）
    {
        id: 'ramp_peek',
        walls: [
            // スロープ代わりの階段状ブロック
            { x: 0, z: -10, width: 4, height: 0.5, depth: 1, rotation: 0, y: 0.25 },
            { x: 0, z: -11, width: 4, height: 1.0, depth: 1, rotation: 0, y: 0.5 },
            { x: 0, z: -12, width: 4, height: 1.5, depth: 1, rotation: 0, y: 0.75 },
            // 視線を切る壁（左）
            // x: -1, width: 4 -> [-3, 1]. プレイヤー(0)からターゲット(0)への視線(0)を遮る
            { x: -1, z: -8, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        // ターゲット: 一番上の段
        target: { x: 0, y: 1.5, z: -12 }
    },

    // === コーナーピーク系 ===
    // 左コーナー・近距離
    {
        id: 'corner_left_close',
        walls: [
            { x: -2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -4.5, y: 0, z: -9 }
    },
    // 左コーナー・遠距離
    {
        id: 'corner_left_far',
        walls: [
            { x: -2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -6, y: 0, z: -16 }
    },
    // 右コーナー・近距離
    {
        id: 'corner_right_close',
        walls: [
            { x: 2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 4.5, y: 0, z: -9 }
    },
    // 右コーナー・遠距離
    {
        id: 'corner_right_far',
        walls: [
            { x: 2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 6, y: 0, z: -16 }
    },

    // === 箱・オブジェクト系 ===
    // Haven Aサイト風・箱ピーク左
    {
        id: 'haven_a_box_left',
        walls: [
            // メインの箱
            { x: -1, z: -12, width: 2.5, height: 1.5, depth: 2.5, rotation: 0.3, y: 0.75 },
            // 視線を遮る壁
            { x: -3, z: -9, width: 5, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -2.5, y: 0.8, z: -13 }
    },
    // Haven Aサイト風・箱ピーク右
    {
        id: 'haven_a_box_right',
        walls: [
            // メインの箱
            { x: 1, z: -12, width: 2.5, height: 1.5, depth: 2.5, rotation: -0.3, y: 0.75 },
            // 視線を遮る壁
            { x: 3, z: -9, width: 5, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 2.5, y: 0.8, z: -13 }
    },
    // ダブルスタック箱（2段重ね）
    {
        id: 'double_stack_box',
        walls: [
            // 下段の箱
            { x: 0, z: -10, width: 2, height: 1.2, depth: 2, rotation: 0, y: 0.6 },
            // 上段の箱
            { x: 0, z: -10, width: 1.5, height: 1.0, depth: 1.5, rotation: 0.4, y: 1.7 },
            // 遮蔽壁
            { x: -4.1, z: -9, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 0, y: 2.5, z: -10 }
    },
    // サイト内・デフォルトボックス
    {
        id: 'site_default_box',
        walls: [
            // デフォルトプラント位置の箱
            { x: 2, z: -14, width: 2.2, height: 1.2, depth: 2.2, rotation: 0.5, y: 0.6 },
            // サイト入口の壁
            { x: 1, z: -10, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 2.5, y: 0, z: -15 }
    },
    // 低い障害物越し
    {
        id: 'low_cover_peek',
        walls: [
            // 低めの障害物
            { x: 0, z: -10, width: 6, height: 1.0, depth: 0.8, rotation: 0, y: 0.5 },
            // 側面の壁（初期視線遮断）
            { x: -3, z: -9, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -1, y: 0, z: -12 }
    },

    // === エントリーポイント系 ===
    // Bind Bサイト・フック風
    {
        id: 'bind_b_hook',
        walls: [
            // L字型の壁 - 横
            { x: -3.25, z: -10, width: 7.5, height: 4, depth: 0.5, rotation: 0 },
            // L字型の壁 - 縦
            { x: 0.75, z: -13.25, width: 0.5, height: 4, depth: 6, rotation: 0 }
        ],
        target: { x: -2, y: 0, z: -14 }
    },
    // ドアフレーム・左ピーク
    {
        id: 'doorframe_left',
        walls: [
            // ドア左側の壁
            { x: -2.5, z: -10, width: 3, height: 4, depth: 0.5, rotation: 0 },
            // ドア右側の壁
            { x: 2.5, z: -10, width: 3, height: 4, depth: 0.5, rotation: 0 }
            // 中央に1m幅の隙間
        ],
        target: { x: 1.5, y: 0, z: -14 }
    },
    // ドアフレーム・右ピーク
    {
        id: 'doorframe_right',
        walls: [
            { x: -2.5, z: -10, width: 3, height: 4, depth: 0.5, rotation: 0 },
            { x: 2.5, z: -10, width: 3, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -1.5, y: 0, z: -14 }
    },
    // ナロー通路・奥
    {
        id: 'narrow_corridor',
        walls: [
            // 左壁
            { x: -2, z: -12, width: 0.5, height: 4, depth: 8, rotation: 0 },
            // 右壁
            { x: 2, z: -12, width: 0.5, height: 4, depth: 8, rotation: 0 },
            // 手前の遮蔽
            { x: 0, z: -9, width: 5, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 0, y: 0, z: -15 }
    },

    // === 縦軸エンゲージ系 ===
    // ラフター・屋根上
    {
        id: 'rafter_roof',
        walls: [
            // 屋根の土台
            { x: -3, z: -14, width: 4, height: 2.5, depth: 4, rotation: 0, y: 1.25 },
            // 正面の壁
            { x: -3, z: -10, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -3.5, y: 2.8, z: -14 }
    },
    // 階段上から下を見る
    {
        id: 'stairs_topdown',
        walls: [
            // 階段状のブロック
            { x: 0, z: -8, width: 4, height: 0.5, depth: 1.5, rotation: 0, y: 0.25 },
            { x: 0, z: -9.5, width: 4, height: 1.0, depth: 1.5, rotation: 0, y: 0.5 },
            { x: 0, z: -11, width: 4, height: 1.5, depth: 1.5, rotation: 0, y: 0.75 },
            { x: 0, z: -12.5, width: 4, height: 2.0, depth: 1.5, rotation: 0, y: 1.0 },
            // 側面の壁
            { x: -3, z: -10, width: 2, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 0, y: 0.3, z: -7 }
    },

    // === マルチアングル系 ===
    // L字クリアリング
    {
        id: 'l_shape_clearing',
        walls: [
            // 横の壁
            { x: -4.25, z: -10, width: 6.5, height: 4, depth: 0.5, rotation: 0 },
            // 縦の壁
            { x: -0.75, z: -14.25, width: 0.5, height: 4, depth: 8, rotation: 0 }
        ],
        target: { x: -5, y: 0, z: -15 }
    },
    // トリプルアングル
    {
        id: 'triple_angle',
        walls: [
            // 中央の柱
            { x: 0, z: -12, width: 2, height: 4, depth: 2, rotation: 0.4 },
            // 左の壁
            { x: -5, z: -13, width: 3, height: 4, depth: 0.5, rotation: 0.3 },
            // 右の壁
            { x: 5, z: -13, width: 3, height: 4, depth: 0.5, rotation: -0.3 }
        ],
        target: { x: 3.5, y: 0, z: -14 }
    },
    // サイト進入・2ポジション
    {
        id: 'site_entry_dual',
        walls: [
            // 左の箱
            { x: -4, z: -13, width: 2, height: 1.5, depth: 2, rotation: 0.2, y: 0.75 },
            // 右の箱
            { x: 4, z: -14, width: 2.5, height: 1.2, depth: 2.5, rotation: -0.3, y: 0.6 },
            // エントリーの壁
            { x: 0, z: -9, width: 10, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -4.5, y: 0, z: -13.5 }
    },

    // === 新規追加シナリオ ===
    // Ascent B Main風 (狭い通路 + 箱)
    {
        id: 'ascent_b_main',
        walls: [
            // 左壁
            { x: -3, z: -12, width: 1, height: 4, depth: 10, rotation: 0 },
            // 右壁
            { x: 3, z: -12, width: 1, height: 4, depth: 10, rotation: 0 },
            // 奥の箱
            { x: -1.5, z: -15, width: 2, height: 1.5, depth: 2, rotation: 0, y: 0.75 },
            // 手前の遮蔽
            { x: 0, z: -8, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -1.5, y: 0, z: -16.5 }
    },
    // Split Mid風 (高台)
    {
        id: 'split_mid_high',
        walls: [
            // 高台の床
            { x: 0, z: -15, width: 8, height: 2, depth: 4, rotation: 0, y: 1.0 },
            // 手前の壁（視線切り）
            { x: 2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -2, y: 2.0, z: -15 }
    },
    // Bind Showers風 (窪み/Cubby)
    {
        id: 'bind_showers_cubby',
        walls: [
            // 左の壁
            { x: -3, z: -12, width: 4, height: 4, depth: 0.5, rotation: 0 },
            // 奥の壁
            { x: -5, z: -14, width: 0.5, height: 4, depth: 4, rotation: 0 },
            // 手前の壁
            { x: -1, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -4, y: 0, z: -13 }
    },
    // Fracture Dish風 (遠距離 + 部分遮蔽)
    {
        id: 'fracture_dish_long',
        walls: [
            // 遠くの遮蔽物
            { x: 2, z: -20, width: 4, height: 3, depth: 0.5, rotation: -0.2 },
            // 手前の視線切り
            { x: -2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 5, y: 0, z: -22 }
    },
    // Lotus C風 (スロープ/盛り土)
    {
        id: 'lotus_c_mound',
        walls: [
            // 盛り土（階段で近似）
            { x: 0, z: -12, width: 6, height: 0.5, depth: 2, rotation: 0, y: 0.25 },
            { x: 0, z: -13, width: 6, height: 1.0, depth: 2, rotation: 0, y: 0.5 },
            // 柱
            { x: 0, z: -12.5, width: 1, height: 3, depth: 1, rotation: 0, y: 1.5 },
            // 手前の壁
            { x: 0, z: -8, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 1.5, y: 0.5, z: -13 }
    },
    // オフアングル・左 (壁から少し離れた位置)
    {
        id: 'off_angle_left',
        walls: [
            // コーナーの壁
            { x: -3, z: -12, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -7, y: 0, z: -14 } // 壁の端(-6)からさらに外側
    },
    // オフアングル・右
    {
        id: 'off_angle_right',
        walls: [
            // コーナーの壁
            { x: 3, z: -12, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 7, y: 0, z: -14 }
    },
    // ダブルピーク (左配置)
    {
        id: 'double_peek_left',
        walls: [
            // 左の箱
            { x: -3, z: -14, width: 2, height: 2, depth: 2, rotation: 0 },
            // 右の箱
            { x: 3, z: -14, width: 2, height: 2, depth: 2, rotation: 0 },
            // 中央の目隠し壁
            { x: 0, z: -10, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -3, y: 0, z: -15.5 } // 左箱の裏
    },
    // ダブルピーク (右配置)
    {
        id: 'double_peek_right',
        walls: [
            // 左の箱
            { x: -3, z: -14, width: 2, height: 2, depth: 2, rotation: 0 },
            // 右の箱
            { x: 3, z: -14, width: 2, height: 2, depth: 2, rotation: 0 },
            // 中央の目隠し壁
            { x: 0, z: -10, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 3, y: 0, z: -15.5 } // 右箱の裏
    },
    // 隙間撃ち (極狭)
    {
        id: 'tight_gap',
        walls: [
            // 左壁
            { x: -2.2, z: -12, width: 4, height: 4, depth: 0.5, rotation: 0 },
            // 右壁
            { x: 2.2, z: -12, width: 4, height: 4, depth: 0.5, rotation: 0 },
            // 手前の壁
            { x: 0, z: -8, width: 2, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 0, y: 0, z: -16 } // 隙間(幅0.4)の奥
    },

    // === 実践的マップ再現シナリオ ===
    // Ascent A Main (Generator Peek)
    {
        id: 'ascent_a_gen',
        walls: [
            // ジェネレーター（黒い箱）
            { x: 2, z: -15, width: 3, height: 2.5, depth: 3, rotation: 0, y: 1.25 },
            // サイト入口の壁
            { x: -4, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 3.5, y: 0, z: -15 } // ジェネレーターの横
    },
    // Ascent A Main (Heaven/Rafters)
    {
        id: 'ascent_a_heaven',
        walls: [
            // ヘヴンの床
            { x: 0, z: -20, width: 10, height: 3, depth: 4, rotation: 0, y: 1.5 },
            // ガラス窓下の壁
            { x: 0, z: -18, width: 10, height: 1.5, depth: 0.5, rotation: 0, y: 0.75 },
            // 手前のメイン壁
            { x: -3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 2, y: 3.0, z: -20 } // ヘヴン上
    },
    // Haven C Long (Long range) - Fixed
    {
        id: 'haven_c_long_fixed',
        walls: [
            // 奥のサイト壁
            { x: 3, z: -19, width: 4, height: 4, depth: 1.0, rotation: -0.1 },
            // 手前の壁（ロング入口）
            { x: -2, z: -10, width: 6, height: 4, depth: 1.0, rotation: 0 }
        ],
        target: { x: 4, y: 0, z: -20 } // 距離を調整
    },
    // Bind Hookah (Window)
    {
        id: 'bind_hookah',
        walls: [
            // 窓枠（下）
            { x: -3, z: -12, width: 4, height: 1.5, depth: 0.5, rotation: 0, y: 0.75 },
            // 窓枠（上）
            { x: -3, z: -12, width: 4, height: 1, depth: 0.5, rotation: 0, y: 3.5 },
            // 窓枠（左）
            { x: -5, z: -12, width: 1, height: 4, depth: 0.5, rotation: 0 },
            // 窓枠（右）
            { x: -1, z: -12, width: 1, height: 4, depth: 0.5, rotation: 0 },
            // 手前の壁
            { x: 2, z: -8, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -3, y: 1.5, z: -14 } // 窓の中
    },
    // Split B Heaven (Mail)
    {
        id: 'split_b_heaven',
        walls: [
            // ヘヴンの床
            { x: 4, z: -15, width: 6, height: 2, depth: 6, rotation: 0, y: 1.0 },
            // 柱
            { x: 2, z: -13, width: 1, height: 4, depth: 1, rotation: 0 },
            // 手前のガレージ壁
            { x: -2, z: -10, width: 8, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 5, y: 2.0, z: -15 } // 高台の上
    },

    // === 追加シナリオ (Icebox, Breeze, Lotus, Pearl, Fracture) ===
    // Icebox A Pipes/Maze (Verticality)
    {
        id: 'icebox_a_pipes',
        walls: [
            // パイプ上の足場
            { x: 0, z: -14, width: 6, height: 0.5, depth: 2, rotation: 0, y: 2.5 },
            // 下の箱
            { x: 0, z: -14, width: 2, height: 1.5, depth: 2, rotation: 0, y: 0.75 },
            // 手前の視線切り
            { x: -3, z: -10, width: 4, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 2, y: 2.5, z: -14 } // パイプ上
    },
    // Breeze A Pyramids (Open space)
    {
        id: 'breeze_a_pyramids',
        walls: [
            // ピラミッド（四角錐の代わりに箱で代用し、回転させる）
            { x: 0, z: -18, width: 6, height: 4, depth: 6, rotation: 0.785 }, // 45度回転
            // 手前の柱
            { x: -4, z: -12, width: 1, height: 4, depth: 1, rotation: 0 }
        ],
        target: { x: 4, y: 0, z: -18 } // ピラミッドの横
    },
    // Lotus C Mound (Slope/Height diff)
    {
        id: 'lotus_c_mound_v2',
        walls: [
            // 盛り土（階段状）
            { x: 2, z: -15, width: 4, height: 0.5, depth: 4, rotation: 0, y: 0.25 },
            { x: 2, z: -16, width: 4, height: 1.0, depth: 3, rotation: 0, y: 0.5 },
            { x: 2, z: -17, width: 4, height: 1.5, depth: 2, rotation: 0, y: 0.75 },
            // 手前の壁
            { x: -2, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: 2, y: 1.5, z: -17 } // 丘の上
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
            { x: 3, z: -10, width: 6, height: 4, depth: 0.5, rotation: 0 }
        ],
        target: { x: -1.5, y: 0, z: -25 } // 柱の裏
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
        target: { x: 0, y: 0, z: -16 } // 下のフロア奥
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
