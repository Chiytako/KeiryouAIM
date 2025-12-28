/**
 * ゲームループとシーン管理
 * Three.jsを使用した3Dシーンの管理とゲームループ
 */

import * as THREE from 'three';
import { PHYSICS_CONSTANTS, GRAPHICS_MODES } from '../utils/gameConst.js';

// Managers
import { LoopManager } from './LoopManager.js';
import { TimerSystem } from './TimerSystem.js';
import { UIManager } from '../ui/UIManager.js';

import settings from './settings.js';
import inputManager from './input.js';
import Player from '../player/player.js';
import ShootingSystem from '../player/shooting.js';
import WeaponManager from '../weapons/WeaponManager.js';
import TargetSpawner from '../targets/spawner.js';
import audioManager from './audio.js';
import statsManager from './stats.js';
import i18n from '../utils/i18n.js';

class Game {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;

        // ゲーム状態
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = null;

        // Managers
        this.loopManager = new LoopManager();
        this.timerSystem = new TimerSystem();
        this.uiManager = new UIManager();

        // Loop Manager Setup
        this.loopManager.setUpdateCallback((deltaTime) => this.update(deltaTime));
        this.loopManager.setRenderCallback(() => this.render());

        // シーンオブジェクト
        this.objects = {
            ground: null,
            walls: [],
            targets: [],
            lights: []
        };

        // モジュール
        this.player = null;
        this.targetManager = null;
        this.dataCollector = null;

        // グラフィックモード
        this.graphicsMode = null;

        // コールバック
        this.onGameEndCallback = null;

