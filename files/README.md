# 武器・リコイルシステム

KeiryouAIM用の武器選択とリコイル（反動）システムです。

## 機能

### 武器システム
- **10種類の武器**: ライフル、SMG、ピストル、スナイパー
- 武器ごとの発射レート、ダメージ、精度
- オプションの弾薬システム

### リコイルシステム
- リアルなリコイルパターン（タクティカルシューター準拠）
- 設定でON/OFF可能
- 強度調整（0% ～ 200%）
- 自動リコイル回復

## 武器一覧

### ライフル
| 武器 | 発射レート | ヘッドダメージ | 特徴 |
|------|-----------|--------------|------|
| Vandal | 9.75/s | 160 | 高精度、縦反動中心 |
| Phantom | 11.0/s | 156 | 連射安定型 |
| Guardian | 4.75/s | 195 | 単発、高精度 |

### SMG
| 武器 | 発射レート | ヘッドダメージ | 特徴 |
|------|-----------|--------------|------|
| Spectre | 13.33/s | 78 | バランス型 |
| Stinger | 16.0/s | 67 | 高連射 |

### ピストル
| 武器 | 発射レート | ヘッドダメージ | 特徴 |
|------|-----------|--------------|------|
| Sheriff | 4.0/s | 159 | 高反動、高威力 |
| Ghost | 6.75/s | 105 | サプレッサー付き |
| Classic | 6.75/s | 78 | 標準ピストル |

### スナイパー
| 武器 | 発射レート | ヘッドダメージ | 特徴 |
|------|-----------|--------------|------|
| Operator | 0.6/s | 255 | ボルトアクション |
| Marshal | 1.5/s | 202 | 軽量スナイパー |

## ファイル構成

```
js/weapons/
├── index.js              # エクスポート
├── weaponData.js         # 武器データ定義
├── WeaponManager.js      # 武器管理クラス
├── RecoilSystem.js       # リコイルシステム
├── settingsDefaults.js   # 設定デフォルト値
└── INTEGRATION_GUIDE.js  # 統合ガイド

css/
└── weapon-settings.css   # UIスタイル

templates/
└── weapon-settings.html  # 設定UI HTML

assets/i18n/
└── weapon.json           # 翻訳データ
```

## 統合手順

### 1. settings.js に設定を追加

```javascript
// DEFAULT_SETTINGS に追加
weapon: {
    selected: 'VANDAL',
    ammoEnabled: false,
},
recoil: {
    enabled: true,
    intensity: 1.0,
    visualFeedback: true,
},
```

### 2. game.js に武器マネージャーを追加

```javascript
import WeaponManager from '../weapons/WeaponManager.js';

// init() 内
this.weaponManager = new WeaponManager();

// update() 内
if (this.weaponManager) {
    const weaponUpdate = this.weaponManager.update(deltaTime);
    // リコイル回復をカメラに適用
    if (weaponUpdate.recoilRecovery && this.player) {
        this.player.cameraController.applyRecoilRecovery(
            weaponUpdate.recoilRecovery.x,
            weaponUpdate.recoilRecovery.y
        );
    }
}
```

### 3. camera.js にリコイルメソッドを追加

```javascript
applyRecoil(x, y) {
    const xRad = degToRad(x);
    const yRad = degToRad(y);
    this.yaw += xRad;
    this.pitch -= yRad;
    this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
}

applyRecoilRecovery(x, y) {
    this.applyRecoil(-x, -y);
}
```

### 4. shooting.js を修正

```javascript
shoot(player, weaponManager) {
    const shotResult = weaponManager.shoot();
    if (!shotResult) return;
    
    // リコイル適用
    if (shotResult.recoil) {
        player.cameraController.applyRecoil(
            shotResult.recoil.x,
            shotResult.recoil.y
        );
    }
    // ... 既存処理
}
```

### 5. CSSとHTMLを追加

- `css/weapon-settings.css` をインクルード
- `templates/weapon-settings.html` の内容を設定モーダルに追加

### 6. i18n データをマージ

`assets/i18n/weapon.json` の内容を既存の翻訳ファイルにマージ

## 使用方法

### 武器切り替え

```javascript
// 特定の武器に切り替え
weaponManager.switchWeapon('PHANTOM');

// 次/前の武器
weaponManager.nextWeapon();
weaponManager.previousWeapon();
```

### リコイル制御

```javascript
// リコイルを無効化
weaponManager.setRecoilEnabled(false);

// リコイル強度を50%に
weaponManager.setRecoilIntensity(0.5);
```

### イベントコールバック

```javascript
weaponManager.onWeaponChange = (weapon) => {
    console.log('武器変更:', weapon.name);
};

weaponManager.onAmmoChange = (current, max) => {
    console.log(`弾薬: ${current}/${max}`);
};
```

## 設定オプション

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| `recoil.enabled` | リコイル有効/無効 | `true` |
| `recoil.intensity` | リコイル強度 (0.0-2.0) | `1.0` |
| `recoil.visualFeedback` | クロスヘア拡大 | `true` |
| `weapon.selected` | 選択中の武器 | `'VANDAL'` |
| `weapon.ammoEnabled` | 弾薬制限 | `false` |

## カスタマイズ

### 新しい武器を追加

`weaponData.js` の `WEAPONS` オブジェクトに追加:

```javascript
MY_WEAPON: {
    id: 'my_weapon',
    name: 'MyWeapon',
    type: WEAPON_TYPES.RIFLE,
    fireRate: 10.0,
    fireMode: 'auto',
    magazineSize: 30,
    damage: { head: 150, body: 35, legs: 30 },
    accuracy: { standing: 0.3, moving: 3.0, jumping: 10.0, crouching: 0.25 },
    recoil: {
        pattern: [[0, 0.7], [0.1, 0.8], ...],
        multiplier: 1.0,
        resetTime: 0.4,
        recoveryRate: 4.0,
        firstShotMultiplier: 0.3,
        firstShotCount: 2,
    },
},
```

### リコイルパターンの調整

`pattern` 配列の各要素 `[x, y]`:
- `x`: 横方向の反動（右が正）
- `y`: 縦方向の反動（上が正）

値は度数で、実際の反動は `multiplier` と `intensity` を乗算します。
