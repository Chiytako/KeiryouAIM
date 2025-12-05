/**
 * ターゲット生成管理システム
 * ターゲットのスポーン、管理、プーリング
 */

import * as THREE from 'three';
import Target from './target.js';
import { TRAINING_MODES, PREAIM_SCENARIOS, PRACTICAL_SCENARIOS } from '../utils/gameConst.js';
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
            trackingTarget: null, // Tracking用
            trackingTarget: null, // Tracking用
            currentStage: 1, // Pre-Aim用 (カウンター)
            currentScenarioIndex: 0 // Pre-Aim用 (シナリオID)
        };

        // すべてのアクティブターゲットをクリア
        this.clearAllTargets();

        // 統計をリセット
        this.resetStats();

        // モード固有のセットアップ
        if (modeName === 'MICROFLICK') {
            this.createMicroFlickStage();
        }

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
    update(deltaTime, camera, player) {
        // アクティブなターゲットを更新
        for (const target of this.activeTargets) {
            target.update(deltaTime, player);

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
     * @param {THREE.Camera} camera - カメラ（フリック用）
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
        } else if (config.name === 'アングルクリアリング練習') {
            this.spawnPreAim(config);
        } else if (config.name === 'フリック練習') {
            this.spawnMicroflick(config, camera);
        } else if (config.name === '複数ターゲット連続フリック') {
            this.spawnMultiflick(config);
        } else if (config.name === '実践モード') {
            this.spawnPractical(config);
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
     * プリエイム練習のスポーンロジック（自動射線チェック版）
     */
    spawnPreAim(config) {
        // 既にターゲットがいる場合は何もしない
        if (this.activeTargets.length > 0) return;

        const target = this.getFromPool();
        if (!target) return;

        // プレイヤーの初期視点位置
        const playerEyePos = new THREE.Vector3(0, 1.6, -5);

        // 最大試行回数
        const maxAttempts = 50;

        let validPosition = null;
        let selectedScenario = null;
        let attempts = 0;

        while (!validPosition && attempts < maxAttempts) {
            attempts++;

            // シナリオをランダムに選択
            const scenarioIndex = randomInt(0, PREAIM_SCENARIOS.length - 1);
            const scenario = PREAIM_SCENARIOS[scenarioIndex];

            // プロップを作成
            this.clearModeProps();
            this.createScenarioProps(scenario);
            this.modeProps.forEach(prop => prop.updateMatrixWorld(true));

            let candidatePos;

            // 固定ターゲット位置がある場合
            if (scenario.target) {
                candidatePos = new THREE.Vector3(
                    scenario.target.x,
                    scenario.target.y,
                    scenario.target.z
                );
                // 固定位置の場合は即採用（検証スキップ）
                validPosition = candidatePos;
                selectedScenario = scenario;
                this.modeState.currentScenarioIndex = scenarioIndex;
                break;
            }

            // spawnArea内でランダムな位置を生成
            candidatePos = this.generateRandomPositionInArea(scenario.spawnArea);

            // 床の高さを適用（高所シナリオ以外）
            if (scenario.spawnArea.minY === 0 && scenario.spawnArea.maxY === 0) {
                candidatePos.y = this.getFloorY(candidatePos.x, candidatePos.z);
            }

            // ターゲットの頭の位置
            const targetHeadPos = candidatePos.clone().add(new THREE.Vector3(0, 1.6, 0));

            // チェック1: 初期位置から射線が通らないこと
            const visibleFromStart = this.checkLineOfSight(playerEyePos, targetHeadPos);

            if (visibleFromStart) {
                // 最初から見えているのでNG、リトライ
                continue;
            }

            // チェック2: ピーク方向に動いたら射線が通ること
            const canPeek = this.validatePeekability(
                scenario.peekDirections,
                playerEyePos,
                targetHeadPos
            );

            if (!canPeek) {
                // どう動いても見えないのでNG、リトライ
                continue;
            }

            // チェック3: ターゲット位置が壁の中に埋まっていないこと
            const isInsideWall = this.checkPositionInsideWalls(candidatePos);

            if (isInsideWall) {
                continue;
            }

            // すべてのチェックを通過
            validPosition = candidatePos;
            selectedScenario = scenario;
            this.modeState.currentScenarioIndex = scenarioIndex;
        }

        // 有効な位置が見つからなかった場合のフォールバック
        if (!validPosition) {
            console.warn(`Failed to find valid position after ${maxAttempts} attempts, using fallback`);

            // 最後に試したシナリオのspawnAreaの中心を使用
            const fallbackScenarioIndex = randomInt(0, PREAIM_SCENARIOS.length - 1);
            const fallbackScenario = PREAIM_SCENARIOS[fallbackScenarioIndex];

            this.clearModeProps();
            this.createScenarioProps(fallbackScenario);
            this.modeProps.forEach(prop => prop.updateMatrixWorld(true));

            const area = fallbackScenario.spawnArea;
            validPosition = new THREE.Vector3(
                (area.minX + area.maxX) / 2,
                (area.minY + area.maxY) / 2,
                (area.minZ + area.maxZ) / 2
            );

            if (area.minY === 0 && area.maxY === 0) {
                validPosition.y = this.getFloorY(validPosition.x, validPosition.z);
            }

            selectedScenario = fallbackScenario;
            this.modeState.currentScenarioIndex = fallbackScenarioIndex;
        }

        // ターゲットをスポーン
        target.spawn(validPosition, config.targetDuration);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;

        // ステージカウンターを更新
        this.modeState.currentStage++;

        // コールバック呼び出し（プレイヤー位置リセット等）
        if (this.onSpawnCallback) {
            this.onSpawnCallback('PREFIRE', {
                scenarioId: selectedScenario.id,
                situationType: selectedScenario.situationType,
                peekDirections: selectedScenario.peekDirections
            });
        }

        console.log(`Spawned target at (${validPosition.x.toFixed(2)}, ${validPosition.y.toFixed(2)}, ${validPosition.z.toFixed(2)}) after ${attempts} attempts`);
    }

    /**
     * spawnArea内でランダムな位置を生成
     * @param {Object} area - {minX, maxX, minY, maxY, minZ, maxZ}
     * @returns {THREE.Vector3}
     */
    generateRandomPositionInArea(area) {
        return new THREE.Vector3(
            randomFloat(area.minX, area.maxX),
            randomFloat(area.minY, area.maxY),
            randomFloat(area.minZ, area.maxZ)
        );
    }

    /**
     * ピーク方向に動いたら射線が通るか検証
     * @param {Array<string>} peekDirections - ['left', 'right', 'forward', etc.]
     * @param {THREE.Vector3} playerEyePos - プレイヤー視点の初期位置
     * @param {THREE.Vector3} targetHeadPos - ターゲットの頭の位置
     * @returns {boolean} ピーク可能かどうか
     */
    validatePeekability(peekDirections, playerEyePos, targetHeadPos) {
        // 方向ベクトルの定義
        const directionVectors = {
            'left': new THREE.Vector3(-1, 0, 0),
            'right': new THREE.Vector3(1, 0, 0),
            'forward': new THREE.Vector3(0, 0, -1),
            'backward': new THREE.Vector3(0, 0, 1),
            'forward-left': new THREE.Vector3(-0.707, 0, -0.707),
            'forward-right': new THREE.Vector3(0.707, 0, -0.707)
        };

        // ピーク距離（Valorantでの一般的なピーク幅）
        const peekDistances = [1.0, 2.0, 3.0, 4.0];

        for (const dirName of peekDirections) {
            const dir = directionVectors[dirName];
            if (!dir) continue;

            for (const dist of peekDistances) {
                const peekedPos = playerEyePos.clone().add(dir.clone().multiplyScalar(dist));

                // ピーク位置から射線が通るかチェック
                if (this.checkLineOfSight(peekedPos, targetHeadPos)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 位置が壁の内部に埋まっていないかチェック
     * @param {THREE.Vector3} position - チェックする位置
     * @returns {boolean} 壁の内部にいる場合true
     */
    checkPositionInsideWalls(position) {
        // ターゲットのおおよそのサイズ
        const targetRadius = 0.3;

        // チェックポイント（足元、腰、頭）
        const checkPoints = [
            position.clone().add(new THREE.Vector3(0, 0.1, 0)),
            position.clone().add(new THREE.Vector3(0, 1.0, 0)),
            position.clone().add(new THREE.Vector3(0, 1.6, 0))
        ];

        for (const point of checkPoints) {
            for (const prop of this.modeProps) {
                if (!prop.geometry.boundingBox) {
                    prop.geometry.computeBoundingBox();
                }

                // ワールド座標でのバウンディングボックスを取得
                const box = new THREE.Box3().setFromObject(prop);

                // 少し内側に縮小（表面ギリギリはOKとする）
                // ただし、薄い壁（radius * 2以下）の場合は縮小すると判定不能になるため、サイズを確認して条件付きで縮小
                const size = new THREE.Vector3();
                box.getSize(size);

                if (size.x > targetRadius * 2) {
                    box.min.x += targetRadius;
                    box.max.x -= targetRadius;
                }
                // Y軸は高さ判定用なので通常はそのままか、必要なら縮小
                if (size.y > targetRadius * 2) {
                    box.min.y += targetRadius;
                    box.max.y -= targetRadius;
                }
                if (size.z > targetRadius * 2) {
                    box.min.z += targetRadius;
                    box.max.z -= targetRadius;
                }

                if (box.containsPoint(point)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 2点間の視線が通るかチェック（改良版）
     * @param {THREE.Vector3} start - 開始点
     * @param {THREE.Vector3} end - 終了点
     * @returns {boolean} 視線が通る場合true
     */
    checkLineOfSight(start, end) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const distance = direction.length();
        direction.normalize();

        const raycaster = new THREE.Raycaster(start, direction, 0, distance - 0.1);

        // modePropsのみをチェック（シナリオの壁）
        const intersects = raycaster.intersectObjects(this.modeProps, false);

        // 交差があれば遮蔽物がある（見えない）
        return intersects.length === 0;
    }

    /**
     * フリックのスポーンロジック
     * @param {Object} config - モード設定
     * @param {THREE.Camera} camera - カメラ（視線方向取得用）
     */
    spawnMicroflick(config, camera) {
        const target = this.getFromPool();
        if (!target) return;

        // フリック用の設定
        const angleRange = config.angleRange || [5, 30];
        const minAngle = angleRange[0];
        const maxAngle = angleRange[1];

        // 80%はヘッドライン（平地立ち）、20%はズレ（段差 or しゃがみ）
        const isStandard = Math.random() < 0.8;

        // ズレの場合、段差かしゃがみか（半々）
        // ただし、位置決定後に段差に乗った場合は段差優先
        const wantCrouch = !isStandard && Math.random() < 0.5;

        // 試行回数
        let attempts = 0;
        const maxAttempts = 10;
        let validPosition = null;
        let isOnStep = false;

        while (attempts < maxAttempts && !validPosition) {
            attempts++;

            const randomAngle = randomFloat(minAngle, maxAngle);
            const randomDirection = Math.random() * Math.PI        // 距離: スケボーパークのような広さを意識して少し遠目に
            const distance = randomFloat(10, 25); // 10-25m

            // 角度からオフセットを計算
            const angleRad = randomAngle * Math.PI / 180;
            const offsetDistance = distance * Math.tan(angleRad);

            // ランダムな方向にオフセット（水平面のみ: X-Z平面）
            const offsetX = Math.cos(randomDirection) * offsetDistance;
            const offsetZ = Math.sin(randomDirection) * offsetDistance;

            // 基準点の決定: 前回のターゲット位置、またはプレイヤーの正面
            let baseX, baseZ;
            if (this.modeState.lastPosition) {
                // 前回のターゲット位置を基準にする
                baseX = this.modeState.lastPosition.x;
                baseZ = this.modeState.lastPosition.z;
            } else if (camera) {
                // カメラの向いている方向の前方を基準にする
                baseX = 0;
                baseZ = -distance;
            } else {
                // フォールバック: 正面
                baseX = 0;
                baseZ = -distance;
            }

            // 新しい位置を計算
            let targetX = baseX + offsetX;
            let targetZ = baseZ + offsetZ;

            // 境界チェック (場外防止)
            // ステージ範囲拡大: X: -15~15, Z: -30~-5
            const minX = -15, maxX = 15;
            const minZ = -30, maxZ = -5;

            // クランプするだけでなく、範囲外なら反対側に折り返すなどして分布を維持したいが、
            // 単純にクランプすると端に偏る。
            // 範囲外ならリトライする方が良いが、無限ループ怖いのでクランプ + ランダム微調整
            if (targetX < minX || targetX > maxX || targetZ < minZ || targetZ > maxZ) {
                if (targetX < minX) targetX = minX + randomFloat(0, 2);
                if (targetX > maxX) targetX = maxX - randomFloat(0, 2);
                if (targetZ < minZ) targetZ = minZ + randomFloat(0, 2);
                if (targetZ > maxZ) targetZ = maxZ - randomFloat(0, 2);
            }

            // 床の高さを確認
            const floorY = this.getFloorY(targetX, targetZ);
            const onStep = floorY > 0.1; // 0.1m以上なら段差とみなす

            // 条件チェック
            if (isStandard) {
                // スタンダード（ヘッドライン）希望なら、段差はNG
                if (!onStep) {
                    validPosition = new THREE.Vector3(targetX, floorY, targetZ);
                    isOnStep = false;
                }
            } else {
                // ズレ希望
                if (onStep) {
                    // 段差に乗った -> OK (段差ズレ)
                    validPosition = new THREE.Vector3(targetX, floorY, targetZ);
                    isOnStep = true;
                } else if (wantCrouch) {
                    // 平地だがしゃがみ希望 -> OK
                    validPosition = new THREE.Vector3(targetX, floorY, targetZ);
                    isOnStep = false;
                }
                // 平地でしゃがみ希望でない（段差希望だった）場合はリトライ
                // ただし試行回数切れなら妥協する
            }
        }

        // 妥協（見つからなかった場合）
        if (!validPosition) {
            // とりあえず生成した位置を使う
            // 再計算が必要だが、面倒なので前回の計算値を使う（スコープ外だが...）
            // 簡易的にランダム生成
            validPosition = new THREE.Vector3(
                randomFloat(-8, 8),
                0,
                randomFloat(-20, -12)
            );
            // 床合わせ
            validPosition.y = this.getFloorY(validPosition.x, validPosition.z);
            isOnStep = validPosition.y > 0.1;
        }

        // 位置を記憶
        this.modeState.lastPosition = validPosition.clone();

        target.spawn(validPosition, config.targetDuration);

        // しゃがみ適用
        // スタンダードなら立ち。
        // ズレの場合: 段差なら立ち(高さでズレる)、平地ならしゃがみ(姿勢でズレる)
        if (!isStandard && !isOnStep) {
            target.setCrouch(true);
        } else {
            target.setCrouch(false);
        }

        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * 複数ターゲット連続フリック（マルチフリック）のスポーンロジック
     * Valorantのトレードキルやカバーを意識した、近距離での連続スポーン
     */
    spawnMultiflick(config) {
        const target = this.getFromPool();
        if (!target) return;

        let position;
        const activeCount = this.activeTargets.length;

        // 既にターゲットがいる場合、その近くにスポーンさせる（トレード/カバー）
        if (activeCount > 0) {
            // ランダムな既存ターゲットを基準にする
            const anchorTarget = this.activeTargets[randomInt(0, activeCount - 1)];
            const anchorPos = anchorTarget.position;

            // 基準点から少し離れた位置 (1.5m - 4.0m)
            // 近すぎると重なるし、遠すぎるとフリックにならない
            const distance = randomFloat(1.5, 4.0);
            const angle = Math.random() * Math.PI * 2;

            const offsetX = Math.cos(angle) * distance;
            const offsetZ = Math.sin(angle) * distance;

            position = new THREE.Vector3(
                anchorPos.x + offsetX,
                0, // 一旦0
                anchorPos.z + offsetZ
            );

        } else {
            // 最初のターゲット（または全滅後のリセット）
            // プレイヤーの前方広範囲にランダム
            const angleRange = config.angleRange ? config.angleRange[1] : 60;
            const distance = randomFloat(10, 20); // 10-20m

            const offset = randomVectorInRange(angleRange, distance);
            position = new THREE.Vector3(
                offset.x,
                0,
                -distance + offset.z // 前方基準
            );
        }

        // 境界チェック (簡易)
        const minX = -15, maxX = 15;
        const minZ = -25, maxZ = -5;

        // クランプ
        position.x = Math.max(minX, Math.min(maxX, position.x));
        position.z = Math.max(minZ, Math.min(maxZ, position.z));

        // 重なりチェック（既存ターゲットと近すぎる場合は修正）
        // 簡易的に、近すぎる場合は再抽選せず、少しずらす
        for (const other of this.activeTargets) {
            const dist = position.distanceTo(other.position);
            if (dist < 1.0) {
                // 近すぎるので、離す方向に移動
                const pushDir = new THREE.Vector3().subVectors(position, other.position).normalize();
                // 完全に重なっている場合はランダム方向
                if (pushDir.lengthSq() === 0) {
                    pushDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                }
                position.add(pushDir.multiplyScalar(1.5 - dist));
            }
        }

        // 床の高さに合わせる
        position.y = this.getFloorY(position.x, position.z);

        target.spawn(position, config.targetDuration);
        this.activeTargets.push(target);
        this.stats.totalSpawned++;
    }

    /**
     * フリック用のステージ（段差）を作成
     */
    createMicroFlickStage() {
        this.clearModeProps();

        const material = new THREE.MeshStandardMaterial({
            color: 0x34495e,
            roughness: 0.7,
            metalness: 0.1
        });

        // スケボーパーク風 / Valorantサイト風の配置
        // 距離感: 10m - 25m
        const steps = [
            // === 奥のエリア (Heaven / Back Site) ===
            // ヘヴン（高台）: 高さ2.0m, Z: -25m付近
            { x: 5, z: -25, width: 8, height: 2.0, depth: 6 },

            // スロープ風階段（ヘヴンへのアクセス）: 高さ1.0m (中継)
            { x: 0, z: -23, width: 4, height: 1.0, depth: 4 },

            // === 中央エリア (Mid Site) ===
            // ファンボックス（中央の台）: 高さ0.5m, Z: -15m
            { x: 0, z: -15, width: 6, height: 0.5, depth: 6 },

            // ファンボックス上の遮蔽物: 高さ1.0m (合計1.5m)
            { x: 0, z: -15, width: 2, height: 1.0, depth: 2, y: 1.0 },

            // === サイドエリア (Ledges / Rails) ===
            // 左側の長いレッジ: 高さ0.8m
            { x: -8, z: -18, width: 2, height: 0.8, depth: 10 },

            // 右側の低いプラットフォーム: 高さ0.4m
            { x: 8, z: -15, width: 4, height: 0.4, depth: 8 },

            // === 手前エリア (Front Site) ===
            // エントリーボックス: 高さ1.0m
            { x: -4, z: -10, width: 2, height: 1.0, depth: 2 },

            // 逆サイドの低い箱: 高さ0.6m
            { x: 4, z: -10, width: 2, height: 0.6, depth: 2 }
        ];

        steps.forEach(config => {
            const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
            const step = new THREE.Mesh(geometry, material);

            // Y座標の決定（指定がなければ地面に置く）
            const y = config.y !== undefined ? config.y : config.height / 2;
            step.position.set(config.x, y, config.z);

            step.castShadow = true;
            step.receiveShadow = true;

            this.scene.add(step);
            this.modeProps.push(step);
        });
    }

    /**
     * 指定位置の床の高さを取得（レイキャスト）
     * @param {number} x 
     * @param {number} z 
     * @returns {number} 床のY座標
     */
    /**
     * 指定位置の床の高さを取得（レイキャスト）
     * @param {number} x 
     * @param {number} z 
     * @returns {number} 床のY座標
     */
    getFloorY(x, z) {
        // 上空から下に向かってレイキャスト
        // 開始位置を下げて天井ヒットを防ぐ (50 -> 20)
        const raycaster = new THREE.Raycaster();
        const start = new THREE.Vector3(x, 20, z);
        const direction = new THREE.Vector3(0, -1, 0);
        raycaster.set(start, direction);

        // シーン内のオブジェクトと交差判定
        const intersects = raycaster.intersectObject(this.scene, true);

        for (const hit of intersects) {
            const obj = hit.object;

            // ターゲットのパーツを除外
            if (obj.userData && (obj.userData.type === 'head' || obj.userData.type === 'body' || obj.userData.isOutline)) {
                continue;
            }

            // 線画（EdgesGeometry）などを除外してメッシュのみを対象にする
            if (!obj.isMesh) {
                continue;
            }

            // マテリアルが完全透明な場合は除外（当たり判定用などの不可視オブジェクト）
            if (obj.material && obj.material.opacity === 0 && obj.material.transparent) {
                continue;
            }

            // 天井と思われる高さ（例えば3.0m以上）で、かつ下に何もない場合は無視する
            // ただし、ヘヴンなどの高所（2-3m）は許可したいが、壁の上（4m）はNG
            // 3.0m以上は壁の上とみなす
            if (hit.point.y > 3.0) {
                continue;
            }

            return hit.point.y;
        }

        return 0; // ヒットしない場合は0
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

            const targetX = offset.x;
            const targetZ = -distance + offset.z;

            // 床の高さを取得
            const floorY = this.getFloorY(targetX, targetZ);

            return new THREE.Vector3(
                targetX,
                floorY, // 床の高さに合わせる
                targetZ
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
            // プリエイムも即座に次へ（壁の再生成があるため少し間隔あけてもいいが、テンポ重視）
            this.nextSpawnTime = 0.5; // 0.5秒後に次
            // ステージ番号はシナリオIDに依存するため、ここではインクリメントしない
            // this.modeState.currentStage++;
        } else if (this.currentModeConfig.name === 'フリック練習') {
            // フリックも即座に次をスポーン
            this.nextSpawnTime = 0;
        } else if (this.currentModeConfig.name === '実践モード') {
            // 実践モードは全滅判定が必要だが、現状1体ずつなので即次へ
            // 複数体の場合は activeTargets.length === 0 で判定する
            if (this.activeTargets.length === 0) {
                this.nextSpawnTime = 0.5;
            }
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
     * すべてのアクティブターゲットの色を更新
     */
    updateAllTargetsColors() {
        for (const target of this.activeTargets) {
            target.updateColors();
        }
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
            poolSize: this.targetPool.length,
            activeTargets: this.activeTargets.length,
            poolSize: this.targetPool.length,
            // プリエイムモードの場合はシナリオインデックス+1を返す、それ以外はcurrentStage
            stage: (this.currentModeConfig && this.currentModeConfig.name === 'プリエイム練習')
                ? (this.modeState.currentScenarioIndex + 1)
                : (this.modeState.currentStage || 1)
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
    /**
     * 次のシナリオへ（実践モード用）
     */
    nextScenario() {
        if (!this.currentModeConfig || this.currentModeConfig.name !== '実践モード') return;

        // 次のシナリオへ
        let nextIndex = (this.modeState.currentScenarioIndex + 1) % PRACTICAL_SCENARIOS.length;

        // 強制的にリスポーン
        this.clearAllTargets();
        this.spawnPractical(this.currentModeConfig, nextIndex);
    }

    /**
     * 実践モードのスポーンロジック
     * @param {Object} config 
     * @param {number} [forceIndex] - 強制的に指定するシナリオインデックス
     */
    spawnPractical(config, forceIndex = null) {
        // 既にターゲットがいる場合は何もしない（forceIndex指定時は無視して上書き）
        if (forceIndex === null && this.activeTargets.length > 0) return;

        let scenarioIndex;

        if (forceIndex !== null) {
            scenarioIndex = forceIndex;
        } else {
            // ランダム選択（前回と違うもの）
            let attempts = 0;
            do {
                scenarioIndex = randomInt(0, PRACTICAL_SCENARIOS.length - 1);
                attempts++;
            } while (scenarioIndex === this.modeState.currentScenarioIndex && attempts < 5);
        }

        this.modeState.currentScenarioIndex = scenarioIndex;
        const scenario = PRACTICAL_SCENARIOS[scenarioIndex];

        // プロップ（壁など）を作成
        this.clearModeProps();
        this.createScenarioProps(scenario);

        // プレイヤー位置の提案（コールバック経由でMainに通知）
        if (this.onSpawnCallback && scenario.playerStart) {
            this.onSpawnCallback('PRACTICAL', {
                playerStart: scenario.playerStart,
                scenarioName: scenario.description
            });
        }

        // 敵のスポーン
        scenario.enemies.forEach(enemyConfig => {
            const target = this.getFromPool();
            if (!target) return;

            // 位置設定
            const position = new THREE.Vector3(
                enemyConfig.position.x,
                enemyConfig.position.y,
                enemyConfig.position.z
            );

            // 床の高さ補正（y=0の場合）
            if (position.y === 0) {
                position.y = this.getFloorY(position.x, position.z);
            }

            // 壁埋まりチェックと修正
            if (this.checkPositionInsideWalls(position)) {
                console.warn(`Target spawned inside wall at ${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)} in scenario ${scenario.id}`);

                // 周辺を探す (半径0.5m ~ 1.0m)
                let foundSafe = false;
                const offsets = [
                    { x: 0.5, z: 0 }, { x: -0.5, z: 0 }, { x: 0, z: 0.5 }, { x: 0, z: -0.5 },
                    { x: 0.5, z: 0.5 }, { x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 }, { x: -0.5, z: 0.5 },
                    { x: 1.0, z: 0 }, { x: -1.0, z: 0 }, { x: 0, z: 1.0 }, { x: 0, z: -1.0 }
                ];

                for (const off of offsets) {
                    const testPos = position.clone().add(new THREE.Vector3(off.x, 0, off.z));

                    // 高さ再調整
                    if (enemyConfig.position.y === 0) {
                        testPos.y = this.getFloorY(testPos.x, testPos.z);
                    }

                    if (!this.checkPositionInsideWalls(testPos)) {
                        position.copy(testPos);
                        foundSafe = true;
                        console.log(`Adjusted target position to ${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`);
                        break;
                    }
                }

                if (!foundSafe) {
                    console.error("Could not find safe position for target! Spawning at original position.");
                }
            }

            target.spawn(position, config.targetDuration);

            // 敵の挙動設定
            if (enemyConfig.moveType) {
                target.setMovementPattern(enemyConfig.moveType, enemyConfig.moveSpeed || 2.0);

                // パトロールポイントの設定
                if (enemyConfig.moveType === 'PATROL' && enemyConfig.points) {
                    target.setPatrolPoints(enemyConfig.points);
                }

                // トリガー距離の設定
                if (enemyConfig.triggerDistance) {
                    target.setTriggerDistance(enemyConfig.triggerDistance);
                }

                // ピーク方向の設定
                if (enemyConfig.peekDirection) {
                    target.setPeekDirection(enemyConfig.peekDirection);
                }

                // ジグル幅の設定
                if (enemyConfig.width) {
                    target.setJiggleWidth(enemyConfig.width);
                }
            }

            this.activeTargets.push(target);
            this.stats.totalSpawned++;
        });

        console.log(`Started Practical Scenario: ${scenario.id} (${scenario.description})`);
    }
}



export default TargetSpawner;
