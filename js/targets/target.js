/**
 * ターゲット基底クラス
 * エイム練習用のターゲットオブジェクト
 */

import * as THREE from 'three';
import { HITBOX } from '../utils/gameConst.js';
import settings from '../core/settings.js';

export class Target {
    constructor(scene, graphicsMode) {
        this.scene = scene;
        this.graphicsMode = graphicsMode;

        // 3Dオブジェクト
        this.group = new THREE.Group();
        this.headMesh = null;
        this.bodyMesh = null;

        // 状態
        this.isActive = false;
        this.isHit = false;
        this.spawnTime = 0;
        this.visibleTime = null;
        this.isVisible = false;
        this.lifetime = 5000; // ミリ秒

        // 物理・移動
        this.velocity = new THREE.Vector3();
        this.movementPattern = 'NONE'; // NONE, LINEAR, SINE, STRAFE
        this.movementSpeed = 0;
        this.movementData = {
            initialPosition: new THREE.Vector3(),
            time: 0,
            direction: 1,
            changeTime: 0
        };

        // トラッキング用
        this.maxHealth = 100;
        this.health = 100;
        this.isTrackingTarget = false;

        // ヒット情報
        this.hitPart = null; // 'head' or 'body'
        this.hitPosition = null;

        // 位置とスケール
        this.position = new THREE.Vector3();
        this.scale = 1.0;

        // アニメーション
        this.animationTime = 0;

        // パーティクル（簡易的）
        this.particles = [];

        this.create();
    }

