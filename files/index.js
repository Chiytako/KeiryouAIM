/**
 * 武器システム - エクスポート
 */

export { WEAPONS, WEAPON_TYPES, WEAPON_CATEGORIES, DEFAULT_WEAPON, getWeaponData, getWeaponsByType, getAllWeaponIds } from './weaponData.js';
export { RecoilSystem } from './RecoilSystem.js';
export { WeaponManager } from './WeaponManager.js';

// デフォルトエクスポート
import WeaponManager from './WeaponManager.js';
export default WeaponManager;
