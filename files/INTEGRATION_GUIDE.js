/**
 * 武器システム統合ガイド
 * 
 * このファイルは、武器システムを既存のコードに統合するためのガイドです。
 * 以下のコードを適切なファイルに追加してください。
 */

// ============================================
// 1. settings.js への追加
// ============================================
// DEFAULT_SETTINGS に以下を追加:

/*
weapon: {
    selected: 'VANDAL',
    ammoEnabled: false,
},
recoil: {
    enabled: true,
    intensity: 1.0,
    visualFeedback: true,
},
*/


// ============================================
// 2. game.js への変更
// ============================================

// --- インポートを追加 ---
// import WeaponManager from '../weapons/WeaponManager.js';

// --- init() 内に追加 ---
/*
// 武器マネージャーの初期化
this.weaponManager = new WeaponManager();

// 武器切り替えコールバック
this.weaponManager.onWeaponChange = (weapon) => {
    this.updateHUDWeapon(weapon);
};

this.weaponManager.onAmmoChange = (current, max) => {
    this.updateHUDAmmo(current, max);
};
*/

// --- update() 内に追加 ---
/*
// 武器マネージャー更新
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
*/


// ============================================
// 3. shooting.js への変更
// ============================================

// --- shoot() メソッドを修正 ---
/*
shoot(player, weaponManager) {
    // 武器マネージャーから射撃
    const shotResult = weaponManager.shoot();
    if (!shotResult) {
        return; // 射撃不可
    }
    
    player.recordShot();
    this.stats.totalShots++;
    
    // 発射音
    audioManager.play('SHOOT');
    
    // リコイルをカメラに適用
    if (shotResult.recoil) {
        player.cameraController.applyRecoil(
            shotResult.recoil.x,
            shotResult.recoil.y
        );
    }
    
    // 以降は既存のレイキャスト処理...
}
*/


// ============================================
// 4. camera.js への追加
// ============================================

// --- 新しいメソッドを追加 ---
/*
/**
 * リコイルを適用
 * @param {number} x - 横方向のリコイル（度）
 * @param {number} y - 縦方向のリコイル（度）
 */
/*
applyRecoil(x, y) {
    // 度をラジアンに変換
    const xRad = degToRad(x);
    const yRad = degToRad(y);
    
    // yaw（横）とpitch（縦）に適用
    this.yaw += xRad;
    this.pitch -= yRad;  // 上向きは負の方向
    
    // ピッチの制限
    this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
}

/**
 * リコイル回復を適用
 * @param {number} x - 横方向の回復量（度）
 * @param {number} y - 縦方向の回復量（度）
 */
/*
applyRecoilRecovery(x, y) {
    // 回復はリコイルの逆方向
    this.applyRecoil(-x, -y);
}
*/


// ============================================
// 5. main.js への追加（設定UI）
// ============================================

// --- 武器設定のUIイベントリスナー ---
/*
setupWeaponSettingsUI() {
    // 武器選択
    const weaponItems = document.querySelectorAll('.weapon-item');
    weaponItems.forEach(item => {
        item.addEventListener('click', () => {
            const weaponId = item.dataset.weaponId;
            if (this.game.weaponManager.switchWeapon(weaponId)) {
                // 選択状態を更新
                weaponItems.forEach(w => w.classList.remove('selected'));
                item.classList.add('selected');
                
                // 武器情報を更新
                this.updateWeaponInfoPanel(weaponId);
            }
        });
    });
    
    // リコイル有効/無効
    const recoilEnabled = document.getElementById('recoil-enabled');
    if (recoilEnabled) {
        recoilEnabled.addEventListener('change', (e) => {
            this.game.weaponManager.setRecoilEnabled(e.target.checked);
        });
    }
    
    // リコイル強度
    const recoilIntensity = document.getElementById('recoil-intensity');
    const recoilIntensityValue = document.getElementById('recoil-intensity-value');
    if (recoilIntensity) {
        recoilIntensity.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) / 100;
            this.game.weaponManager.setRecoilIntensity(value);
            if (recoilIntensityValue) {
                recoilIntensityValue.textContent = e.target.value + '%';
            }
        });
    }
    
    // 弾薬システム
    const ammoEnabled = document.getElementById('ammo-enabled');
    if (ammoEnabled) {
        ammoEnabled.addEventListener('change', (e) => {
            this.game.weaponManager.setAmmoEnabled(e.target.checked);
        });
    }
}

// 武器リストを動的に生成
generateWeaponList() {
    const categories = {
        rifles: ['VANDAL', 'PHANTOM', 'GUARDIAN'],
        smgs: ['SPECTRE', 'STINGER'],
        pistols: ['SHERIFF', 'GHOST', 'CLASSIC'],
        snipers: ['OPERATOR', 'MARSHAL']
    };
    
    Object.entries(categories).forEach(([category, weaponIds]) => {
        const container = document.getElementById(`weapon-list-${category}`);
        if (!container) return;
        
        container.innerHTML = '';
        weaponIds.forEach(id => {
            const weapon = WEAPONS[id];
            const item = document.createElement('div');
            item.className = 'weapon-item';
            item.dataset.weaponId = id;
            item.textContent = weapon.displayName.ja;
            
            if (id === this.game.weaponManager.getCurrentWeaponId()) {
                item.classList.add('selected');
            }
            
            container.appendChild(item);
        });
    });
}

// 武器情報パネルを更新
updateWeaponInfoPanel(weaponId) {
    const weapon = WEAPONS[weaponId];
    if (!weapon) return;
    
    document.getElementById('weapon-info-name').textContent = weapon.displayName.ja;
    document.getElementById('weapon-stat-firerate').textContent = weapon.fireRate + ' /s';
    document.getElementById('weapon-stat-damage').textContent = 
        `${weapon.damage.head} / ${weapon.damage.body} / ${weapon.damage.legs}`;
    document.getElementById('weapon-stat-magazine').textContent = weapon.magazineSize;
}
*/


// ============================================
// 6. index.html への追加
// ============================================

// HUDに武器表示を追加（game-hud内）:
/*
<div class="hud-weapon-display" id="weapon-hud">
    <div class="hud-weapon-name" id="hud-weapon-name">Vandal</div>
    <div class="hud-ammo-display" id="hud-ammo" style="display: none;">
        <span class="hud-ammo-current" id="hud-ammo-current">25</span>
        <span class="hud-ammo-separator">/</span>
        <span class="hud-ammo-max" id="hud-ammo-max">25</span>
    </div>
    <div class="hud-reloading hidden" id="hud-reloading">リロード中...</div>
</div>
*/


// ============================================
// 7. キーバインド追加（input.js）
// ============================================

// 武器切り替えキーを追加:
/*
// 数字キーで武器カテゴリ選択
'Digit1': 'selectRifle',
'Digit2': 'selectSMG',
'Digit3': 'selectPistol',
'Digit4': 'selectSniper',

// マウスホイールで武器切り替え
// wheelup: 'nextWeapon',
// wheeldown: 'prevWeapon',

// Rキーでリロード
'KeyR': 'reload',
*/


export default {};
