/**
 * KeiryouAIM - UIManager
 * 画面遷移、HUD更新、ポップアップ表示を一元管理するクラス
 */

export class UIManager {
    constructor() {
        // スクリーン要素
        this.screens = {
            loading: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            settings: document.getElementById('settings-screen'),
            skillProfile: document.getElementById('skill-profile-screen'),
            stats: document.getElementById('stats-screen'),
            hud: document.getElementById('hud'),
            pauseMenu: document.getElementById('pause-menu'),
            clickToStart: document.getElementById('click-to-start'),
            countdownOverlay: document.getElementById('countdown-overlay')
        };

        // HUD要素
        this.hudElements = {
            timer: document.getElementById('timer-value'),
            stageDisplay: document.getElementById('stage-display'),
            stageValue: document.getElementById('stage-value'),
            hits: document.getElementById('hits-value'),
            misses: document.getElementById('misses-value'),
            accuracy: document.getElementById('accuracy-value'),
            combo: document.getElementById('combo-value'),
            score: document.getElementById('score-value'),
            fps: document.getElementById('fps-value'),
            weaponName: document.getElementById('hud-weapon-name'),
            currentAmmo: document.getElementById('current-ammo'),
            maxAmmo: document.getElementById('max-ammo')
        };
    }

    /**
     * 指定したスクリーンを表示し、他を非表示にする
     * @param {string} screenName - screensのキー
     */
    showScreen(screenName) {
        // 全スクリーンを非表示
        Object.values(this.screens).forEach(el => {
            if (el) el.classList.add('hidden');
        });

        if (!screenName) return;

        // 指定スクリーンを表示
        const target = this.screens[screenName];
        if (target) {
            target.classList.remove('hidden');
        } else {
            console.warn(`UIManager: Screen '${screenName}' not found.`);
        }
    }

    /**
     * ポップアップスクリーン（設定など）を表示
     * メインのスクリーンは隠さない
     * @param {string} screenName 
     */
    openPopup(screenName) {
        const target = this.screens[screenName];
        if (target) {
            target.classList.remove('hidden');
        }
    }

    /**
     * ポップアップスクリーンを閉じる
     * @param {string} screenName 
     */
    closePopup(screenName) {
        const target = this.screens[screenName];
        if (target) {
            target.classList.add('hidden');
        }
    }

    /**
     * HUDの統計情報を更新
     * @param {Object} stats - { hits, misses, accuracy, combo, score }
     */
    updateStats(stats) {
        if (this.hudElements.hits) this.hudElements.hits.textContent = stats.hits;
        if (this.hudElements.misses) this.hudElements.misses.textContent = stats.misses;

        if (this.hudElements.accuracy) {
            const acc = (stats.accuracy * 100).toFixed(1);
            this.hudElements.accuracy.textContent = acc + '%';
        }

        if (this.hudElements.score) {
            this.hudElements.score.textContent = stats.score.toLocaleString();
        }

        if (this.hudElements.combo) {
            this.hudElements.combo.textContent = stats.combo;
            this._updateComboStyle(stats.combo);
        }
    }

    _updateComboStyle(combo) {
        const el = this.hudElements.combo;
        if (!el) return;

        if (combo >= 10) {
            el.style.color = '#FF4655';
            el.style.textShadow = '0 0 10px rgba(255, 70, 85, 0.5)';
        } else if (combo >= 5) {
            el.style.color = '#FFD700';
            el.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.5)';
        } else {
            el.style.color = '#E87B35';
            el.style.textShadow = 'none';
        }
    }

    /**
     * タイマー表示を更新
     * @param {number} seconds - 残り時間（秒）または経過時間
     * @param {boolean} isCountDown - カウントダウンかどうか
     */
    updateTimer(seconds, isCountDown = true) {
        if (!this.hudElements.timer) return;

        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        this.hudElements.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * 武器情報を更新
     * @param {Object} weaponInfo - { name, currentAmmo, magazineSize, isLowAmmo }
     */
    updateWeapon(weaponInfo) {
        if (this.hudElements.weaponName) {
            this.hudElements.weaponName.textContent = weaponInfo.name;
        }
        if (this.hudElements.maxAmmo) {
            this.hudElements.maxAmmo.textContent = weaponInfo.magazineSize;
        }
        if (this.hudElements.currentAmmo) {
            this.hudElements.currentAmmo.textContent = weaponInfo.currentAmmo;

            if (weaponInfo.isLowAmmo) {
                this.hudElements.currentAmmo.classList.add('low-ammo');
            } else {
                this.hudElements.currentAmmo.classList.remove('low-ammo');
            }
        }
    }

    /**
     * FPS表示を更新
     * @param {number} fps 
     */
    updateFPS(fps) {
        if (this.hudElements.fps) {
            this.hudElements.fps.textContent = fps;
        }
    }

    /**
     * コンボポップアップを表示
     * @param {number} combo 
     */
    showComboPopup(combo) {
        if (!this.screens.hud) return;

        // 既存削除
        const existing = document.getElementById('combo-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'combo-popup';
        popup.className = 'combo-display';
        popup.textContent = `${combo} COMBO!`;

        if (combo >= 10) {
            popup.style.color = '#FF4655';
            popup.style.fontSize = '3rem';
        } else if (combo >= 5) {
            popup.style.color = '#FFD700';
            popup.style.fontSize = '2.5rem';
        }

        this.screens.hud.appendChild(popup);

        // UIManagerはTimerSystemを持っていないため、setTimeoutを使う
        // または呼び出し元で管理するか、TimerSystemを注入するか。
        // ここでは単純なUI演出なのでsetTimeoutで許容するが、
        // 将来的にはAnimationSystemなどで管理すべき。
        setTimeout(() => {
            if (popup.parentNode) popup.parentNode.removeChild(popup);
        }, 1000);
    }
}
