/**
 * 数学関数ユーティリティ
 * ゲーム内で使用する数学関数とヘルパー関数
 */

/**
 * Valorant感度 → ブラウザー感度変換
 * @param {number} dpi - マウスDPI
 * @param {number} valorantSens - Valorantゲーム内感度
 * @returns {number} ブラウザーでの感度
 */
export function calculateSensitivity(dpi, valorantSens, multiplier = 1.0) {
    // Valorantの感度計算: 1カウントあたりの角度（度） = 0.07 * 感度
    // これをラジアンに変換して返す
    // DPIはハードウェア側でカウント数に反映されるため、ここでは計算に含めない
    // multiplier: 環境差（OS設定やブラウザの挙動）を吸収するための係数

    // 安全装置: 極端な値を防ぐ
    const safeSens = clamp(valorantSens, 0.001, 10);
    const safeMultiplier = clamp(multiplier, 0.01, 5.0);

    // 0.07はValorantの標準的なYaw係数
    // 一部の環境ではマウスイベントのdeltaがDPIの影響を強く受ける場合があるため、
    // 必要に応じて調整できるようにする
    const baseScale = 0.07;

    return degToRad(baseScale * safeSens * safeMultiplier);
}

/**
 * 度をラジアンに変換
 * @param {number} degrees - 角度（度）
 * @returns {number} ラジアン
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * ラジアンを度に変換
 * @param {number} radians - ラジアン
 * @returns {number} 角度（度）
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * 値を指定範囲にクランプ
 * @param {number} value - 値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} クランプされた値
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 線形補間
 * @param {number} start - 開始値
 * @param {number} end - 終了値
 * @param {number} t - 補間係数（0-1）
 * @returns {number} 補間された値
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 2点間の距離を計算
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} 距離
 */
export function distance2D(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 3D空間での2点間の距離を計算
 * @param {Object} p1 - {x, y, z}
 * @param {Object} p2 - {x, y, z}
 * @returns {number} 距離
 */
export function distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * ランダムな整数を生成
 * @param {number} min - 最小値（含む）
 * @param {number} max - 最大値（含む）
 * @returns {number} ランダムな整数
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ランダムな浮動小数点数を生成
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} ランダムな浮動小数点数
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * ランダムなベクトルを生成
 * @param {number} angleRange - 角度範囲（度）
 * @param {number} distance - 距離
 * @returns {Object} {x, y, z}
 */
export function randomVectorInRange(angleRange, distance) {
    const angle = randomFloat(-angleRange, angleRange);
    const elevation = randomFloat(-angleRange / 2, angleRange / 2);

    const angleRad = degToRad(angle);
    const elevationRad = degToRad(elevation);

    return {
        x: Math.sin(angleRad) * Math.cos(elevationRad) * distance,
        y: Math.sin(elevationRad) * distance,
        z: Math.cos(angleRad) * Math.cos(elevationRad) * distance
    };
}

/**
 * 配列からランダムな要素を選択
 * @param {Array} array - 配列
 * @returns {*} ランダムな要素
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * イージング関数: EaseOutQuad
 * @param {number} t - 時間（0-1）
 * @returns {number} イージングされた値
 */
export function easeOutQuad(t) {
    return t * (2 - t);
}

/**
 * イージング関数: EaseInOutQuad
 * @param {number} t - 時間（0-1）
 * @returns {number} イージングされた値
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * イージング関数: EaseOutCubic
 * @param {number} t - 時間（0-1）
 * @returns {number} イージングされた値
 */
export function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

/**
 * 2つのベクトル間の角度を計算
 * @param {Object} v1 - {x, y, z}
 * @param {Object} v2 - {x, y, z}
 * @returns {number} 角度（ラジアン）
 */
export function angleBetweenVectors(v1, v2) {
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

    return Math.acos(clamp(dot / (mag1 * mag2), -1, 1));
}

/**
 * ベクトルを正規化
 * @param {Object} v - {x, y, z}
 * @returns {Object} 正規化されたベクトル
 */
