/**
 * Valorant Web Aim Trainer - Main Entry Point
 * アプリケーションのメインエントリーポイント
 */

import game from './core/game.js';
import settings from './core/settings.js';
import inputManager from './core/input.js';
import { TRAINING_MODES } from './utils/valorantConst.js';
import CrosshairRenderer from './ui/crosshair.js';

class App {
    constructor() {
        this.initialized = false;
        this.currentScreen = 'loading';

        // DOM要素
        this.elements = {
            loadingScreen: null,
            mainMenu: null,
            settingsMenu: null,
            pauseMenu: null,
            statsScreen: null,
            gameCanvas: null,
            hud: null,
            clickToStart: null,
            crosshairCanvas: null
        };

        // クロスヘアレンダラー
        this.crosshairRenderer = null;
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        console.log('=== Valorant Web Aim Trainer ===');
        console.log('Initializing application...');

        // DOM要素を取得
        this.cacheDOMElements();

        // イベントリスナーを設定
        this.setupEventListeners();

        // 設定を読み込み
        settings.load();
        console.log('Settings loaded');

        // ゲームを初期化
        game.init(this.elements.gameCanvas);

        // クロスヘアレンダラーを初期化
        if (this.elements.crosshairCanvas) {
            this.crosshairRenderer = new CrosshairRenderer(this.elements.crosshairCanvas);
            this.crosshairRenderer.draw();
            console.log('Crosshair renderer initialized');
        }

        // ローディング完了
        await this.waitForResources();

        this.initialized = true;

        // メインメニューを表示
        this.showMainMenu();

        console.log('Application initialized successfully');
    }

