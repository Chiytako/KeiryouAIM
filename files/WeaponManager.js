/**
 * 武器マネージャー
 * 武器の管理、切り替え、射撃制御を担当
 */

import { WEAPONS, DEFAULT_WEAPON, getWeaponData, getAllWeaponIds } from './weaponData.js';
import RecoilSystem from './RecoilSystem.js';
import settings from '../core/settings.js';

export class WeaponManager {
    constructor() {
        // 現在の武器
        this.currentWeaponId = settings.get('weapon.selected') || DEFAULT_WEAPON;
        this.currentWeapon = WEAPONS[this.currentWeaponId];
        
        // リコイルシステム
        this.recoilSystem = new RecoilSystem();
        this.recoilSystem.setWeapon(this.currentWeapon);
        
        // 射撃状態
        this.lastShotTime = 0;
        this.isFiring = false;
        this.burstCount = 0;
        
        // 弾薬（オプション機能）
        this.currentAmmo = this.currentWeapon.magazineSize;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.ammoEnabled = settings.get('weapon.ammoEnabled') ?? false;
        
        // コールバック
        this.onWeaponChange = null;
        this.onAmmoChange = null;
        this.onReloadStart = null;
        this.onReloadEnd = null;
        
        // 設定変更リスナー
        this.setupSettingsListeners();
        
        console.log('WeaponManager initialized with:', this.currentWeapon.name);
    }
    
    /**
     * 設定変更リスナーをセットアップ
     */
    setupSettingsListeners() {
        // リコイル設定の変更を監視
        // 注: settings.jsにonChange機能があれば使用
    }
    
    /**
     * 武器を切り替え
     * @param {string} weaponId - 武器ID（大文字）
     * @returns {boolean} 切り替え成功したか
     */
    switchWeapon(weaponId) {
        const weapon = WEAPONS[weaponId.toUpperCase()];
        if (!weapon) {
            console.warn(`Unknown weapon: ${weaponId}`);
            return false;
        }
        
        // リロード中は切り替え不可
        if (this.isReloading) {
            return false;
        }
        
        this.currentWeaponId = weaponId.toUpperCase();
        this.currentWeapon = weapon;
        
        // 状態をリセット
        this.recoilSystem.setWeapon(weapon);
        this.currentAmmo = weapon.magazineSize;
        this.burstCount = 0;
        
        // 設定に保存
        settings.set('weapon.selected', this.currentWeaponId);
        
        // コールバック
        if (this.onWeaponChange) {
            this.onWeaponChange(this.currentWeapon);
        }
        
        console.log(`Switched to weapon: ${weapon.name}`);
        return true;
    }
    
    /**
     * 次の武器に切り替え
     */
    nextWeapon() {
        const weaponIds = getAllWeaponIds();
        const currentIndex = weaponIds.indexOf(this.currentWeaponId);
        const nextIndex = (currentIndex + 1) % weaponIds.length;
        this.switchWeapon(weaponIds[nextIndex]);
    }
    
    /**
     * 前の武器に切り替え
     */
    previousWeapon() {
        const weaponIds = getAllWeaponIds();
        const currentIndex = weaponIds.indexOf(this.currentWeaponId);
        const prevIndex = (currentIndex - 1 + weaponIds.length) % weaponIds.length;
        this.switchWeapon(weaponIds[prevIndex]);
    }
    
    /**
     * 射撃可能かチェック
     * @returns {boolean}
     */
    canShoot() {
        // リロード中は撃てない
        if (this.isReloading) {
            return false;
        }
        
        // 弾薬チェック（有効な場合）
        if (this.ammoEnabled && this.currentAmmo <= 0) {
            return false;
        }
        
        // 発射レートチェック
        const now = performance.now();
        const fireInterval = 1000 / this.currentWeapon.fireRate;
        
        return (now - this.lastShotTime) >= fireInterval;
    }
    
    /**
     * 射撃を実行
     * @returns {Object|null} 射撃結果 { recoil, spread, damage }
     */
    shoot() {
        if (!this.canShoot()) {
            return null;
        }
        
        this.lastShotTime = performance.now();
        this.isFiring = true;
        
        // 弾薬消費
        if (this.ammoEnabled) {
            this.currentAmmo--;
            if (this.onAmmoChange) {
                this.onAmmoChange(this.currentAmmo, this.currentWeapon.magazineSize);
            }
        }
        
        // リコイルを適用
        const recoil = this.recoilSystem.applyShot();
        
        // セミオート/バースト処理
        if (this.currentWeapon.fireMode === 'semi') {
            this.isFiring = false;
        } else if (this.currentWeapon.fireMode === 'burst') {
            this.burstCount++;
            if (this.burstCount >= 3) {
                this.isFiring = false;
                this.burstCount = 0;
            }
        }
        
        return {
            recoil,
            damage: this.currentWeapon.damage,
            accuracy: this.currentWeapon.accuracy
        };
    }
    