        // セッション管理
        this.sessionDuration = 60; // 秒
        this.sessionTimeRemaining = 0;
    }

    /**
     * ゲームを初期化
     * @param {HTMLCanvasElement} canvas - ゲームキャンバス
     */
    init(canvas) {
        this.canvas = canvas;

        console.log('Initializing game...');

        // グラフィックモード設定を取得
        this.graphicsMode = settings.getGraphicsMode();
        console.log('Graphics Mode:', this.graphicsMode.mode);

        // レンダラーの初期化
        this.initRenderer();

        // シーンの初期化
        this.initScene();

        // カメラの初期化
        this.initCamera();

        // ライティングの初期化
        this.initLighting();

        // 環境の初期化
        this.initEnvironment();

        // 入力マネージャーの初期化
        inputManager.init(this.canvas);

        // プレイヤーの初期化
        this.player = new Player(this.camera);
        console.log('Player initialized');

        // 射撃システムの初期化
        this.shootingSystem = new ShootingSystem(this.camera, this.scene);
        this.shootingSystem.setOnHitCallback((hitInfo, hitPoint, relativePos) => {
            this.onTargetHit(hitInfo, hitPoint, relativePos);
        });
        this.shootingSystem.setOnMissCallback((hitPoint, relativePos) => {
            this.onMiss(hitPoint, relativePos);
        });
        console.log('Shooting system initialized');

        // ターゲットマネージャーの初期化
        this.targetManager = new TargetSpawner(this.scene, this.graphicsMode);
        this.targetManager.setOnSpawnCallback((mode, data) => {
            if (mode === 'PREFIRE') {
                // プリエイムモードではスポーン時にプレイヤー位置をリセット
                if (this.player) {
                    this.player.reset();
                    // 強制的に(0,0,-5)に戻す（壁に近づける）
                    this.player.setPosition(0, 0, -5);
                    // 視点もリセットしたい場合はここで
                    // this.player.cameraController.setRotation(0, 0); 
                }
            } else if (mode === 'PRACTICAL') {
                // 実践モード：シナリオごとの開始位置に移動
                if (this.player && data.playerStart) {
                    this.player.reset(); // 速度などをリセット
                    this.player.setPosition(
                        data.playerStart.x,
                        data.playerStart.y !== undefined ? data.playerStart.y : 0,
                        data.playerStart.z
                    );

                    // 視点のリセットも行う（オプション）
                    // this.player.cameraController.setRotation(0, 0);
                }
            }
        });
        console.log('Target manager initialized');

        // ウィンドウリサイズイベント
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // オーディオマネージャーの初期化（ユーザー操作が必要なため、ここでの呼び出しは準備のみ）
        // 実際の再生開始はクリックイベント等で行われる
        console.log('Audio system ready');

        // 武器マネージャーの初期化
        this.weaponManager = new WeaponManager();
        this.shootingSystem.setWeaponManager(this.weaponManager);

        // 武器切り替えコールバック
        this.weaponManager.onWeaponChange = (weapon) => {
            // HUD更新などの処理（後で実装）
            console.log('Weapon changed:', weapon.name);

        };

        this.weaponManager.onAmmoChange = (current, max) => {
            // HUD更新などの処理（後で実装）
        };
        console.log('Weapon manager initialized');

        console.log('Game initialized successfully');
    }

    /**
     * レンダラーを初期化
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.graphicsMode.antialiasing === 'MSAA',
            powerPreference: 'high-performance',
            precision: 'highp'
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2) * settings.get('graphics.resolution')
        );

        // シャドウマップ設定
        if (this.graphicsMode.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // 背景色
        if (this.graphicsMode.mode === 'WIREFRAME') {
            this.renderer.setClearColor(0x000000, 1);
        } else {
            this.renderer.setClearColor(0xF5F1EC, 1); // Claude風のベージュ
        }

        console.log('Renderer initialized');
    }

    /**
     * シーンを初期化
     */
    initScene() {
        this.scene = new THREE.Scene();

        // フォグ（線画版以外）
        if (this.graphicsMode.mode !== 'WIREFRAME') {
            this.scene.fog = new THREE.Fog(0xF5F1EC, 10, 100); // Claude風のベージュ
        }

        console.log('Scene initialized');
    }

    /**
     * カメラを初期化
     */
    initCamera() {
        const fov = settings.get('graphics.fov');
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, PHYSICS_CONSTANTS.CAMERA_HEIGHT, 0);

        console.log('Camera initialized');
    }

    /**
     * ライティングを初期化
     */
    initLighting() {
        if (this.graphicsMode.mode === 'WIREFRAME') {
            // 線画版はライティング不要
            return;
        }

        // アンビエントライト
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        this.objects.lights.push(ambientLight);

        // ディレクショナルライト
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 5);

        if (this.graphicsMode.shadows) {
            dirLight.castShadow = true;
            dirLight.shadow.mapSize.width = this.graphicsMode.shadowMapSize;
            dirLight.shadow.mapSize.height = this.graphicsMode.shadowMapSize;
            dirLight.shadow.camera.near = 0.5;
            dirLight.shadow.camera.far = 500;
            dirLight.shadow.camera.left = -50;
            dirLight.shadow.camera.right = 50;
            dirLight.shadow.camera.top = 50;
            dirLight.shadow.camera.bottom = -50;
        }

        this.scene.add(dirLight);
        this.objects.lights.push(dirLight);

        console.log('Lighting initialized');
    }

    /**
     * 環境（地面、壁）を初期化
     */
    initEnvironment() {
        // 地面
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        let groundMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            groundMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            groundMaterial = new THREE.MeshLambertMaterial({
                color: 0xE8DED2 // Claude風のソフトベージュ
            });
        } else {
            // RICH
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0xE8DED2, // Claude風のソフトベージュ
                roughness: 0.8,
                metalness: 0.2
            });
        }

        this.objects.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.objects.ground.rotation.x = -Math.PI / 2;
        this.objects.ground.position.y = 0;
        this.objects.ground.userData.isGround = true;

        if (this.graphicsMode.shadows) {
            this.objects.ground.receiveShadow = true;
        }

        this.scene.add(this.objects.ground);

        // グリッド（線画版のみ）
        if (this.graphicsMode.mode === 'WIREFRAME') {
            const gridHelper = new THREE.GridHelper(100, 100, 0x00ffcc, 0x003333);
            this.scene.add(gridHelper);
        }

        // 壁（簡易版）
        this.createWalls();

        console.log('Environment initialized');
    }

    /**
     * 壁を作成
     */
    createWalls() {
        const wallHeight = 3;
        const wallThickness = 0.2;
        const mapSize = 80;

        let wallMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            wallMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            wallMaterial = new THREE.MeshLambertMaterial({
                color: 0xD4C4B0 // Claude風のベージュブラウン
            });
        } else {
            wallMaterial = new THREE.MeshStandardMaterial({
                color: 0xD4C4B0, // Claude風のベージュブラウン
                roughness: 0.7,
                metalness: 0.1
            });
        }

        // 4つの壁
        const wallConfigs = [
            { x: 0, z: -mapSize / 2, rotY: 0, width: mapSize },  // 北
            { x: 0, z: mapSize / 2, rotY: 0, width: mapSize },   // 南
            { x: -mapSize / 2, z: 0, rotY: Math.PI / 2, width: mapSize }, // 西
            { x: mapSize / 2, z: 0, rotY: Math.PI / 2, width: mapSize }   // 東
        ];

        wallConfigs.forEach(config => {
            const wallGeometry = new THREE.BoxGeometry(config.width, wallHeight, wallThickness);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);

            wall.position.set(config.x, wallHeight / 2, config.z);
            wall.rotation.y = config.rotY;

            if (this.graphicsMode.shadows) {
                wall.castShadow = true;
                wall.receiveShadow = true;
            }

            this.scene.add(wall);
            this.objects.walls.push(wall);
        });
    }

    /**
     * ゲームを開始
     * @param {string} mode - 練習モード
     */
    start(mode) {
        console.log('Starting game with mode:', mode);

        this.currentMode = mode;
        this.isRunning = true;
        this.isPaused = false;

        // Timer System Reset
        this.timerSystem.clearAll();

        // ターゲットマネージャーを開始
        if (this.targetManager) {
            this.targetManager.startMode(mode);
        }

        // 射撃統計をリセット
        if (this.shootingSystem) {
            this.shootingSystem.resetStats();
        }

        // セッションタイマー設定
        let duration = 60;
        if (mode === 'FREEPLAY') {
            duration = Infinity;
        }

        this.sessionDuration = duration;
        this.sessionTimeRemaining = duration;

        if (duration !== Infinity) {
            // セッション終了タイマー (TimerSystemで管理した方が正確だが、残り時間表示のためTimeRemainingを使う)
            // ここではカウントダウンロジックは update() 内で TimerSystem ではなく直接扱うか、
            // TimerSystemのintervalを使うか。
            // 既存ロジックに合わせて update() で減算しつつ、TimerSystemで終了イベントを発火する手もあるが、
            // 残り時間表示が必要なので update() での減算を維持するか、LoopManagerのelapsedTimeを使う。
            // ここではシンプルに update() での減算ロジックを維持しつつ LoopManagerを使う。
        }

        // Loop Manager Start (Must be called AFTER sessionTimeRemaining is set to prevent instant stop)
        this.loopManager.start();
    }

    /**
     * ゲームを停止
     * @param {boolean} triggerCallback - 終了コールバックを呼び出すかどうか
     */
    stop(triggerCallback = true) {
        console.log('Stopping game');

        this.loopManager.stop();
        this.timerSystem.clearAll();

        // ターゲットマネージャーを停止
        if (this.targetManager) {
            this.targetManager.stopMode();
        }

        // 統計セッション終了
        const sessionStats = statsManager.endSession();
        console.log('Session ended:', sessionStats);

        // コールバック呼び出し
        if (this.onGameEndCallback && triggerCallback) {
            this.onGameEndCallback(sessionStats);
        }
    }

    /**
     * ゲームを一時停止/再開
     */
    togglePause() {
        this.loopManager.togglePause();
        console.log('Game paused:', this.loopManager.isPaused);
    }

    /**
     * ゲームループ
     */
    // gameLoop削除 (LoopManagerへ委譲)

    /**
     * 更新処理
     * @param {number} deltaTime - 前フレームからの経過時間（秒）
     */
    update(deltaTime) {
        // Timer System 更新
        this.timerSystem.update(deltaTime);

        // プレイヤー更新
        if (this.player) {
            // 衝突対象を収集（壁 + シナリオプロップ + 地面）
            const colliders = [...this.objects.walls];
            if (this.objects.ground) {
                colliders.push(this.objects.ground);
            }
            if (this.targetManager && this.targetManager.modeProps) {
                colliders.push(...this.targetManager.modeProps);
            }

            this.player.update(deltaTime, colliders);
        }

        // 射撃システム更新
        if (this.shootingSystem && this.player) {
            this.shootingSystem.update(this.player, deltaTime);
        }

        // ターゲットマネージャー更新
        if (this.targetManager) {
            this.targetManager.update(deltaTime, this.camera, this.player);
        }

        // 武器マネージャー更新
        if (this.weaponManager) {
            this.weaponManager.update(deltaTime);
        }

        // セッションタイマー更新
        if (this.sessionDuration !== Infinity && !this.loopManager.isPaused) {
            this.sessionTimeRemaining -= deltaTime;
            if (this.sessionTimeRemaining <= 0) {
                this.sessionTimeRemaining = 0;
                this.stop();
            }
        }

        // HUD更新
        this.updateHUD();

        // 入力マネージャー更新
        inputManager.update();
    }

    /**
     * HUDを更新
     */
    updateHUD() {
        if (!this.uiManager) return;

        // タイマー
        // LoopManagerのelapsedTimeかsessionTimeRemainingを使用
        if (this.sessionDuration === Infinity) {
            this.uiManager.updateTimer(this.loopManager.elapsedTime, false);
        } else {
            this.uiManager.updateTimer(this.sessionTimeRemaining, true);
        }

        // ステージ表示
        const stageDisplay = document.getElementById('stage-display'); // TODO: Move to UIManager completely?
        const stageValue = document.getElementById('stage-value');
        if (stageDisplay && stageValue) {
            if (this.currentMode === 'PREFIRE') {
                stageDisplay.classList.remove('hidden');
                if (this.targetManager) {
                    const stats = this.targetManager.getStats();
                    stageValue.textContent = stats.stage;
                }
            } else {
                stageDisplay.classList.add('hidden');
            }
        }

        if (!this.shootingSystem) return;

        const stats = this.shootingSystem.getStats();

        // メイン統計 (Hits, Misses, Accuracy, Combo, Score)
        this.uiManager.updateStats(stats);

        // クロスヘアの拡散を更新
        if (this.crosshairRenderer && this.player) {
            this.crosshairRenderer.updateAccuracy(this.player.getAccuracy());
        }

        // 武器情報更新
        if (this.weaponManager) {
            const weaponInfo = this.weaponManager.getWeaponInfo();
            if (weaponInfo) {
                this.uiManager.updateWeapon(weaponInfo);
            }
        }

        // FPS更新
        if (this.loopManager) {
            // LoopManager doesn't calculate FPS internally yet (impl detail), 
            // but we can calculate it or use a simple estimator.
            // LoopManager stores deltaTime.
            const fps = this.loopManager.deltaTime > 0 ? Math.round(1 / this.loopManager.deltaTime) : 0;
            this.uiManager.updateFPS(fps);
        }
    }

    // 残りのHUD更新ロジックは updateHUD 内で UIManager に移動済み

    /**
     * クロスヘアレンダラーを設定
     * @param {Object} renderer - CrosshairRendererインスタンス
     */
    setCrosshairRenderer(renderer) {
        this.crosshairRenderer = renderer;
    }

    /**
     * ターゲットヒット時のコールバック
     * @param {Object} hitInfo - ヒット情報
     * @param {THREE.Vector3} hitPoint - ヒット位置
     * @param {Object} relativePos - 相対位置 {x, y}
     */
    onTargetHit(hitInfo, hitPoint, relativePos) {
        console.log('Target hit!', hitInfo.isHeadshot ? 'HEADSHOT' : 'BODYSHOT');

        // サウンド再生
        if (hitInfo.isHeadshot) {
            audioManager.play('HEADSHOT');
        } else {
            audioManager.play('HIT');
        }

        // 統計記録
        statsManager.recordShot({
            hit: true,
            isHeadshot: hitInfo.isHeadshot,
            damage: hitInfo.damage || 0,
            position: hitPoint, // ヒット位置（ワールド）
            relativePosition: relativePos // 相対位置
        });

        // 反応時間を記録
        if (hitInfo.reactionTime) {
            statsManager.recordReactionTime(hitInfo.reactionTime * 1000);
        }

        // コンボ演出
        const currentCombo = this.shootingSystem.stats.combo;
        if (currentCombo > 1) {
            this.showComboPopup(currentCombo);
        }
    }

    /**
     * ミス時のコールバック
     * @param {THREE.Vector3|null} hitPoint - ヒット位置
     * @param {Object} relativePos - 相対位置 {x, y} (ターゲットを狙っていた場合)
     */
    onMiss(hitPoint, relativePos) {
        // 統計記録
        statsManager.recordShot({
            hit: false,
            isHeadshot: false,
            damage: 0,
            position: hitPoint, // ミス位置（壁など）
            relativePosition: relativePos // 相対位置
        });
    }

    /**
     * レンダリング
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * FPSカウンターを更新
     */
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime >= this.fpsUpdateTime + 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;

            // HUD更新
            const fpsElement = document.getElementById('fps-value');
            if (fpsElement) {
                fpsElement.textContent = this.currentFPS;
            }
        }
    }

    /**
     * ウィンドウリサイズハンドラ
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        console.log('Window resized:', width, 'x', height);
    }

    /**
     * グラフィックモードを変更
     * @param {string} mode - グラフィックモード
     */
    setGraphicsMode(mode) {
        if (mode in GRAPHICS_MODES) {
            this.graphicsMode = GRAPHICS_MODES[mode];
            settings.set('graphics.mode', mode);

            // シーンを再構築（簡易的にリロードを推奨）
            console.log('Graphics mode changed to:', mode);
            console.log(i18n.t('settings.messages.reloadRequired'));
        }
    }

    /**
     * リソースを解放
     */
    dispose() {
        console.log('Disposing game resources...');

        // 入力マネージャーを解放
        inputManager.dispose();

        // シーンオブジェクトを解放
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }

            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        // レンダラーを解放
        this.renderer.dispose();

        console.log('Game resources disposed');
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        if (!this.loopManager) return {};
        const info = this.loopManager.getInfo();
        return {
            fps: info.deltaTime > 0 ? Math.round(1 / info.deltaTime) : 0,
            deltaTime: info.deltaTime,
            elapsedTime: info.elapsedTime,
            isPaused: info.isPaused,
            mode: this.currentMode,
            graphicsMode: this.graphicsMode.mode,
            objects: {
                total: this.scene.children.length,
                targets: this.objects.targets.length
            },
            renderer: {
                drawCalls: this.renderer.info.render.calls,
                triangles: this.renderer.info.render.triangles,
                geometries: this.renderer.info.memory.geometries,
                textures: this.renderer.info.memory.textures
            }
        };
    }

    /**
     * ゲーム終了時のコールバックを設定
     * @param {Function} callback 
     */
    setOnGameEndCallback(callback) {
        this.onGameEndCallback = callback;
    }
    /**
     * コンボポップアップを表示
     * @param {number} combo - コンボ数
     */
    showComboPopup(combo) {
        if (this.uiManager) {
            this.uiManager.showComboPopup(combo);
        }
    }
}

// シングルトンインスタンスをエクスポート
export const game = new Game();
export default game;