export function normalizeVector(v) {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (mag === 0) return { x: 0, y: 0, z: 0 };

    return {
        x: v.x / mag,
        y: v.y / mag,
        z: v.z / mag
    };
}

/**
 * スクリーン座標からワールド座標へのレイを計算
 * @param {number} x - スクリーンX座標（-1 to 1）
 * @param {number} y - スクリーンY座標（-1 to 1）
 * @param {Object} camera - Three.jsカメラ
 * @returns {Object} レイの方向ベクトル
 */
export function screenToWorldRay(x, y, camera) {
    // Three.jsのRaycasterで実装される
    // ここでは基本的な数学のみ
    const vector = {
        x: x,
        y: y,
        z: 0.5
    };

    return vector;
}

/**
 * 2次元回転行列を適用
 * @param {number} x
 * @param {number} y
 * @param {number} angle - ラジアン
 * @returns {Object} {x, y}
 */
export function rotate2D(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos
    };
}

/**
 * 移動速度から減速を計算（ストッピング用）
 * @param {number} currentSpeed - 現在の速度
 * @param {number} friction - 摩擦係数
 * @param {number} deltaTime - 経過時間
 * @returns {number} 新しい速度
 */
export function applyFriction(currentSpeed, friction, deltaTime) {
    const speedReduction = friction * deltaTime;

    if (currentSpeed > speedReduction) {
        return currentSpeed - speedReduction;
    } else if (currentSpeed < -speedReduction) {
        return currentSpeed + speedReduction;
    } else {
        return 0;
    }
}

/**
 * カウンターストラフィングの計算
 * @param {Object} velocity - 現在の速度ベクトル {x, z}
 * @param {Object} input - 入力方向 {x, z}
 * @param {number} deceleration - 減速率
 * @param {number} deltaTime - 経過時間
 * @returns {Object} 新しい速度ベクトル
 */
export function applyCounterStrafing(velocity, input, deceleration, deltaTime) {
    const newVelocity = { ...velocity };

    // X軸のカウンターストラフィング
    if ((velocity.x > 0 && input.x < 0) || (velocity.x < 0 && input.x > 0)) {
        newVelocity.x = applyFriction(velocity.x, deceleration, deltaTime);
    }

    // Z軸のカウンターストラフィング
    if ((velocity.z > 0 && input.z < 0) || (velocity.z < 0 && input.z > 0)) {
        newVelocity.z = applyFriction(velocity.z, deceleration, deltaTime);
    }

    return newVelocity;
}

/**
 * パーセンタイルを計算
 * @param {Array<number>} values - 値の配列
 * @param {number} percentile - パーセンタイル（0-100）
 * @returns {number} パーセンタイル値
 */
export function calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
        return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * 平均値を計算
 * @param {Array<number>} values - 値の配列
 * @returns {number} 平均値
 */
export function average(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * 標準偏差を計算
 * @param {Array<number>} values - 値の配列
 * @returns {number} 標準偏差
 */
export function standardDeviation(values) {
    if (values.length === 0) return 0;

    const avg = average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
}

/**
 * 精度の円形誤差確率（CEP）を計算
 * @param {Array<Object>} points - {x, y}の配列
 * @param {Object} center - 中心点 {x, y}
 * @returns {number} CEP値
 */
export function calculateCEP(points, center) {
    if (points.length === 0) return 0;

    const distances = points.map(p => distance2D(p.x, p.y, center.x, center.y));
    distances.sort((a, b) => a - b);

    // 50パーセンタイル
    return calculatePercentile(distances, 50);
}

export default {
    calculateSensitivity,
    degToRad,
    radToDeg,
    clamp,
    lerp,
    distance2D,
    distance3D,
    randomInt,
    randomFloat,
    randomVectorInRange,
    randomChoice,
    easeOutQuad,
    easeInOutQuad,
    easeOutCubic,
    angleBetweenVectors,
    normalizeVector,
    screenToWorldRay,
    rotate2D,
    applyFriction,
    applyCounterStrafing,
    calculatePercentile,
    average,
    standardDeviation,
    calculateCEP
};
