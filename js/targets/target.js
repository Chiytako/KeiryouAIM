/**
 * ターゲット基底クラス
 * エイム練習用のターゲットオブジェクト
 */

import * as THREE from 'three';
import { HITBOX } from '../utils/valorantConst.js';

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
        this.lifetime = 3000; // ミリ秒

        // ヒット情報
        this.hitPart = null; // 'head' or 'body'
        this.hitPosition = null;

        // 位置とスケール
        this.position = new THREE.Vector3();
        this.scale = 1.0;

        // アニメーション
        this.animationTime = 0;

        this.create();
    }

    /**
     * ターゲットを作成
     */
    create() {
        // ヘッド
        const headGeometry = new THREE.SphereGeometry(HITBOX.HEAD.radius, 16, 16);
        let headMaterial;

        if (this.graphicsMode.mode === 'WIREFRAME') {
            headMaterial = new THREE.MeshBasicMaterial({
                color: HITBOX.HEAD.color,
                wireframe: true
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            headMaterial = new THREE.MeshLambertMaterial({
                color: HITBOX.HEAD.color
            });
        } else {
            // RICH
            headMaterial = new THREE.MeshStandardMaterial({
                color: HITBOX.HEAD.color,
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
            bodyMaterial = new THREE.MeshBasicMaterial({
                color: HITBOX.BODY.color,
                wireframe: true
            });
        } else if (this.graphicsMode.mode === 'STANDARD') {
            bodyMaterial = new THREE.MeshLambertMaterial({
                color: HITBOX.BODY.color
            });
        } else {
            bodyMaterial = new THREE.MeshStandardMaterial({
                color: HITBOX.BODY.color,
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

        // 線画版の場合はグロー効果
        if (this.graphicsMode.mode === 'WIREFRAME' && this.graphicsMode.glowEffect) {
            // エッジグロー（簡易版）
            const edgeGeometry = new THREE.EdgesGeometry(headGeometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffcc,
                linewidth: 2
            });
            const headEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            this.headMesh.add(headEdges);
        }

        this.group.visible = false;
        this.scene.add(this.group);
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
        this.lifetime = lifetime;
        this.hitPart = null;
        this.hitPosition = null;

        this.group.visible = true;

        // スポーンアニメーション
        this.group.scale.set(0, 0, 0);
        this.animationTime = 0;
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
        if (elapsed >= this.lifetime && !this.isHit) {
            this.despawn();
            return;
        }

        // スポーンアニメーション
        this.animationTime += deltaTime * 5; // 5倍速
        if (this.animationTime < 1) {
            const scale = this.easeOutBack(this.animationTime);
            this.group.scale.set(scale, scale, scale);
        } else {
            this.group.scale.set(1, 1, 1);
        }

        // ヒット後のアニメーション
        if (this.isHit) {
            const hitElapsed = (currentTime - this.hitTime) / 1000;
            if (hitElapsed < 0.5) {
                // フェードアウト
                const opacity = 1 - hitElapsed * 2;
                this.headMesh.material.opacity = opacity;
                this.bodyMesh.material.opacity = opacity;
                this.headMesh.material.transparent = true;
                this.bodyMesh.material.transparent = true;

                // 縮小
                const scale = 1 - hitElapsed;
                this.group.scale.set(scale, scale, scale);
            } else {
                this.despawn();
            }
        }
    }

    /**
     * ターゲットがヒットされた
     * @param {string} part - ヒット部位（'head' or 'body'）
     * @param {THREE.Vector3} hitPosition - ヒット位置
     * @returns {Object} ヒット情報
     */
    hit(part, hitPosition) {
        if (!this.isActive || this.isHit) {
            return null;
        }

        this.isHit = true;
        this.hitPart = part;
        this.hitPosition = hitPosition.clone();
        this.hitTime = performance.now();

        // ヒット情報を返す
        return {
            part: part,
            position: hitPosition,
            isHeadshot: part === 'head',
            damageMultiplier: HITBOX[part.toUpperCase()].damageMultiplier,
            reactionTime: (this.hitTime - this.spawnTime) / 1000 // 秒
        };
    }

    /**
     * ターゲットをデスポーン
     */
    despawn() {
        this.isActive = false;
        this.group.visible = false;

        // マテリアルをリセット
        if (this.headMesh.material.transparent) {
            this.headMesh.material.opacity = 1.0;
            this.bodyMesh.material.opacity = 1.0;
            this.headMesh.material.transparent = false;
            this.bodyMesh.material.transparent = false;
        }

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
     * イージング関数: EaseOutBack
     * @param {number} t - 時間（0-1）
     * @returns {number}
     */
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
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
            lifetime: this.lifetime,
            elapsed: this.isActive ? performance.now() - this.spawnTime : 0
        };
    }
}

export default Target;
