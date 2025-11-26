/**
 * KeiryouAIM - Main Entry Point
 * アプリケーションのメインエントリーポイント
 */

import game from './core/game.js';
import settings from './core/settings.js';
import inputManager from './core/input.js';
import { TRAINING_MODES } from './utils/gameConst.js';
import CrosshairRenderer from './ui/crosshair.js';
import audioManager from './core/audio.js';
import statsManager from './core/stats.js';

class App {
    constructor() {
        this.initialized = false;
        this.currentScreen = 'loading';
        this.pendingMode = null;

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
            crosshairCanvas: null,
            countdownOverlay: null,
            countdownNumber: null
        };

        // クロスヘアレンダラー
        this.crosshairRenderer = null;
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        console.log('=== KeiryouAIM ===');
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
            game.setCrosshairRenderer(this.crosshairRenderer);
            console.log('Crosshair renderer initialized');
        }

        // ゲーム終了時のコールバック
        game.setOnGameEndCallback((stats) => {
            this.onGameEnd(stats);
        });

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
        this.elements.countdownOverlay = document.getElementById('countdown-overlay');
        this.elements.countdownNumber = document.getElementById('countdown-number');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // メインメニュー - モード選択ボタン
        const modeButtons = document.querySelectorAll('.mode-button');
        modeButtons.forEach(button => {
            button.addEventListener('mouseenter', () => audioManager.play('UI_HOVER'));
            button.addEventListener('click', (e) => {
                audioManager.play('UI_CLICK');
                const mode = e.currentTarget.dataset.mode;
                this.startGame(mode);
            });
        });

        // メインメニュー - 設定ボタン
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('mouseenter', () => audioManager.play('UI_HOVER'));
            settingsButton.addEventListener('click', () => {
                audioManager.play('UI_CLICK');
                this.showSettings();
            });
        }

        // メインメニュー - 統計ボタン
        const statsButton = document.getElementById('stats-button');
        if (statsButton) {
            statsButton.addEventListener('mouseenter', () => audioManager.play('UI_HOVER'));
            statsButton.addEventListener('click', () => {
                audioManager.play('UI_CLICK');
                this.showStats();
            });
        }

        // 設定メニュー - 閉じるボタン
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) {
            settingsClose.addEventListener('mouseenter', () => audioManager.play('UI_HOVER'));
            settingsClose.addEventListener('click', () => {
                audioManager.play('UI_CLICK');
                this.hideSettings();
            });
        }

        const settingsCloseIcon = document.getElementById('settings-close-icon');
        if (settingsCloseIcon) {
            settingsCloseIcon.addEventListener('mouseenter', () => audioManager.play('UI_HOVER'));
            settingsCloseIcon.addEventListener('click', () => {
                audioManager.play('UI_CLICK');
                this.hideSettings();
            });
        }

        // 設定メニュー - タブ切り替え
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // アクティブなタブを切り替え
                document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // コンテンツを切り替え
                const tabId = e.target.dataset.tab;
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabId}`).classList.add('active');

                audioManager.play('UI_CLICK');
            });
        });

        // キーバインドボタン
        const keybindButtons = document.querySelectorAll('.keybind-button');
        keybindButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleKeyRebind(e.target);
            });
        });

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

        // 統計画面 - データエクスポート
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.handleExportData());
        }

        // 統計画面 - データクリア
        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.handleClearData());
        }

        // クリックして開始
        if (this.elements.clickToStart) {
            this.elements.clickToStart.addEventListener('click', () => {
                // ユーザーインタラクションでオーディオを初期化
                audioManager.init();

                this.elements.clickToStart.classList.add('hidden');
                inputManager.pointerLockEnabled = true;
                inputManager.requestPointerLock();

                // カウントダウン開始
                if (this.pendingMode) {
                    this.startCountdown(this.pendingMode);
                }
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

        // 感度倍率
        const globalMultiplier = document.getElementById('global-multiplier');
        const globalMultiplierValue = document.getElementById('global-multiplier-value');
        if (globalMultiplier) {
            globalMultiplier.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                settings.set('mouse.globalMultiplier', value);
                if (globalMultiplierValue) {
                    globalMultiplierValue.textContent = value.toFixed(2);
                }
            });
        }

        // グラフィックモード
        const graphicsModeSelect = document.getElementById('graphics-mode');
        const graphicsModeLabel = document.getElementById('graphics-mode-label');

        // イースターエッグ：ラベルを5回クリックで線画モード解放
        if (graphicsModeLabel && graphicsModeSelect) {
            let clickCount = 0;
            graphicsModeLabel.addEventListener('click', (e) => {
                // 既に存在する場合は何もしない
                if (graphicsModeSelect.querySelector('option[value="WIREFRAME"]')) return;

                clickCount++;
                if (clickCount >= 5) {
                    // 線画モードを追加
                    const option = document.createElement('option');
                    option.value = 'WIREFRAME';
                    option.textContent = '線画版（最軽量）';
                    graphicsModeSelect.insertBefore(option, graphicsModeSelect.firstChild);

                    audioManager.play('UI_CLICK'); // 解放音
                    alert('隠しモード「線画版」が解放されました！');
                    clickCount = 0;
                }
            });
        }

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

        // 移動エラー設定
        const movementError = document.getElementById('movement-error');
        if (movementError) {
            movementError.addEventListener('change', (e) => {
                settings.set('gameplay.movementError', e.target.checked);
            });
        }

        // 動的クロスヘア設定
        const crosshairDynamic = document.getElementById('crosshair-dynamic');
        if (crosshairDynamic) {
            crosshairDynamic.addEventListener('change', (e) => {
                settings.set('crosshair.dynamicSpread', e.target.checked);
                if (this.crosshairRenderer) {
                    this.crosshairRenderer.draw();
                }
            });
        }

        // クロスヘア拡散倍率
        const crosshairMultiplier = document.getElementById('crosshair-multiplier');
        const crosshairMultiplierValue = document.getElementById('crosshair-multiplier-value');
        if (crosshairMultiplier) {
            crosshairMultiplier.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                settings.set('crosshair.spreadMultiplier', value);
                if (crosshairMultiplierValue) {
                    crosshairMultiplierValue.textContent = value.toFixed(1);
                }
                if (this.crosshairRenderer) {
                    this.crosshairRenderer.draw();
                }
            });
        }


        // ターゲット色設定
        const targetFillColor = document.getElementById('target-fill-color');
        if (targetFillColor) {
            targetFillColor.addEventListener('input', (e) => {
                console.log('Target fill color input:', e.target.value);
                settings.set('target.fillColor', e.target.value);
                if (game.targetManager) {
                    game.targetManager.updateAllTargetsColors();
                }
            });
        }

        const targetOutlineColor = document.getElementById('target-outline-color');
        if (targetOutlineColor) {
            targetOutlineColor.addEventListener('input', (e) => {
                console.log('Target outline color input:', e.target.value);
                settings.set('target.outlineColor', e.target.value);
                if (game.targetManager) {
                    game.targetManager.updateAllTargetsColors();
                }
            });
        }
    }

    /**
     * キーバインドの再設定処理
     * @param {HTMLElement} button - クリックされたボタン
     */
    handleKeyRebind(button) {
        const action = button.dataset.action;
        const originalText = button.textContent;

        // 待機状態にする
        button.textContent = 'Press Key...';
        button.classList.add('waiting');
        audioManager.play('UI_CLICK');

        // キー入力ハンドラ
        const handleKeyDown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const code = e.code;

            // Escapeならキャンセル
            if (code === 'Escape') {
                button.textContent = originalText;
                button.classList.remove('waiting');
                document.removeEventListener('keydown', handleKeyDown);
                return;
            }

            // 設定を更新
            settings.set(`keybindings.${action}`, code);
            button.textContent = code.replace('Key', '');
            button.classList.remove('waiting');
            audioManager.play('UI_CLICK'); // 決定音（仮）

            document.removeEventListener('keydown', handleKeyDown);
        };

        // イベントリスナーを一時的に追加
        document.addEventListener('keydown', handleKeyDown);
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

        const globalMultiplier = document.getElementById('global-multiplier');
        const globalMultiplierValue = document.getElementById('global-multiplier-value');
        if (globalMultiplier) {
            const val = settings.get('mouse.globalMultiplier') || 1.0;
            globalMultiplier.value = val;
            if (globalMultiplierValue) globalMultiplierValue.textContent = val.toFixed(2);
        }

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

        // 新しい設定項目の反映
        const movementError = document.getElementById('movement-error');
        if (movementError) movementError.checked = settings.get('gameplay.movementError');

        const crosshairDynamic = document.getElementById('crosshair-dynamic');
        if (crosshairDynamic) crosshairDynamic.checked = settings.get('crosshair.dynamicSpread');

        const crosshairMultiplier = document.getElementById('crosshair-multiplier');
        const crosshairMultiplierValue = document.getElementById('crosshair-multiplier-value');
        if (crosshairMultiplier) {
            const val = settings.get('crosshair.spreadMultiplier') || 1.0;
            crosshairMultiplier.value = val;
            if (crosshairMultiplierValue) crosshairMultiplierValue.textContent = val.toFixed(1);
        }

        // ターゲット設定の反映
        const targetFillColor = document.getElementById('target-fill-color');
        if (targetFillColor) targetFillColor.value = settings.get('target.fillColor') || '#E87B35';

        const targetOutlineColor = document.getElementById('target-outline-color');
        if (targetOutlineColor) targetOutlineColor.value = settings.get('target.outlineColor') || '#00FFCC';

        // キーバインドの反映
        const keybindButtons = document.querySelectorAll('.keybind-button');
        keybindButtons.forEach(button => {
            const action = button.dataset.action;
            const key = settings.get(`keybindings.${action}`);
            if (key) {
                button.textContent = key.replace('Key', '');
            }
        });
    }

    /**
     * リソースの読み込みを待機
     */
    async waitForResources() {
        // オーディオのロード待機
        await audioManager.loadSounds();

        // 簡易的な遅延（他リソース用）
        return new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }

    /**
     * メインメニューを表示
     */
    showMainMenu() {
        this.hideAllScreens();
        this.elements.mainMenu.classList.remove('hidden');
        this.elements.mainMenu.style.display = ''; // displayスタイルをリセット
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
    showStats(sessionStats = null) {
        this.elements.statsScreen.classList.remove('hidden');

        // 統計データの読み込みと表示
        // セッションデータが渡された場合はそれを優先表示、なければ総合データ
        const displayStats = sessionStats || statsManager.getTotalStats();

        // 総合データ表示（常に総合を表示するか、セッションのみを表示するかは要件次第だが、
        // ここでは画面上のラベルが「総ヒット数」とかなので、総合データを表示しつつ、
        // グラフは直近のセッションを表示するのが一般的）

        // 画面の数値は総合データを表示（ただし、セッションデータがある場合はそちらを優先して表示するように変更）
        const statsToShow = sessionStats || statsManager.getTotalStats();

        document.getElementById('total-hits').textContent = statsToShow.hits || statsToShow.totalHits || 0;

        // 精度
        const accuracy = statsToShow.accuracy !== undefined ? statsToShow.accuracy :
            (statsToShow.totalShots > 0 ? statsToShow.totalHits / statsToShow.totalShots : 0);
        document.getElementById('total-accuracy').textContent = (accuracy * 100).toFixed(1) + '%';

        // 平均反応時間
        const avgReaction = statsToShow.avgReactionTime !== undefined ? statsToShow.avgReactionTime :
            (statsToShow.avgReactionTime || 0);
        document.getElementById('avg-reaction').textContent = avgReaction.toFixed(0) + 'ms';

        // ヘッドショット率
        let hsRate = 0;
        if (statsToShow.headshots !== undefined && statsToShow.hits > 0) {
            hsRate = statsToShow.headshots / statsToShow.hits;
        } else if (statsToShow.totalHeadshots !== undefined && statsToShow.totalHits > 0) {
            hsRate = statsToShow.totalHeadshots / statsToShow.totalHits;
        }
        document.getElementById('headshot-rate').textContent = (hsRate * 100).toFixed(1) + '%';

        // グラフ描画用データ
        // セッションが渡されていない場合は、最後のセッションを使用
        let targetSession = sessionStats;
        if (!targetSession && statsManager.data.sessions.length > 0) {
            targetSession = statsManager.data.sessions[statsManager.data.sessions.length - 1];
        }

        if (targetSession) {
            this.drawAccuracyGraph(targetSession);
            this.drawHeatmap(targetSession);
        }
    }

    /**
     * 精度の推移グラフを描画
     * @param {Object} session - セッションデータ
     */
    /**
     * 精度の推移グラフを描画
     * @param {Object} session - セッションデータ
     */
    drawAccuracyGraph(session) {
        const canvas = document.getElementById('accuracy-graph');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        // クリア
        ctx.clearRect(0, 0, width, height);

        // 背景（少し明るくして区別）
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        // グリッドと軸ラベル
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '10px "Roboto Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const y = height - (height * i / gridLines);

            // グリッド線
            ctx.beginPath();
            ctx.moveTo(30, y); // ラベル用スペース確保
            ctx.lineTo(width, y);
            ctx.stroke();

            // ラベル (0%, 25%, 50%, 75%, 100%)
            if (i < gridLines) { // 100%は被る可能性があるので調整が必要かもだが一旦描画
                const label = Math.round((i / gridLines) * 100) + '%';
                ctx.fillText(label, 25, y);
            }
        }
        // 100%ラベル
        ctx.fillText('100%', 25, 10);

        if (!session.shotsHistory || session.shotsHistory.length === 0) {
            ctx.fillStyle = '#95a5a6';
            ctx.font = '14px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NO DATA', width / 2 + 15, height / 2);
            return;
        }

        // グラフ描画エリア（パディング考慮）
        const graphX = 30;
        const graphW = width - 30;
        const graphH = height;

        const history = session.shotsHistory;

        // データポイントの計算
        const points = history.map((shot, index) => {
            const x = graphX + (index / (history.length - 1)) * graphW;
            const y = graphH - (shot.currentAccuracy * graphH);
            return { x, y, hit: shot.hit };
        });

        if (points.length < 2) return;

        // グラデーション領域の描画
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 204, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0.0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, height);
        ctx.lineTo(points[0].x, points[0].y);

        // ベジェ曲線で滑らかに
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
        }
        // 最後の点
        const lastP = points[points.length - 1];
        ctx.lineTo(lastP.x, lastP.y);
        ctx.lineTo(lastP.x, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // ライン描画（光彩付き）
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
        }
        ctx.lineTo(lastP.x, lastP.y);
        ctx.stroke();

        // シャドウリセット
        ctx.shadowBlur = 0;

        // 最後のポイントにドットを描画
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lastP.x, lastP.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * ヒートマップを描画（ターゲット相対位置）
     * @param {Object} session - セッションデータ
     */
    /**
     * ヒートマップを描画（ターゲット相対位置）
     * @param {Object} session - セッションデータ
     */
    drawHeatmap(session) {
        const canvas = document.getElementById('heatmap-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        // クリア
        ctx.clearRect(0, 0, width, height);

        // 背景（少し明るくして区別）
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        // レーダー風背景
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;

        // 同心円
        for (let r = 1; r <= 4; r++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (Math.min(width, height) / 2) * (r / 4) * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 十字線
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // ターゲットシルエット描画
        // スケール（キャンバスサイズに合わせて調整）
        const targetHeight = 2.0;
        const scale = (height * 0.6) / targetHeight;
        const centerOffset = 1.3 * scale;

        // ボディ（カプセル）
        const bodyWidth = 0.6 * scale;
        const bodyHeight = 1.0 * scale;
        const bodyRadius = bodyWidth / 2;

        // 座標変換関数
        const drawY = (worldY) => centerY - (worldY - 1.3) * scale;

        // ボディ
        ctx.fillStyle = 'rgba(52, 73, 94, 0.3)';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;

        // ホログラム風エフェクト（走査線）
        const bodyTop = 1.4;
        const bodyBottom = 0.4;
        const bX = centerX - (bodyWidth / 2);
        const bY = drawY(bodyTop);
        const bH = (bodyTop - bodyBottom) * scale;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bX, bY, bodyWidth, bH, 10);
        ctx.clip(); // ボディ領域でクリップ

        // ボディ塗りつぶし
        ctx.fill();

        // 走査線
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
        ctx.lineWidth = 1;
        for (let y = bY; y < bY + bH; y += 5) {
            ctx.beginPath();
            ctx.moveTo(bX, y);
            ctx.lineTo(bX + bodyWidth, y);
            ctx.stroke();
        }
        ctx.restore();

        // ボディ枠線
        ctx.strokeStyle = 'rgba(52, 73, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bodyWidth, bH, 10);
        ctx.stroke();

        // ヘッド
        const headRadius = 0.25 * scale;
        const hY = drawY(1.6);

        ctx.beginPath();
        ctx.arc(centerX, hY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.stroke();

        if (!session.hitPositions || session.hitPositions.length === 0) {
            ctx.fillStyle = '#95a5a6';
            ctx.font = '14px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NO DATA', width / 2, height / 2);
            return;
        }

        // ヒット位置描画
        session.hitPositions.forEach(pos => {
            if (!pos.relative) return;

            const x = centerX + pos.relative.x * scale;
            const y = centerY - pos.relative.y * scale;

            ctx.beginPath();
            if (pos.isHeadshot) {
                // ヘッドショット（黄色グロー）
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#f1c40f';
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (pos.isMiss) {
                // ミス（赤色グロー×印）
                ctx.shadowColor = '#e74c3c';
                ctx.shadowBlur = 5;
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 2;
                const size = 4;
                ctx.moveTo(x - size, y - size);
                ctx.lineTo(x + size, y + size);
                ctx.moveTo(x + size, y - size);
                ctx.lineTo(x - size, y + size);
                ctx.stroke();
            } else {
                // 通常ヒット（シアングロー）
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#00ffcc';
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0; // リセット
        });
    }

    /**
     * 統計画面を非表示
     */
    hideStats() {
        this.elements.statsScreen.classList.add('hidden');
        // メインメニューに戻る
        this.showMainMenu();
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
        this.elements.clickToStart.classList.add('hidden');
    }

    /**
     * ゲームを開始
     * @param {string} mode - 練習モード
     */
    startGame(mode) {
        console.log('Starting game with mode:', mode);

        // Pointer Lockを一時的に無効化（Click to Startで有効化）
        inputManager.pointerLockEnabled = false;

        // 画面を切り替え
        this.hideAllScreens();

        // メインメニューを確実に非表示
        this.elements.mainMenu.style.display = 'none';

        this.elements.hud.classList.remove('hidden');

        // モードを保存してクリック待機
        this.pendingMode = mode;
        this.elements.clickToStart.classList.remove('hidden');
    }

    /**
     * カウントダウンを開始してゲームへ
     */
    startCountdown(mode) {
        this.elements.countdownOverlay.classList.remove('hidden');

        // カウントダウン中も背景（ステージ）が見えるように、一度レンダリングを行う
        // ゲームループがまだ回っていないため、手動で描画
        game.render();

        let count = 3;

        const updateCount = () => {
            if (count > 0) {
                this.elements.countdownNumber.textContent = count;
                audioManager.play('COUNTDOWN');
                count--;
                setTimeout(updateCount, 1000);
            } else {
                this.elements.countdownNumber.textContent = 'GO!';
                audioManager.play('TIMER_END'); // またはGO用の音

                setTimeout(() => {
                    this.elements.countdownOverlay.classList.add('hidden');

                    // モード名を表示
                    const modeNameElement = document.getElementById('mode-name');
                    if (modeNameElement && TRAINING_MODES[mode]) {
                        modeNameElement.textContent = TRAINING_MODES[mode].name;
                    }

                    console.log('UI switched - HUD visible, menu hidden');

                    // 入力状態をリセット
                    inputManager.reset();

                    // セッション開始を記録
                    statsManager.startSession(mode);

                    // ゲームを開始
                    game.start(mode);

                    this.currentScreen = 'game';
                }, 500);
            }
        };

        updateCount();
    }

    /**
     * ゲームを一時停止
     */
    pauseGame() {
        // 先にPointer Lockを解除・無効化
        inputManager.pointerLockEnabled = false;
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
            inputManager.pointerLockEnabled = true;
            inputManager.requestPointerLock();
        }, 100);
    }

    /**
     * ゲームを再スタート
     */
    restartGame() {
        this.elements.pauseMenu.classList.add('hidden');
        const currentMode = game.currentMode;
        // 統計画面を表示せずに停止
        game.stop(false);

        // 再スタートフロー（クリック待機 -> カウントダウン -> 開始）
        this.pendingMode = currentMode;
        this.elements.clickToStart.classList.remove('hidden');
    }

    /**
     * ゲームを終了してメインメニューへ
     */
    quitGame() {
        inputManager.pointerLockEnabled = false;
        inputManager.exitPointerLock();
        game.stop();
        this.showMainMenu();
    }

    /**
     * ゲーム終了時の処理
     * @param {Object} stats - セッション統計
     */
    onGameEnd(stats) {
        console.log('Game ended, showing stats');

        // Pointer Lockを解除
        inputManager.pointerLockEnabled = false;
        inputManager.exitPointerLock();

        // 画面を切り替え
        this.hideAllScreens();
        this.showStats(stats);

        this.currentScreen = 'stats';
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

        // ゲームが実行中でポーズされていない場合のみ、自動的にポーズ
        if (game.isRunning && !game.isPaused && this.currentScreen === 'game') {
            // ゲーム中にロックが解除された場合は自動的にポーズ
            this.pauseGame();
        }
    }

    /**
     * データをエクスポート
     */
    handleExportData() {
        const data = statsManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `keiryou_aim_stats_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        audioManager.play('UI_CLICK');
    }

    /**
     * データをクリア
     */
    handleClearData() {
        if (confirm('本当にすべての統計データを削除しますか？\nこの操作は取り消せません。')) {
            statsManager.clearData();

            // UI更新
            this.showStats(); // 現在の画面をリフレッシュ

            audioManager.play('UI_CLICK');
            alert('データを削除しました。');
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
