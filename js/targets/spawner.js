/**
 * ターゲット生成管理システム
 * ターゲットのスポーン、管理、プーリング
 */

import * as THREE from 'three';
import Target from './target.js';
import { TRAINING_MODES, PREAIM_SCENARIOS } from '../utils/gameConst.js';
import { randomFloat, randomInt, randomVectorInRange } from '../utils/math.js';

export class TargetSpawner {
    constructor(scene, graphicsMode) {
        this.scene = scene;
        this.graphicsMode = graphicsMode;

        // ターゲットプール
        this.targetPool = [];
        this.activeTargets = [];
        this.poolSize = 20;

        // スポーン設定
        this.spawnTimer = 0;
        this.nextSpawnTime = 0;
        this.isSpawning = false;

        // 現在のモード設定
        this.currentModeConfig = null;
        this.modeState = {}; // モード固有の状態

        // スポーンエリア
        this.spawnArea = {
            center: new THREE.Vector3(0, 0.0, -10), // Y=0 (ヘッド高さ1.6m)
            radius: 5,
            minDistance: 5,
            maxDistance: 20
        };

        // モード固有のオブジェクト（壁など）
        this.modeProps = [];

        // 統計
        this.stats = {
            totalSpawned: 0,
            totalHit: 0,
            totalMissed: 0
        };

        // コールバック
        this.onSpawnCallback = null;

        // プールを初期化
        this.initializePool();
    }

    /**
     * スポーン時のコールバックを設定
     * @param {Function} callback 
     */
    setOnSpawnCallback(callback) {
        this.onSpawnCallback = callback;
    }

    /**
     * ターゲットプールを初期化
     */
    initializePool() {
        for (let i = 0; i < this.poolSize; i++) {
            const target = new Target(this.scene, this.graphicsMode);
            this.targetPool.push(target);
        }

        console.log('Target pool initialized with', this.poolSize, 'targets');
    }

    /**
     * 練習モードを開始
     * @param {string} modeName - モード名
     */
    startMode(modeName) {
        if (!(modeName in TRAINING_MODES)) {
            console.error('Unknown training mode:', modeName);
            return;
        }

        this.currentModeConfig = TRAINING_MODES[modeName];
        this.isSpawning = true;
        this.spawnTimer = 0;
        this.nextSpawnTime = 0;

        // モード固有の状態を初期化
        this.modeState = {
            lastPosition: null, // 前回の位置（重複防止）
            gridPositions: [], // Gridshot用
            spiderCenter: true, // Spidershot用（次は中央か？）
            trackingTarget: null // Tracking用
        };

        // すべてのアクティブターゲットをクリア
        this.clearAllTargets();

        // 統計をリセット
        this.resetStats();

        console.log('Started training mode:', modeName);
    }

    /**
     * モードを停止
     */
    stopMode() {
        this.isSpawning = false;
        this.clearAllTargets();
        this.clearModeProps(); // プロップも削除
        console.log('Stopped training mode');
    }

    /**
     * 更新
     * @param {number} deltaTime - 経過時間（秒）
     * @param {THREE.Camera} camera - カメラ（視認判定用）
     */
    update(deltaTime, camera) {
        // アクティブなターゲットを更新
        for (const target of this.activeTargets) {
            target.update(deltaTime);

            // 視認判定（カメラが渡された場合）
            if (camera) {
                target.checkVisibility(camera, this.modeProps);
            }

            // 非アクティブになったターゲットをプールに戻す
            if (!target.isActive) {
                this.returnToPool(target);

                if (!target.isHit && !target.isTrackingTarget) {
                    this.stats.totalMissed++;
                }
            }
        }

        // スポーン処理
        if (this.isSpawning && this.currentModeConfig) {
            this.spawnTimer += deltaTime;

            if (this.spawnTimer >= this.nextSpawnTime) {
                // アクティブターゲット数が上限に達していない場合のみスポーン
                if (this.activeTargets.length < this.currentModeConfig.targetCount) {
                    this.spawnTargets(camera); // カメラを渡す
                    this.spawnTimer = 0;
                    this.nextSpawnTime = this.currentModeConfig.targetDelay / 1000; // ミリ秒→秒
                }
            }
        }
    }

