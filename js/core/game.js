/**
 * ゲームループとシーン管理
 * Three.jsを使用した3Dシーンの管理とゲームループ
 */

import * as THREE from 'three';
import { VALORANT_CONSTANTS, GRAPHICS_MODES } from '../utils/valorantConst.js';
import settings from './settings.js';
import inputManager from './input.js';
import Player from '../player/player.js';
import ShootingSystem from '../player/shooting.js';
import TargetSpawner from '../targets/spawner.js';
import audioManager from './audio.js';

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
        this.shootingSystem.setOnHitCallback((hitInfo, hitPoint) => {
            this.onTargetHit(hitInfo, hitPoint);
        });
        console.log('Shooting system initialized');

        // ターゲットマネージャーの初期化
        this.targetManager = new TargetSpawner(this.scene, this.graphicsMode);
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
            this.renderer.setClearColor(0x1a1a2e, 1);
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
            this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);
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
        this.camera.position.set(0, VALORANT_CONSTANTS.CAMERA_HEIGHT, 0);

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
                color: 0x2c3e50
            });
        } else {
            // RICH
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2c3e50,
                roughness: 0.8,
                metalness: 0.2
            });
        }

        this.objects.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.objects.ground.rotation.x = -Math.PI / 2;
        this.objects.ground.position.y = 0;

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
        const mapSize = 50;

        let wallMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            wallMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                wireframe: true
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            wallMaterial = new THREE.MeshLambertMaterial({
                color: 0x34495e
            });
        } else {
            wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x34495e,
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

        // ゲームループを開始
        this.gameLoop();
    }

    /**
     * ゲームを停止
     */
    stop() {
        console.log('Stopping game');

        this.isRunning = false;
        this.clock.stop();

        // ターゲットマネージャーを停止
        if (this.targetManager) {
            this.targetManager.stopMode();
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
            this.player.update(deltaTime);
        }

        // 射撃システム更新
        if (this.shootingSystem && this.player) {
            this.shootingSystem.update(this.player, deltaTime);
        }

        // ターゲットマネージャー更新
        if (this.targetManager) {
            this.targetManager.update(deltaTime);
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
     */
    onTargetHit(hitInfo, hitPoint) {
        console.log('Target hit!', hitInfo.isHeadshot ? 'HEADSHOT' : 'BODYSHOT');

        // サウンド再生
        if (hitInfo.isHeadshot) {
            audioManager.play('HEADSHOT');
        } else {
            audioManager.play('HIT');
        }
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
            console.log('ページをリロードして変更を適用してください');
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
}

// シングルトンインスタンスをエクスポート
export const game = new Game();
export default game;