    /**
     * ターゲットを作成
     */
    create() {
        // ヘッド
        const headGeometry = new THREE.SphereGeometry(HITBOX.HEAD.radius, 16, 16);
        let headMaterial;

        // 設定から色を取得
        const fillColor = settings.get('target.fillColor') || HITBOX.HEAD.color;
        const outlineColor = settings.get('target.outlineColor') || HITBOX.HEAD.color;
        console.log('Target created with colors:', { fillColor, outlineColor, mode: this.graphicsMode.mode });

        if (this.graphicsMode.mode === 'WIREFRAME') {
            // ワイヤーフレームモードでも当たり判定用に透明なSolidマテリアルを使用
            headMaterial = new THREE.MeshBasicMaterial({
                color: fillColor,
                transparent: true,
                opacity: 0.0, // 完全透明
                wireframe: false // 重要: Raycast用にSolidにする
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            headMaterial = new THREE.MeshLambertMaterial({
                color: fillColor
            });
        } else {
            // RICH
            headMaterial = new THREE.MeshStandardMaterial({
                color: fillColor,
                roughness: 0.5,
                metalness: 0.1
            });
        }

        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = HITBOX.HEAD.heightOffset;
        this.headMesh.userData.type = 'head';
        this.headMesh.userData.target = this;

        if (this.graphicsMode.shadows) {
            this.headMesh.castShadow = true;
            this.headMesh.receiveShadow = true;
        }

        this.group.add(this.headMesh);

        // ボディ
        const bodyGeometry = new THREE.CapsuleGeometry(
            HITBOX.BODY.width / 2,
            HITBOX.BODY.height,
            8,
            16
        );

        let bodyMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            // ワイヤーフレームモードでも当たり判定用に透明なSolidマテリアルを使用
            bodyMaterial = new THREE.MeshBasicMaterial({
                color: fillColor,
                transparent: true,
                opacity: 0.0,
                wireframe: false
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            bodyMaterial = new THREE.MeshLambertMaterial({
                color: fillColor
            });
        } else {
            bodyMaterial = new THREE.MeshStandardMaterial({
                color: fillColor,
                roughness: 0.6,
                metalness: 0.05
            });
        }

        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = HITBOX.BODY.heightOffset;
        this.bodyMesh.userData.type = 'body';
        this.bodyMesh.userData.target = this;

        if (this.graphicsMode.shadows) {
            this.bodyMesh.castShadow = true;
            this.bodyMesh.receiveShadow = true;
        }

        this.group.add(this.bodyMesh);

        // レッグ（足）
        const legsGeometry = new THREE.CapsuleGeometry(
            HITBOX.LEGS.width / 2,
            HITBOX.LEGS.height,
            8,
            16
        );

        let legsMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            legsMaterial = new THREE.MeshBasicMaterial({
                color: fillColor,
                transparent: true,
                opacity: 0.0,
                wireframe: false
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            legsMaterial = new THREE.MeshLambertMaterial({
                color: HITBOX.LEGS.color // 緑色（デフォルト）
            });
        } else {
            legsMaterial = new THREE.MeshStandardMaterial({
                color: HITBOX.LEGS.color,
                roughness: 0.8,
                metalness: 0.1
            });
        }

        this.legsMesh = new THREE.Mesh(legsGeometry, legsMaterial);
        this.legsMesh.position.y = HITBOX.LEGS.heightOffset;
        this.legsMesh.userData.type = 'legs'; // ヒット判定はbody扱いにするか、legs専用にするか
        this.legsMesh.userData.target = this;

        if (this.graphicsMode.shadows) {
            this.legsMesh.castShadow = true;
            this.legsMesh.receiveShadow = true;
        }

        this.group.add(this.legsMesh);

        this.createOutlines();

        this.group.visible = false;
        this.scene.add(this.group);
    }

    /**
     * アウトラインを作成（Inverted Hull法）
     */
    createOutlines() {
        const outlineColor = settings.get('target.outlineColor') || '#FF0000';
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: outlineColor,
            side: THREE.BackSide,
            transparent: true
        });

        // ヘッドのアウトライン
        const headRadius = HITBOX.HEAD.radius;
        const headOutlineGeo = new THREE.SphereGeometry(headRadius * 1.03, 16, 16);
        this.headOutline = new THREE.Mesh(headOutlineGeo, outlineMaterial.clone());
        this.headOutline.userData.isOutline = true;
        // 影を落とさない
        this.headOutline.castShadow = false;
        this.headOutline.receiveShadow = false;
        this.headMesh.add(this.headOutline);

        // ボディのアウトライン
        const bodyRadius = HITBOX.BODY.width / 2;
        const bodyHeight = HITBOX.BODY.height;
        const bodyOutlineGeo = new THREE.CapsuleGeometry(
            bodyRadius * 1.03,
            bodyHeight * 1.02,
            8,
            16
        );
        this.bodyOutline = new THREE.Mesh(bodyOutlineGeo, outlineMaterial.clone());
        this.bodyOutline.userData.isOutline = true;
        this.bodyOutline.castShadow = false;
        this.bodyOutline.receiveShadow = false;
        this.bodyMesh.add(this.bodyOutline);

        // レッグのアウトライン
        const legsRadius = HITBOX.LEGS.width / 2;
        const legsHeight = HITBOX.LEGS.height;
        const legsOutlineGeo = new THREE.CapsuleGeometry(
            legsRadius * 1.03,
            legsHeight * 1.02,
            8,
            16
        );
        this.legsOutline = new THREE.Mesh(legsOutlineGeo, outlineMaterial.clone());
        this.legsOutline.userData.isOutline = true;
        this.legsOutline.castShadow = false;
        this.legsOutline.receiveShadow = false;
        this.legsMesh.add(this.legsOutline);
    }

    /**
     * ターゲットをスポーン
     * @param {THREE.Vector3} position - 位置
     * @param {number} lifetime - 生存時間（ミリ秒）
     */
    spawn(position, lifetime = 3000) {
        this.position.copy(position);
        this.group.position.copy(position);

        this.isActive = true;
        this.isHit = false;
        this.spawnTime = performance.now();
        this.visibleTime = null;
        this.isVisible = false;
        this.lifetime = lifetime;
        this.hitPart = null;
        this.hitPosition = null;

        // 移動データ初期化
        this.velocity.set(0, 0, 0);
        this.movementPattern = 'NONE';
        this.movementData.initialPosition.copy(position);
        this.movementData.time = 0;
        this.movementData.direction = Math.random() > 0.5 ? 1 : -1;
        this.movementData.changeTime = 0;

        // トラッキング初期化
        this.isTrackingTarget = false;
        this.health = this.maxHealth;

        this.group.visible = true;

        // スポーンアニメーション
        this.group.scale.set(0, 0, 0);
        this.animationTime = 0;

        // マテリアルリセット
        this.resetMaterials();

        // 色を更新（設定変更を反映）
        this.updateColors();
    }

    /**
     * ターゲットの色を更新
     */
    updateColors() {
        const fillColor = settings.get('target.fillColor') || HITBOX.HEAD.color;
        const outlineColor = settings.get('target.outlineColor') || HITBOX.HEAD.color;

        console.log('Target.updateColors called with:', { fillColor, outlineColor });

        // ヘッド
        if (this.headMesh) {
            if (this.headMesh.material.color) {
                this.headMesh.material.color.set(fillColor);
                this.headMesh.material.needsUpdate = true;
            }

        }

        // ボディ
        if (this.bodyMesh) {
            if (this.bodyMesh.material.color) {
                this.bodyMesh.material.color.set(fillColor);
                this.bodyMesh.material.needsUpdate = true;
            }

        }

        // レッグ
        if (this.legsMesh) {
            // レッグは通常色を変えない（緑色のまま）か、設定に合わせるか
            // ここでは設定に合わせて統一感を出す
            if (this.legsMesh.material.color) {
                this.legsMesh.material.color.set(fillColor); // ボディと同じ色にする
                this.legsMesh.material.needsUpdate = true;
            }
        }

        // アウトライン（Inverted Hull）
        if (this.headOutline && this.headOutline.material) {
            this.headOutline.material.color.set(outlineColor);
        }
        if (this.bodyOutline && this.bodyOutline.material) {
            this.bodyOutline.material.color.set(outlineColor);
        }
        if (this.legsOutline && this.legsOutline.material) {
            this.legsOutline.material.color.set(outlineColor);
        }
    }

    /**
     * 移動パターンを設定
     * @param {string} pattern - パターン名
     * @param {number} speed - 速度
     */
    setMovementPattern(pattern, speed = 1.0) {
        this.movementPattern = pattern;
        this.movementSpeed = speed;

        if (pattern === 'LINEAR') {
            // ランダムな方向（水平）
            const angle = Math.random() * Math.PI * 2;
            this.velocity.set(Math.cos(angle) * speed, 0, Math.sin(angle) * speed);
        }
    }

    /**
     * トラッキングモード設定
     * @param {boolean} enabled - 有効か
     * @param {number} health - 耐久値
     */
    setTrackingMode(enabled, health = 100) {
        this.isTrackingTarget = enabled;
        this.maxHealth = health;
        this.health = health;
    }

    /**
     * しゃがみ状態を設定
     * @param {boolean} isCrouching 
     */
    setCrouch(isCrouching) {
        if (isCrouching) {
            // しゃがみ（ヘッド高さ1.2m）
            this.headMesh.position.y = 1.2;
            this.bodyMesh.position.y = 0.6;
            this.bodyMesh.scale.set(1, 0.7, 1); // 縦に潰す

            // アウトラインも追従
            if (this.headOutline) this.headOutline.position.y = 0; // 親(headMesh)に追従
            if (this.bodyOutline) this.bodyOutline.position.y = 0;

        } else {
            // 立ち（ヘッド高さ1.6m）
            this.headMesh.position.y = HITBOX.HEAD.heightOffset;
            this.bodyMesh.position.y = HITBOX.BODY.heightOffset;
            this.bodyMesh.scale.set(1, 1, 1);
        }
    }

    /**
     * ターゲットを更新
     * @param {number} deltaTime - 経過時間（秒）
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.spawnTime;

        // 生存時間チェック
        if (elapsed >= this.lifetime && !this.isHit && !this.isTrackingTarget) {
            this.despawn();
            return;
        }

        // 移動更新
        this.updateMovement(deltaTime);

        // スポーンアニメーション
        this.animationTime += deltaTime * 5; // 5倍速
        if (this.animationTime < 1) {
            const scale = this.easeOutElastic(this.animationTime);
            this.group.scale.set(scale, scale, scale);
        } else if (!this.isHit) {
            this.group.scale.set(1, 1, 1);
        }

        // ヒット後のアニメーション
        if (this.isHit) {
            const hitElapsed = (currentTime - this.hitTime) / 1000;
            if (hitElapsed < 0.3) { // より速く消える
                // フェードアウト
                const opacity = 1 - hitElapsed * 3;
                this.setOpacity(Math.max(0, opacity));

                // 拡大して消える（ポップエフェクト）
                const scale = 1 + hitElapsed * 0.5;
                this.group.scale.set(scale, scale, scale);
            } else {
                this.despawn();
            }
        }

        // トラッキングターゲットの色更新（ダメージ表現）
        if (this.isTrackingTarget && this.health < this.maxHealth) {
            const healthRatio = this.health / this.maxHealth;
            // ダメージを受けると赤く点滅
            if (this.health <= 0) {
                this.hit('body', this.group.position); // 破壊
            }
        }
    }

    /**
     * 移動ロジック更新
     * @param {number} deltaTime - 経過時間
     */
    updateMovement(deltaTime) {
        if (this.movementPattern === 'NONE' || this.isHit) return;

        this.movementData.time += deltaTime;

        if (this.movementPattern === 'LINEAR') {
            // 単純な等速直線運動
            this.position.addScaledVector(this.velocity, deltaTime);

            // 境界チェック（簡易的）
            if (Math.abs(this.position.x) > 10) this.velocity.x *= -1;
            if (this.position.y < 0.5 || this.position.y > 4) this.velocity.y *= -1;

        } else if (this.movementPattern === 'SINE') {
            // 上下ふわふわ
            const yOffset = Math.sin(this.movementData.time * 2) * 0.5;
            this.position.y = this.movementData.initialPosition.y + yOffset;

        } else if (this.movementPattern === 'STRAFE') {
            // レレレ撃ち（左右ランダム移動）
            if (this.movementData.time > this.movementData.changeTime) {
                this.movementData.direction = Math.random() > 0.5 ? 1 : -1;
                this.movementData.changeTime = this.movementData.time + Math.random() * 1.0 + 0.5; // 0.5-1.5秒ごとに切り替え
            }

            // 加速・減速（慣性）
            const targetVelX = this.movementData.direction * this.movementSpeed;
            this.velocity.x += (targetVelX - this.velocity.x) * deltaTime * 5;

            this.position.x += this.velocity.x * deltaTime;

            // 範囲制限
            if (this.position.x > 5) {
                this.position.x = 5;
                this.velocity.x *= -1;
                this.movementData.direction = -1;
            } else if (this.position.x < -5) {
                this.position.x = -5;
                this.velocity.x *= -1;
                this.movementData.direction = 1;
            }
        }

        this.group.position.copy(this.position);
    }

    /**
     * 視認性をチェック
     * @param {THREE.Camera} camera - カメラ
     * @param {Array} obstacles - 障害物（壁など）の配列
     */
    checkVisibility(camera, obstacles) {
        if (this.isVisible || !this.isActive) return;

        // ターゲットの中心（またはヘッド）
        const targetPoint = this.group.position.clone().add(new THREE.Vector3(0, 1.6, 0)); // ヘッド位置
        const direction = targetPoint.clone().sub(camera.position).normalize();
        const distance = camera.position.distanceTo(targetPoint);

        // レイキャスト
        const raycaster = new THREE.Raycaster(camera.position, direction, 0, distance);

        // 障害物との交差判定
        // obstaclesが空なら即視認とみなす（またはシーン全体から壁を探す）
        if (obstacles && obstacles.length > 0) {
            const intersects = raycaster.intersectObjects(obstacles, false); // 再帰不要ならfalse

            if (intersects.length === 0) {
                // 障害物がなければ視認可能
                this.isVisible = true;
                this.visibleTime = performance.now();
            }
        } else {
            // 障害物指定がない場合は即視認
            this.isVisible = true;
            this.visibleTime = performance.now();
        }
    }

    /**
     * ターゲットがヒットされた
     * @param {string} part - ヒット部位（'head' or 'body'）
     * @param {THREE.Vector3} hitPosition - ヒット位置
     * @param {number} damage - ダメージ量（トラッキング用）
     * @returns {Object} ヒット情報
     */
    hit(part, hitPosition, damage = 100) {
        if (!this.isActive || (this.isHit && !this.isTrackingTarget)) {
            return null;
        }

        // トラッキングモードの場合
        if (this.isTrackingTarget) {
            this.health -= damage;
            if (this.health > 0) {
                // まだ破壊されていない
                return {
                    part: part,
                    position: hitPosition,
                    isHeadshot: part === 'head',
                    damage: damage,
                    isKill: false
                };
            }
        }

        this.isHit = true;
        this.hitPart = part;
        this.hitPosition = hitPosition.clone();
        this.hitTime = performance.now();

        // ヒットフラッシュ（マテリアルを白くする）
        this.flashMaterial();

        // 反応時間の計算（視認してからの時間）
        // 視認されていない（visibleTimeがnull）場合はspawnTimeからの時間（フォールバック）
        const startTime = this.visibleTime || this.spawnTime;
        const reactionTime = Math.max(0, (this.hitTime - startTime) / 1000);

        // ヒット情報を返す
        return {
            part: part,
            position: hitPosition,
            isHeadshot: part === 'head',
            damageMultiplier: HITBOX[part.toUpperCase()].damageMultiplier,
            reactionTime: reactionTime,
            isKill: true
        };
    }

    /**
     * マテリアルを一時的に白くする
     */
    flashMaterial() {
        if (this.headMesh.material.emissive) {
            const originalHeadEmissive = this.headMesh.material.emissive.clone();
            const originalBodyEmissive = this.bodyMesh.material.emissive.clone();
            const originalLegsEmissive = this.legsMesh ? this.legsMesh.material.emissive.clone() : null;

            this.headMesh.material.emissive.setHex(0xffffff);
            this.bodyMesh.material.emissive.setHex(0xffffff);
            if (this.legsMesh) this.legsMesh.material.emissive.setHex(0xffffff);

            setTimeout(() => {
                if (this.headMesh) {
                    this.headMesh.material.emissive.copy(originalHeadEmissive);
                    this.bodyMesh.material.emissive.copy(originalBodyEmissive);
                    if (this.legsMesh && originalLegsEmissive) this.legsMesh.material.emissive.copy(originalLegsEmissive);
                }
            }, 50);
        }
    }

    /**
     * 不透明度を設定
     */
    setOpacity(opacity) {
        if (this.graphicsMode.mode !== 'WIREFRAME') {
            this.headMesh.material.opacity = opacity;
            this.bodyMesh.material.opacity = opacity;
            this.headMesh.material.transparent = opacity < 1.0;
            this.bodyMesh.material.transparent = opacity < 1.0;

            if (this.legsMesh) {
                this.legsMesh.material.opacity = opacity;
                this.legsMesh.material.transparent = opacity < 1.0;
            }
        }

        // アウトラインの不透明度
        if (this.headOutline) {
            this.headOutline.material.opacity = opacity;
            this.headOutline.material.transparent = opacity < 1.0;
        }
        if (this.bodyOutline) {
            this.bodyOutline.material.opacity = opacity;
            this.bodyOutline.material.transparent = opacity < 1.0;
        }
        if (this.legsOutline) {
            this.legsOutline.material.opacity = opacity;
            this.legsOutline.material.transparent = opacity < 1.0;
        }
    }

    /**
     * マテリアルをリセット
     */
    resetMaterials() {
        this.setOpacity(1.0);
        if (this.headMesh.material.emissive) {
            this.headMesh.material.emissive.setHex(0x000000);
            this.bodyMesh.material.emissive.setHex(0x000000);
            if (this.legsMesh) this.legsMesh.material.emissive.setHex(0x000000);
        }
    }

    /**
     * ターゲットをデスポーン
     */
    despawn() {
        this.isActive = false;
        this.group.visible = false;
        this.resetMaterials();
        this.group.scale.set(1, 1, 1);
    }

    /**
     * ターゲットのバウンディングボックスを取得
     * @returns {THREE.Box3}
     */
    getBoundingBox() {
        const box = new THREE.Box3();
        box.setFromObject(this.group);
        return box;
    }

    /**
     * イージング関数: EaseOutElastic
     * @param {number} t - 時間（0-1）
     * @returns {number}
     */
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
                ? 1
                : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    /**
     * リソースを解放
     */
    dispose() {
        this.scene.remove(this.group);

        if (this.headMesh) {
            this.headMesh.geometry.dispose();
            this.headMesh.material.dispose();
        }

        if (this.bodyMesh) {
            this.bodyMesh.geometry.dispose();
            this.bodyMesh.material.dispose();
        }

        if (this.legsMesh) {
            this.legsMesh.geometry.dispose();
            this.legsMesh.material.dispose();
        }

        if (this.headOutline) {
            this.headOutline.geometry.dispose();
            this.headOutline.material.dispose();
        }

        if (this.bodyOutline) {
            this.bodyOutline.geometry.dispose();
            this.bodyOutline.material.dispose();
        }

        if (this.legsOutline) {
            this.legsOutline.geometry.dispose();
            this.legsOutline.material.dispose();
        }
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            isActive: this.isActive,
            isHit: this.isHit,
            hitPart: this.hitPart,
            position: this.position,
            velocity: this.velocity,
            pattern: this.movementPattern,
            lifetime: this.lifetime,
            elapsed: this.isActive ? performance.now() - this.spawnTime : 0
        };
    }
}

export default Target;
