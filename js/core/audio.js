/**
 * オーディオ管理システム
 * 効果音とBGMの再生を管理
 */

import settings from './settings.js';
import { AUDIO_SETTINGS } from '../utils/valorantConst.js';

class AudioManager {
    constructor() {
        this.sounds = {};
        this.context = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.initialized = false;
    }

    /**
     * オーディオシステムを初期化
     * (ユーザーインタラクション後に呼び出す必要がある)
     */
    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();

            // マスターゲインノード
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);

            // SFXゲインノード
            this.sfxGain = this.context.createGain();
            this.sfxGain.connect(this.masterGain);

            // Musicゲインノード
            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.masterGain);

            // 設定の適用
            this.updateVolumes();

            // 設定変更の監視
            settings.onChange((path, value) => {
                if (path.startsWith('audio.')) {
                    this.updateVolumes();
                }
            });

            this.initialized = true;
            console.log('AudioManager initialized');

            // サウンドのロード
            this.loadSounds();
        } catch (e) {
            console.error('Web Audio API is not supported:', e);
        }
    }

    /**
     * ボリューム設定を更新
     */
    updateVolumes() {
        if (!this.initialized) return;

        const masterVol = settings.get('audio.masterVolume');
        const sfxVol = settings.get('audio.sfxVolume');
        const musicVol = settings.get('audio.musicVolume');

        // 現在の時刻でスムーズに音量を変更
        const now = this.context.currentTime;
        this.masterGain.gain.setTargetAtTime(masterVol, now, 0.1);
        this.sfxGain.gain.setTargetAtTime(sfxVol, now, 0.1);
        this.musicGain.gain.setTargetAtTime(musicVol, now, 0.1);
    }

    /**
     * サウンドファイルをロード
     */
    async loadSounds() {
        const soundFiles = AUDIO_SETTINGS.SOUNDS;

        for (const [key, path] of Object.entries(soundFiles)) {
            try {
                // ここでは実際のファイルロードではなく、シンセサイザー的な音を生成するフォールバックを用意
                // 実際のファイルがある場合はそれをロードするように拡張可能
                // 今回はファイルが存在しない可能性が高いため、動的に生成する
                this.sounds[key] = { type: 'synthetic', name: key };

                // ファイルロードを試みる場合は以下のようなコードになる
                /*
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.sounds[key] = { type: 'buffer', buffer: audioBuffer };
                */
            } catch (e) {
                console.warn(`Failed to load sound: ${path}`, e);
            }
        }
    }

    /**
     * サウンドを再生
     * @param {string} name - サウンド名 (SHOOT, HIT, etc.)
     */
    play(name) {
        if (!this.initialized) {
            // まだ初期化されていない場合は初期化を試みる（ユーザーアクション内であれば成功する）
            this.init();
        }

        if (!this.initialized || !this.sounds[name]) return;

        // コンテキストがサスペンド状態なら再開
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const sound = this.sounds[name];

        if (sound.type === 'synthetic') {
            this.playSyntheticSound(name);
        } else if (sound.type === 'buffer') {
            this.playBuffer(sound.buffer);
        }
    }

    /**
     * バッファ再生
     */
    playBuffer(buffer) {
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(0);
    }

    /**
     * シンセサイザー音を再生（ファイルがない場合のフォールバック）
     */
    playSyntheticSound(name) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        const now = this.context.currentTime;

        switch (name) {
            case 'SHOOT':
                // 銃声っぽい音（ノイズ + 減衰）
                // 簡易的に矩形波で代用
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'HIT':
                // ヒット音（高音）
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'HEADSHOT':
                // ヘッドショット音（より高い音、金属的）
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'MISS':
                // ミス音（低い音、または無音に近い）
                // 邪魔にならないようにごく小さく
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'UI_CLICK':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'UI_HOVER':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;

            default:
                break;
        }
    }
}

// シングルトンインスタンスをエクスポート
export const audioManager = new AudioManager();
export default audioManager;