    /**
     * 射撃を停止
     */
    stopFiring() {
        this.isFiring = false;
        this.burstCount = 0;
    }
    
    /**
     * リロード開始
     */
    startReload() {
        if (this.isReloading) return;
        if (!this.ammoEnabled) return;
        if (this.currentAmmo >= this.currentWeapon.magazineSize) return;
        
        this.isReloading = true;
        this.reloadStartTime = performance.now();
        this.recoilSystem.reset();
        
        if (this.onReloadStart) {
            this.onReloadStart(this.currentWeapon.reloadTime);
        }
        
        console.log(`Reloading ${this.currentWeapon.name}...`);
    }
    
    /**
     * 毎フレーム更新
     * @param {number} deltaTime - 経過時間（秒）
     * @returns {Object} 更新結果 { recoilRecovery }
     */
    update(deltaTime) {
        // リロード処理
        if (this.isReloading) {
            const elapsed = (performance.now() - this.reloadStartTime) / 1000;
            if (elapsed >= this.currentWeapon.reloadTime) {
                this.isReloading = false;
                this.currentAmmo = this.currentWeapon.magazineSize;
                
                if (this.onReloadEnd) {
                    this.onReloadEnd();
                }
                if (this.onAmmoChange) {
                    this.onAmmoChange(this.currentAmmo, this.currentWeapon.magazineSize);
                }
                
                console.log(`Reload complete: ${this.currentWeapon.name}`);
            }
        }
        
        // リコイル回復を更新
        const recoilRecovery = this.recoilSystem.update(deltaTime);
        
        return {
            recoilRecovery
        };
    }
    
    /**
     * 発射レート（ミリ秒）を取得
     * @returns {number}
     */
    getFireRateMs() {
        return 1000 / this.currentWeapon.fireRate;
    }
    
    /**
     * 精度パラメータを取得
     * @param {string} state - 'standing' | 'moving' | 'jumping' | 'crouching'
     * @returns {number} 分散角度（度）
     */
    getAccuracy(state = 'standing') {
        return this.currentWeapon.accuracy[state] || this.currentWeapon.accuracy.standing;
    }
    
    /**
     * 現在の武器情報を取得
     * @returns {Object}
     */
    getCurrentWeapon() {
        return {
            ...this.currentWeapon,
            ammo: this.currentAmmo,
            isReloading: this.isReloading
        };
    }
    
    /**
     * 現在の武器IDを取得
     * @returns {string}
     */
    getCurrentWeaponId() {
        return this.currentWeaponId;
    }
    
    /**
     * リコイルを有効/無効にする
     * @param {boolean} enabled
     */
    setRecoilEnabled(enabled) {
        this.recoilSystem.setEnabled(enabled);
        settings.set('recoil.enabled', enabled);
    }
    
    /**
     * リコイルが有効かどうか
     * @returns {boolean}
     */
    isRecoilEnabled() {
        return this.recoilSystem.enabled;
    }
    
    /**
     * リコイル強度を設定
     * @param {number} intensity - 0.0 ~ 2.0
     */
    setRecoilIntensity(intensity) {
        this.recoilSystem.setIntensity(intensity);
        settings.set('recoil.intensity', intensity);
    }
    
    /**
     * 弾薬システムを有効/無効にする
     * @param {boolean} enabled
     */
    setAmmoEnabled(enabled) {
        this.ammoEnabled = enabled;
        settings.set('weapon.ammoEnabled', enabled);
        
        if (enabled) {
            this.currentAmmo = this.currentWeapon.magazineSize;
        }
    }
    
    /**
     * 状態をリセット
     */
    reset() {
        this.recoilSystem.reset();
        this.lastShotTime = 0;
        this.isFiring = false;
        this.burstCount = 0;
        this.currentAmmo = this.currentWeapon.magazineSize;
        this.isReloading = false;
    }
    
    /**
     * すべての武器リストを取得
     * @returns {Array}
     */
    getAllWeapons() {
        return Object.entries(WEAPONS).map(([id, weapon]) => ({
            id,
            ...weapon
        }));
    }
    
    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            weapon: this.currentWeapon.name,
            weaponId: this.currentWeaponId,
            fireRate: this.currentWeapon.fireRate,
            ammo: `${this.currentAmmo}/${this.currentWeapon.magazineSize}`,
            isReloading: this.isReloading,
            isFiring: this.isFiring,
            recoil: this.recoilSystem.getDebugInfo()
        };
    }
}

export default WeaponManager;