    /**
     * ターゲットをスポーン
     * @param {THREE.Camera} camera - カメラ（マイクロフリック用）
     */
    spawnTargets(camera) {
        const config = this.currentModeConfig;

        // モードごとのスポーンロジック
        if (config.name === 'グリッドショット') {
            this.spawnGridshot(config);
        } else if (config.name === 'スパイダーショット') {
            this.spawnSpidershot(config);
        } else if (config.name === 'トラッキング') {
            this.spawnTracking(config);
        } else if (config.name === 'プリエイム練習') {
            this.spawnPreAim(config);
        } else if (config.name === 'マイクロフリック練習') {
            this.spawnMicroflick(config, camera);
        } else {
            // デフォルトのスポーンロジック
            this.spawnDefault(config);
        }
    }

    /**
     * デフォルトのスポーンロジック
     */
    spawnDefault(config) {
        const target = this.getFromPool();
        if (!target) return;

        const position = this.generateSpawnPosition(config);
        target.spawn(position, config.targetDuration);

        // 移動設定がある場合
        if (config.includeMovement) {
            // ランダムな移動パターン
            const moveType = Math.random() > 0.5 ? 'STRAFE' : 'LINEAR';
            const speed = config.movementSpeed || 2.0;
            target.setMovementPattern(moveType, speed);
        }

        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * グリッドショットのスポーンロジック
     */
    spawnGridshot(config) {
        // 3x3グリッドの位置を生成（初回のみ）
        if (this.modeState.gridPositions.length === 0) {
            const gridSize = config.gridSize || 3;
            const spacing = 1.5; // グリッド間隔
            // グリッドの中心を(0, 0)にする
            const startX = -((gridSize - 1) * spacing) / 2;
            const startY = ((gridSize - 1) * spacing) / 2; // 上から下へ

            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    this.modeState.gridPositions.push(new THREE.Vector3(
                        startX + x * spacing,
                        startY - y * spacing, // Y=0を中心に配置（ヘッド高さはTarget側で+1.6される）
                        -10 // 固定の奥行き
                    ));
                }
            }
        }

        // 空いている位置を探す
        const availablePositions = this.modeState.gridPositions.filter(pos => {
            // 既にターゲットがある位置を除外
            return !this.activeTargets.some(t => t.position.distanceTo(pos) < 0.1);
        });

