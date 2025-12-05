/**
 * ゲームループとシーン管理
 * Three.jsを使用した3Dシーンの管理とゲームループ
 */

import * as THREE from 'three';
import { PHYSICS_CONSTANTS, GRAPHICS_MODES } from '../utils/gameConst.js';
import settings from './settings.js';
import inputManager from './input.js';
import Player from '../player/player.js';
import ShootingSystem from '../player/shooting.js';
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

        // タイミング
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.fpsUpdateTime = 0;
        this.frameCount = 0;
        this.currentFPS = 60;

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

        // クロックをリセット
        this.clock.start();
        this.elapsedTime = 0;

        // ターゲットマネージャーを開始
        if (this.targetManager) {
            this.targetManager.startMode(mode);
        }

        // 射撃統計をリセット
        if (this.shootingSystem) {
            this.shootingSystem.resetStats();
        }

        // セッションタイマー設定
        this.sessionDuration = 60; // デフォルト60秒
        if (mode === 'FREEPLAY') {
            this.sessionDuration = Infinity;
        }
        this.sessionTimeRemaining = this.sessionDuration;

        // ゲームループを開始
        this.gameLoop();
    }

    /**
     * ゲームを停止
     * @param {boolean} triggerCallback - 終了コールバックを呼び出すかどうか
     */
    stop(triggerCallback = true) {
        console.log('Stopping game');

        this.isRunning = false;
        this.clock.stop();

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
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.clock.stop();
        } else {
            this.clock.start();
        }

        console.log('Game paused:', this.isPaused);
    }

    /**
     * ゲームループ
     */
    gameLoop() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.gameLoop());

        // FPS制限チェック
        const fpsLimit = settings.get('graphics.fpsLimit');
        if (fpsLimit > 0) {
            const targetFrameTime = 1000 / fpsLimit;
            const currentTime = performance.now();

            if (!this.lastFrameTime) {
                this.lastFrameTime = currentTime;
            }

            const elapsed = currentTime - this.lastFrameTime;

            if (elapsed < targetFrameTime) {
                return;
            }

            this.lastFrameTime = currentTime - (elapsed % targetFrameTime);
        }

        // デルタタイムを取得
        this.deltaTime = this.clock.getDelta();

        if (!this.isPaused) {
            this.elapsedTime += this.deltaTime;

            // 更新処理
            this.update(this.deltaTime);

            // セッションタイマー更新
            if (this.sessionDuration !== Infinity) {
                this.sessionTimeRemaining -= this.deltaTime;
                if (this.sessionTimeRemaining <= 0) {
                    this.sessionTimeRemaining = 0;
                    this.stop();
                }
            }
        }

        // レンダリング
        this.render();

        // FPSカウンター更新
        this.updateFPS();
    }

    /**
     * 更新処理
     * @param {number} deltaTime - 前フレームからの経過時間（秒）
     */
    update(deltaTime) {
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

        // データ収集（後で実装）
        // if (this.dataCollector) {
        //     this.dataCollector.update(deltaTime);
        // }

        // HUD更新
        this.updateHUD();

        // 入力マネージャー更新（次のフレームのためにクリア）
        inputManager.update();
    }

    /**
     * HUDを更新
     */
    updateHUD() {
        // タイマー更新
        const timerElement = document.getElementById('timer-value');
        if (timerElement) {
            if (this.sessionDuration === Infinity) {
                const minutes = Math.floor(this.elapsedTime / 60);
                const seconds = Math.floor(this.elapsedTime % 60);
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                const minutes = Math.floor(this.sessionTimeRemaining / 60);
                const seconds = Math.floor(this.sessionTimeRemaining % 60);
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        // ステージ表示更新
        const stageDisplay = document.getElementById('stage-display');
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

        // ヒット数
        const hitsElement = document.getElementById('hits-value');
        if (hitsElement) {
            hitsElement.textContent = stats.hits;
        }

        // ミス数
        const missesElement = document.getElementById('misses-value');
        if (missesElement) {
            missesElement.textContent = stats.misses;
        }

        // 精度
        const accuracyElement = document.getElementById('accuracy-value');
        if (accuracyElement) {
            const accuracy = (stats.accuracy * 100).toFixed(1);
            accuracyElement.textContent = accuracy + '%';
        }

        // コンボ
        const comboElement = document.getElementById('combo-value');
        if (comboElement) {
            comboElement.textContent = stats.combo;

            // コンボ数に応じて色を変えるなどの演出（CSSクラス切り替え）
            if (stats.combo >= 10) {
                comboElement.style.color = '#FF4655'; // Valorant Red
                comboElement.style.textShadow = '0 0 10px rgba(255, 70, 85, 0.5)';
            } else if (stats.combo >= 5) {
                comboElement.style.color = '#FFD700'; // Gold
                comboElement.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.5)';
            } else {
                comboElement.style.color = '#E87B35'; // Default Orange
                comboElement.style.textShadow = 'none';
            }
        }

        // スコア
        const scoreElement = document.getElementById('score-value');
        if (scoreElement) {
            scoreElement.textContent = stats.score.toLocaleString();
        }

        // クロスヘアの拡散を更新
        if (this.crosshairRenderer && this.player) {
            this.crosshairRenderer.updateAccuracy(this.player.getAccuracy());
        }
    }

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
        return {
            fps: this.currentFPS,
            deltaTime: this.deltaTime,
            elapsedTime: this.elapsedTime,
            isPaused: this.isPaused,
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
        const hud = document.getElementById('hud');
        if (!hud) return;

        // 既存のポップアップがあれば削除
        const existing = document.getElementById('combo-popup');
        if (existing) {
            existing.remove();
        }

        const popup = document.createElement('div');
        popup.id = 'combo-popup';
        popup.className = 'combo-display';
        popup.textContent = `${combo} COMBO!`;

        // コンボ数に応じてスタイル調整
        if (combo >= 10) {
            popup.style.color = '#FF4655';
            popup.style.fontSize = '3rem'; // 4rem -> 3rem
        } else if (combo >= 5) {
            popup.style.color = '#FFD700';
            popup.style.fontSize = '2.5rem'; // 3.5rem -> 2.5rem
        }

        hud.appendChild(popup);

        // アニメーション終了後に削除
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1000);
    }
}

// シングルトンインスタンスをエクスポート
export const game = new Game();
export default game;
