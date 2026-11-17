import * as THREE from '../vendor/three.module.min.js';

const GOBKIT_FPS = 24;

/**
 * Capability-aware animation driver supporting:
 * 1) Separate named AnimationClip rigs (Idle, Walk, Run, Attack, Special, Hit, Death)
 * 2) Single-track baked frame-range rigs (Gobkit minion & animal packs)
 */
export class CharacterAnimator {
  constructor(root, clips, animMeta = null) {
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = clips || [];
    this.animMeta = animMeta;
    this.actions = new Map();
    this.mode = 'none';
    this.currentState = 'idle';
    this.localTime = 0;
    this.oneShotDone = false;
    this.bakedSegments = null;
    this.bakedAction = null;

    this._init();
  }

  _init() {
    if (!this.clips || this.clips.length === 0) {
      this.mode = 'none';
      return;
    }

    // Check if separate named clips exist (e.g. KnightCaptain, OrcLegionary, BloodironJuggernaut)
    const namedMap = new Map();
    for (const clip of this.clips) {
      namedMap.set(clip.name.toLowerCase(), clip);
    }

    if (this.clips.length > 1 || (namedMap.has('idle') && this.clips[0].duration < 4.0 && !this.animMeta?.baked)) {
      this.mode = 'named';
      for (const clip of this.clips) {
        const key = clip.name.toLowerCase();
        const action = this.mixer.clipAction(clip);
        if (key === 'death' || key === 'dead') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else if (key === 'attack' || key === 'special' || key === 'hit') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = false;
        } else {
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
        this.actions.set(key, action);
      }
      this.play('idle', true);
    } else {
      // Single baked track (e.g. minion-a01 "movement" or Bat/Rhino "clip")
      this.mode = 'baked';
      const clip = this.clips[0];
      this.bakedAction = this.mixer.clipAction(clip);
      this.bakedAction.play();

      const totalFrames = Math.round(clip.duration * GOBKIT_FPS);
      if (this.animMeta?.segments) {
        this.bakedSegments = this.animMeta.segments;
      } else if (totalFrames >= 110) {
        // Animal pack convention: idle 0-29, attack 30-59, dead 60-89, walk 90-119
        this.bakedSegments = {
          idle: { from: 0, to: 29, loop: true },
          attack: { from: 30, to: 59, loop: false },
          special: { from: 30, to: 59, loop: false },
          death: { from: 60, to: 89, loop: false, hold: true },
          walk: { from: 90, to: 119, loop: true },
          run: { from: 90, to: 119, loop: true },
        };
      } else {
        // Minion pack convention: idle 0-29, attack 30-59, dead 60-89
        this.bakedSegments = {
          idle: { from: 0, to: 29, loop: true },
          walk: { from: 0, to: 29, loop: true },
          run: { from: 0, to: 29, loop: true },
          attack: { from: 30, to: 59, loop: false },
          special: { from: 30, to: 59, loop: false },
          death: { from: 60, to: 89, loop: false, hold: true },
        };
      }
      this.play('idle', true);
    }
  }

  hasClip(name) {
    const key = name.toLowerCase();
    if (this.mode === 'named') return this.actions.has(key);
    if (this.mode === 'baked') return Boolean(this.bakedSegments?.[key]);
    return false;
  }

  play(stateName, force = false, speedScale = 1.0) {
    let key = stateName.toLowerCase();
    if (key === 'dead') key = 'death';

    if (this.currentState === 'death' && !force) return;
    if (this.currentState === key && !force) {
      if (this.mode === 'named') {
        const act = this.actions.get(key);
        if (act) act.timeScale = speedScale;
      }
      return;
    }

    if (this.mode === 'named') {
      const targetKey = this._resolveNamedKey(key);
      const nextAction = this.actions.get(targetKey);
      if (!nextAction) return;

      const prevKey = this._resolveNamedKey(this.currentState);
      const prevAction = this.actions.get(prevKey);

      this.currentState = key;
      this.localTime = 0;
      this.oneShotDone = false;

      nextAction.reset();
      nextAction.timeScale = speedScale;
      nextAction.enabled = true;
      nextAction.setEffectiveWeight(1);
      if (prevAction && prevAction !== nextAction) {
        prevAction.crossFadeTo(nextAction, 0.14, true);
      }
      nextAction.play();
    } else if (this.mode === 'baked') {
      const resolved = this._resolveBakedKey(key);
      this.currentState = resolved;
      this.localTime = 0;
      this.oneShotDone = false;
      this.speedScale = speedScale;
    }
  }

  _resolveNamedKey(key) {
    if (this.actions.has(key)) return key;
    if (key === 'run' && this.actions.has('walk')) return 'walk';
    if (key === 'walk' && this.actions.has('run')) return 'run';
    if (key === 'special' && this.actions.has('attack')) return 'attack';
    if (key === 'hit' && this.actions.has('idle')) return 'idle';
    if (this.actions.has('idle')) return 'idle';
    return this.actions.keys().next().value;
  }

  _resolveBakedKey(key) {
    if (this.bakedSegments[key]) return key;
    if (key === 'run' || key === 'walk') return this.bakedSegments.walk ? 'walk' : 'idle';
    if (key === 'special') return 'attack';
    if (key === 'hit') return 'idle';
    return 'idle';
  }

  update(dt) {
    if (this.mode === 'none') return;
    if (this.mode === 'named') {
      this.mixer.update(dt);
      const resolved = this._resolveNamedKey(this.currentState);
      const act = this.actions.get(resolved);
      if (act && act.loop === THREE.LoopOnce && act.paused === false && act.time >= act.getClip().duration - 0.02) {
        this.oneShotDone = true;
      }
    } else if (this.mode === 'baked') {
      const seg = this.bakedSegments[this.currentState] || this.bakedSegments.idle;
      const scale = this.speedScale || 1.0;
      this.localTime += dt * scale;
      const start = seg.from / GOBKIT_FPS;
      const dur = Math.max(0.05, (seg.to - seg.from) / GOBKIT_FPS);
      if (seg.loop) {
        this.mixer.setTime(start + (this.localTime % dur));
      } else {
        const clamped = Math.min(this.localTime, dur);
        this.mixer.setTime(start + clamped);
        if (this.localTime >= dur) {
          this.oneShotDone = true;
          if (!seg.hold) {
            this.play('idle', true);
          }
        }
      }
    }
  }
}