        if (availablePositions.length > 0) {
            const target = this.getFromPool();
            if (!target) return;

            // ランダムな空き位置を選択
            const index = randomInt(0, availablePositions.length - 1);
            const position = availablePositions[index];

            target.spawn(position, config.targetDuration);
            this.activeTargets.push(target);
            this.stats.totalSpawned++;
        }
    }

    /**
     * スパイダーショットのスポーンロジック
     */
    spawnSpidershot(config) {
        const target = this.getFromPool();
        if (!target) return;

        let position;

        if (this.modeState.spiderCenter) {
            // 中央 (Y=0)
            position = new THREE.Vector3(
                config.centerPosition.x,
                0, // ヘッド高さ補正済み
                config.centerPosition.z
            );
        } else {
            // ランダムな外側
            const angle = Math.random() * Math.PI * 2;
            const distance = randomFloat(3, 6); // 中心からの距離

            position = new THREE.Vector3(
                Math.cos(angle) * distance,
                randomFloat(-1, 1), // 上下バラつき（Y=0基準）
                config.centerPosition.z
            );
        }

        // 次回の状態を反転
        this.modeState.spiderCenter = !this.modeState.spiderCenter;

        target.spawn(position, config.targetDuration);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * トラッキングのスポーンロジック
     */
    spawnTracking(config) {
        // 既にターゲットがいる場合は何もしない
        if (this.activeTargets.length > 0) return;

        const target = this.getFromPool();
        if (!target) return;

        const position = new THREE.Vector3(0, 0, -10); // Y=0
        target.spawn(position, config.targetDuration);

        // トラッキング設定
        target.setTrackingMode(true, config.health);
        target.setMovementPattern(config.movementType, config.movementSpeed);

        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * プリエイム練習のスポーンロジック
     */
    spawnPreAim(config) {
        // 既にターゲットがいる場合は何もしない（1つずつ処理）
        if (this.activeTargets.length > 0) return;

        const target = this.getFromPool();
        if (!target) return;

        // シナリオをランダムに選択
        const scenarioIndex = randomInt(0, PREAIM_SCENARIOS.length - 1);
        const scenario = PREAIM_SCENARIOS[scenarioIndex];

        // 前回のプロップを削除して新しい壁を作成
        this.clearModeProps();
        this.createScenarioProps(scenario);

        // ターゲット位置を設定
        const position = new THREE.Vector3(
            scenario.target.x,
            scenario.target.y,
            scenario.target.z
        );

        target.spawn(position, config.targetDuration);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;

        // コールバック呼び出し（プレイヤー位置リセットなど）
        if (this.onSpawnCallback) {
            this.onSpawnCallback('PREFIRE', { scenarioId: scenario.id });
        }
    }

    /**
     * マイクロフリックのスポーンロジック
     * @param {Object} config - モード設定
     * @param {THREE.Camera} camera - カメラ（視線方向取得用）
     */
    spawnMicroflick(config, camera) {
        const target = this.getFromPool();
        if (!target) return;

        let referencePoint;

        // 基準点の決定: 前回のターゲット位置、またはカメラの視線方向
        if (this.modeState.lastPosition) {
            referencePoint = this.modeState.lastPosition.clone();
        } else if (camera) {
            // カメラの視線方向に仮想的な基準点を配置
            const viewDistance = 10; // 10m先
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(camera.quaternion);
            referencePoint = camera.position.clone().add(forward.multiplyScalar(viewDistance));
        } else {
            // フォールバック: 正面
            referencePoint = new THREE.Vector3(0, 0, -10);
        }

        // マイクロフリック用の設定
        const angleRange = config.angleRange || [5, 30]; // 度
        const minAngle = angleRange[0];
        const maxAngle = angleRange[1];
        const randomAngle = randomFloat(minAngle, maxAngle);
        const randomDirection = Math.random() * Math.PI * 2; // 0-360度

        // 距離: マイクロフリックは近～中距離
        const distance = randomFloat(7, 15); // 7-15m

        // 角度からオフセットを計算
        const angleRad = randomAngle * Math.PI / 180;
        const offsetDistance = distance * Math.tan(angleRad);

        // ランダムな方向にオフセット（水平面と垂直方向の両方）
        const offsetX = Math.cos(randomDirection) * offsetDistance;
        const offsetY = Math.sin(randomDirection) * offsetDistance;

        // 新しい位置
        // 注意: ターゲットグループのY座標 + HITBOX.HEAD.heightOffset(1.6m) = 実際のヘッド位置
        // 基準点のY座標を使用し、少しランダム性を持たせる
        const position = new THREE.Vector3(
            referencePoint.x + offsetX,
            referencePoint.y + offsetY - 1.6 + randomFloat(-0.2, 0.2), // 基準点を中心に±0.2mのランダム性
            -distance
        );

        // 位置を記憶（次のターゲットの基準点として使用）
        // 記憶する位置は実際のヘッド位置（Y座標 + 1.6m）
        this.modeState.lastPosition = new THREE.Vector3(
            position.x,
            position.y + 1.6,
            position.z
        );

        target.spawn(position, config.targetDuration);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * シナリオのプロップ（壁など）を作成
     */
    createScenarioProps(scenario) {
        if (!scenario.walls) return;

        const material = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            roughness: 0.7,
            metalness: 0.1
        });

        scenario.walls.forEach(wallConfig => {
            const geometry = new THREE.BoxGeometry(
                wallConfig.width,
                wallConfig.height,
                wallConfig.depth
            );
            const wall = new THREE.Mesh(geometry, material);

            // 位置設定（Yは高さの半分だけ上げて地面に接するように、または指定値）
            const y = wallConfig.y !== undefined ? wallConfig.y : wallConfig.height / 2;
            wall.position.set(
                wallConfig.x,
                y,
                wallConfig.z
            );

            if (wallConfig.rotation) {
                wall.rotation.y = wallConfig.rotation;
            }

            wall.castShadow = true;
            wall.receiveShadow = true;

            this.scene.add(wall);
            this.modeProps.push(wall);
        });
    }

    /**
     * モード固有のプロップを削除
     */
    clearModeProps() {
        for (const prop of this.modeProps) {
            this.scene.remove(prop);
            if (prop.geometry) prop.geometry.dispose();
            // マテリアルは再利用しているのでdisposeしない（または管理が必要）
        }
        this.modeProps = [];
    }

    /**
     * スポーン位置を生成
     * @param {Object} config - モード設定
     * @returns {THREE.Vector3}
     */
    generateSpawnPosition(config) {
        if (config.randomPosition) {
            // ランダムな位置
            const angleRange = config.angleRange ? config.angleRange[1] : 45;
            const distance = randomFloat(this.spawnArea.minDistance, this.spawnArea.maxDistance);

            // プレイヤーの前方基準でランダムな方向
            const offset = randomVectorInRange(angleRange, distance);

            return new THREE.Vector3(
                offset.x,
                0.0 + randomFloat(-0.1, 0.1), // グループのY=0でヘッドが1.6mになる
                -distance + offset.z
            );
        } else {
            // 固定位置（プリエイム用）
            return this.spawnArea.center.clone();
        }
    }

    /**
     * プールからターゲットを取得
     * @returns {Target|null}
     */
    getFromPool() {
        for (const target of this.targetPool) {
            if (!target.isActive) {
                return target;
            }
        }

        // プールに空きがない場合は新しいターゲットを作成
        if (this.targetPool.length < this.poolSize * 2) {
            const newTarget = new Target(this.scene, this.graphicsMode);
            this.targetPool.push(newTarget);
            return newTarget;
        }

        return null;
    }

    /**
     * ターゲットをプールに戻す
     * @param {Target} target - ターゲット
     */
    returnToPool(target) {
        const index = this.activeTargets.indexOf(target);
        if (index > -1) {
            this.activeTargets.splice(index, 1);
        }
    }

    /**
     * すべてのアクティブターゲットをクリア
     */
    clearAllTargets() {
        for (const target of this.activeTargets) {
            target.despawn();
        }
        this.activeTargets = [];
    }

    /**
     * ターゲットがヒットされた
     * @param {Target} target - ターゲット
     */
    onTargetHit(target) {
        this.stats.totalHit++;

        // モード固有のヒット処理
        if (this.currentModeConfig.name === 'スパイダーショット') {
            // ヒットしたら即座に次をスポーンさせるためタイマーをリセット
            this.nextSpawnTime = 0;
        } else if (this.currentModeConfig.name === 'グリッドショット') {
            // グリッドショットも即座に次を出す
            this.nextSpawnTime = 0;
        } else if (this.currentModeConfig.name === 'プリエイム練習') {
            // プリエイムも即座に次へ（壁の再生成があるため少し間隔あけてもいいが、テンポ重視）
            this.nextSpawnTime = 0.5; // 0.5秒後に次
        } else if (this.currentModeConfig.name === 'マイクロフリック練習') {
            // マイクロフリックも即座に次をスポーン
            this.nextSpawnTime = 0;
        }
    }

    /**
     * スポーンエリアを設定
     * @param {THREE.Vector3} center - 中心位置
     * @param {number} radius - 半径
     * @param {number} minDistance - 最小距離
     * @param {number} maxDistance - 最大距離
     */
    setSpawnArea(center, radius, minDistance, maxDistance) {
        this.spawnArea.center.copy(center);
        this.spawnArea.radius = radius;
        this.spawnArea.minDistance = minDistance;
        this.spawnArea.maxDistance = maxDistance;
    }

    /**
     * 特定の位置にターゲットを手動スポーン
     * @param {THREE.Vector3} position - 位置
     * @param {number} lifetime - 生存時間（ミリ秒）
     * @returns {Target|null}
     */
    spawnAt(position, lifetime = 3000) {
        const target = this.getFromPool();
        if (!target) return null;

        target.spawn(position, lifetime);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;

        return target;
    }

    /**
     * 統計をリセット
     */
    resetStats() {
        this.stats = {
            totalSpawned: 0,
            totalHit: 0,
            totalMissed: 0
        };
    }

    /**
     * 統計を取得
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            activeTargets: this.activeTargets.length,
            poolSize: this.targetPool.length
        };
    }

    /**
     * リソースを解放
     */
    dispose() {
        this.clearAllTargets();

        for (const target of this.targetPool) {
            target.dispose();
        }

        this.targetPool = [];
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isSpawning: this.isSpawning,
            currentMode: this.currentModeConfig?.name || 'None',
            stats: this.getStats(),
            spawnArea: this.spawnArea,
            nextSpawnIn: (this.nextSpawnTime - this.spawnTimer).toFixed(2) + 's'
        };
    }
}

export default TargetSpawner;