    /**
     * DOM要素をキャッシュ
     */
    cacheDOMElements() {
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.mainMenu = document.getElementById('main-menu');
        this.elements.settingsMenu = document.getElementById('settings-menu');
        this.elements.pauseMenu = document.getElementById('pause-menu');
        this.elements.statsScreen = document.getElementById('stats-screen');
        this.elements.gameCanvas = document.getElementById('game-canvas');
        this.elements.hud = document.getElementById('hud');
        this.elements.clickToStart = document.getElementById('click-to-start');
        this.elements.crosshairCanvas = document.getElementById('crosshair-canvas');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // メインメニュー - モード選択ボタン
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startGame(mode);
            });
        });

        // メインメニュー - 設定ボタン
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => this.showSettings());
        }

        // メインメニュー - 統計ボタン
        const statsButton = document.getElementById('stats-button');
        if (statsButton) {
            statsButton.addEventListener('click', () => this.showStats());
        }

        // 設定メニュー - 閉じるボタン
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => this.hideSettings());
        }

        // 設定メニュー - リセットボタン
        const settingsReset = document.getElementById('settings-reset');
        if (settingsReset) {
            settingsReset.addEventListener('click', () => {
                // confirmダイアログの前にPointer Lockを解除
                inputManager.exitPointerLock();

                if (confirm('設定をリセットしますか？')) {
                    settings.reset();
                    this.loadSettingsToUI();

                    // クロスヘアを再描画
                    if (this.crosshairRenderer) {
                        this.crosshairRenderer.draw();
                    }
                }
            });
        }

        // 設定メニュー - 各種入力
        this.setupSettingsInputs();

        // ポーズメニュー - 再開ボタン
        const resumeButton = document.getElementById('resume-button');
        if (resumeButton) {
            resumeButton.addEventListener('click', () => this.resumeGame());
        }

        // ポーズメニュー - リスタートボタン
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => this.restartGame());
        }

        // ポーズメニュー - 終了ボタン
        const quitButton = document.getElementById('quit-button');
        if (quitButton) {
            quitButton.addEventListener('click', () => this.quitGame());
        }

        // 統計画面 - 閉じるボタン
        const statsClose = document.getElementById('stats-close');
        if (statsClose) {
            statsClose.addEventListener('click', () => this.hideStats());
        }

        // クリックして開始
        if (this.elements.clickToStart) {
            this.elements.clickToStart.addEventListener('click', () => {
                this.elements.clickToStart.classList.add('hidden');
                inputManager.requestPointerLock();
            });
        }

        // Pointer Lockコールバック
        inputManager.setPointerLockCallbacks(
            () => this.onPointerLock(),
            () => this.onPointerUnlock()
        );

        // ESCキーでポーズ
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && game.isRunning && !game.isPaused) {
                this.pauseGame();
            }
        });
    }

    /**
     * 設定入力のイベントリスナーを設定
     */
    setupSettingsInputs() {
        // DPI
        const dpiInput = document.getElementById('dpi-input');
        if (dpiInput) {
            dpiInput.addEventListener('change', (e) => {
                settings.set('mouse.dpi', parseInt(e.target.value));
            });
        }

        // 感度
        const sensitivityInput = document.getElementById('sensitivity-input');
        if (sensitivityInput) {
            sensitivityInput.addEventListener('change', (e) => {
                settings.set('mouse.sensitivity', parseFloat(e.target.value));
            });
        }

        // Y軸反転
        const invertYInput = document.getElementById('invert-y');
        if (invertYInput) {
            invertYInput.addEventListener('change', (e) => {
                settings.set('mouse.invertY', e.target.checked);
            });
        }

        // グラフィックモード
        const graphicsModeSelect = document.getElementById('graphics-mode');
        if (graphicsModeSelect) {
            graphicsModeSelect.addEventListener('change', (e) => {
                // alertダイアログの前にPointer Lockを解除
                inputManager.exitPointerLock();

                settings.set('graphics.mode', e.target.value);
                alert('グラフィックモードの変更を適用するにはページをリロードしてください');
            });
        }

        // FOV
        const fovInput = document.getElementById('fov-input');
        if (fovInput) {
            fovInput.addEventListener('change', (e) => {
                settings.set('graphics.fov', parseInt(e.target.value));
            });
        }

        // FPS制限
        const fpsLimitSelect = document.getElementById('fps-limit');
        if (fpsLimitSelect) {
            fpsLimitSelect.addEventListener('change', (e) => {
                settings.set('graphics.fpsLimit', parseInt(e.target.value));
            });
        }

        // クロスヘアプリセット
        const crosshairPreset = document.getElementById('crosshair-preset');
        if (crosshairPreset) {
            crosshairPreset.addEventListener('change', (e) => {
                settings.applyCrosshairPreset(e.target.value);
                this.loadSettingsToUI();

                // クロスヘアを再描画
                if (this.crosshairRenderer) {
                    this.crosshairRenderer.draw();
                }
            });
        }

        // クロスヘアカラー
        const crosshairColor = document.getElementById('crosshair-color');
        if (crosshairColor) {
            crosshairColor.addEventListener('change', (e) => {
                settings.set('crosshair.color', e.target.value);

                // クロスヘアを再描画
                if (this.crosshairRenderer) {
                    this.crosshairRenderer.draw();
                }
            });
        }

        // クロスヘアサイズ
        const crosshairSize = document.getElementById('crosshair-size');
        const crosshairSizeValue = document.getElementById('crosshair-size-value');
        if (crosshairSize) {
            crosshairSize.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                settings.set('crosshair.size', value);
                if (crosshairSizeValue) {
                    crosshairSizeValue.textContent = value;
                }

                // クロスヘアを再描画
                if (this.crosshairRenderer) {
                    this.crosshairRenderer.draw();
                }
            });
        }

        // マスターボリューム
        const masterVolume = document.getElementById('master-volume');
        const masterVolumeValue = document.getElementById('master-volume-value');
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                settings.set('audio.masterVolume', value);
                if (masterVolumeValue) {
                    masterVolumeValue.textContent = Math.round(value * 100) + '%';
                }
            });
        }

        // SFXボリューム
        const sfxVolume = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                settings.set('audio.sfxVolume', value);
                if (sfxVolumeValue) {
                    sfxVolumeValue.textContent = Math.round(value * 100) + '%';
                }
            });
        }
    }

    /**
     * 設定をUIに反映
     */
    loadSettingsToUI() {
        // マウス設定
        const dpiInput = document.getElementById('dpi-input');
        if (dpiInput) dpiInput.value = settings.get('mouse.dpi');

        const sensitivityInput = document.getElementById('sensitivity-input');
        if (sensitivityInput) sensitivityInput.value = settings.get('mouse.sensitivity');

        const invertYInput = document.getElementById('invert-y');
        if (invertYInput) invertYInput.checked = settings.get('mouse.invertY');

        // グラフィック設定
        const graphicsModeSelect = document.getElementById('graphics-mode');
        if (graphicsModeSelect) graphicsModeSelect.value = settings.get('graphics.mode');

        const fovInput = document.getElementById('fov-input');
        if (fovInput) fovInput.value = settings.get('graphics.fov');

        const fpsLimitSelect = document.getElementById('fps-limit');
        if (fpsLimitSelect) fpsLimitSelect.value = settings.get('graphics.fpsLimit');

        // クロスヘア設定
        const crosshairColor = document.getElementById('crosshair-color');
        if (crosshairColor) crosshairColor.value = settings.get('crosshair.color');

        const crosshairSize = document.getElementById('crosshair-size');
        const crosshairSizeValue = document.getElementById('crosshair-size-value');
        if (crosshairSize) {
            crosshairSize.value = settings.get('crosshair.size');
            if (crosshairSizeValue) crosshairSizeValue.textContent = settings.get('crosshair.size');
        }

        // オーディオ設定
        const masterVolume = document.getElementById('master-volume');
        const masterVolumeValue = document.getElementById('master-volume-value');
        if (masterVolume) {
            masterVolume.value = settings.get('audio.masterVolume');
            if (masterVolumeValue) {
                masterVolumeValue.textContent = Math.round(settings.get('audio.masterVolume') * 100) + '%';
            }
        }

        const sfxVolume = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolume) {
            sfxVolume.value = settings.get('audio.sfxVolume');
            if (sfxVolumeValue) {
                sfxVolumeValue.textContent = Math.round(settings.get('audio.sfxVolume') * 100) + '%';
            }
        }
    }

    /**
     * リソースの読み込みを待機
     */
    async waitForResources() {
        // 簡易的な遅延（実際のリソース読み込みは今後実装）
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }

    /**
     * メインメニューを表示
     */
    showMainMenu() {
        this.hideAllScreens();
        this.elements.mainMenu.classList.remove('hidden');
        this.elements.mainMenu.style.display = ''; // displayスタイルをリセット
        this.elements.mainMenu.style.visibility = ''; // visibilityスタイルをリセット
        this.currentScreen = 'menu';
    }

    /**
     * 設定画面を表示
     */
    showSettings() {
        this.loadSettingsToUI();
        this.elements.settingsMenu.classList.remove('hidden');
    }

    /**
     * 設定画面を非表示
     */
    hideSettings() {
        this.elements.settingsMenu.classList.add('hidden');
    }

    /**
     * 統計画面を表示
     */
    showStats() {
        this.elements.statsScreen.classList.remove('hidden');
        // 統計データの読み込み（後で実装）
    }

    /**
     * 統計画面を非表示
     */
    hideStats() {
        this.elements.statsScreen.classList.add('hidden');
    }

    /**
     * すべての画面を非表示
     */
    hideAllScreens() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.mainMenu.classList.add('hidden');
        this.elements.settingsMenu.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.statsScreen.classList.add('hidden');
        this.elements.hud.classList.add('hidden');
    }

    /**
     * ゲームを開始
     * @param {string} mode - 練習モード
     */
    startGame(mode) {
        console.log('Starting game with mode:', mode);

        // 画面を切り替え
        this.hideAllScreens();

        // メインメニューを確実に非表示（z-indexの高いメニューを完全に隠す）
        this.elements.mainMenu.style.display = 'none';
        this.elements.mainMenu.style.visibility = 'hidden';

        this.elements.hud.classList.remove('hidden');
        this.elements.clickToStart.classList.remove('hidden');

        // モード名を表示
        const modeNameElement = document.getElementById('mode-name');
        if (modeNameElement && TRAINING_MODES[mode]) {
            modeNameElement.textContent = TRAINING_MODES[mode].name;
        }

        console.log('UI switched - HUD visible, menu hidden');

        // ゲームを開始
        game.start(mode);

        this.currentScreen = 'game';
    }

    /**
     * ゲームを一時停止
     */
    pauseGame() {
        // 先にPointer Lockを解除
        inputManager.exitPointerLock();

        // ゲームをポーズ
        game.togglePause();

        // ポーズメニューを表示
        this.elements.pauseMenu.classList.remove('hidden');

        console.log('Game paused, menu shown');
    }

    /**
     * ゲームを再開
     */
    resumeGame() {
        this.elements.pauseMenu.classList.add('hidden');
        game.togglePause();

        // 少し待ってからPointer Lockをリクエスト（ブラウザの制約対策）
        setTimeout(() => {
            inputManager.requestPointerLock();
        }, 100);
    }

    /**
     * ゲームを再スタート
     */
    restartGame() {
        this.elements.pauseMenu.classList.add('hidden');
        const currentMode = game.currentMode;
        game.stop();
        game.start(currentMode);

        // 「クリックして開始」オーバーレイを表示
        this.elements.clickToStart.classList.remove('hidden');
    }

    /**
     * ゲームを終了してメインメニューへ
     */
    quitGame() {
        game.stop();
        this.showMainMenu();
    }

    /**
     * Pointer Lockが有効になったとき
     */
    onPointerLock() {
        console.log('Pointer locked');
    }

    /**
     * Pointer Lockが無効になったとき
     */
    onPointerUnlock() {
        console.log('Pointer unlocked');

        // ポーズメニューが既に表示されている場合は何もしない
        if (!this.elements.pauseMenu.classList.contains('hidden')) {
            return;
        }

        // "Click to Start" オーバーレイが表示されている場合は何もしない
        // （ゲーム開始直後やリスタート直後）
        if (!this.elements.clickToStart.classList.contains('hidden')) {
            return;
        }

        // ゲームが実行中でポーズされていない場合のみ、自動的にポーズ
        if (game.isRunning && !game.isPaused && this.currentScreen === 'game') {
            // ゲーム中にロックが解除された場合は自動的にポーズ
            this.pauseGame();
        }
    }
}

// アプリケーションインスタンスを作成して初期化
const app = new App();

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// グローバルにエクスポート（デバッグ用）
window.app = app;
window.game = game;
window.settings = settings;
window.inputManager = inputManager;
