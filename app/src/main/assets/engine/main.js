import * as THREE from '../vendor/three.module.min.js';
import RAPIER from '../vendor/rapier.es.js';
import { WorldManager } from './worldManager.js';
import { PlayerController } from './playerController.js';
import { MonsterManager } from './monsterAI.js';
import { CameraController } from './cameraController.js';
import { CampaignManager } from './campaignManager.js';

class MonsterKingdomEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.rapierWorld = null;

    this.worldManager = null;
    this.playerCtrl = null;
    this.monsterManager = null;
    this.cameraCtrl = null;
    this.campaign = null;

    this.paused = false;
    this.previewMode = true;
    this.previewAngle = 0.4;
    this.quality = 'HIGH';
    this.dirLight = null;
    this.particles = [];
    this.clock = new THREE.Clock();
    this.telemetryTimer = 0;
    this.fpsSamples = [];
    this.currentFps = 60;
    this.ready = false;
    this.lastEventToast = null;

    // Touch camera orbit & pinch zoom
    this.activeTouches = new Map();
    this.lastPinchDist = null;
  }

  _updateSize() {
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth || 800);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight || 600);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
  }

  async init() {
    await RAPIER.init();

    const initW = Math.max(1, this.canvas.clientWidth || window.innerWidth || 800);
    const initH = Math.max(1, this.canvas.clientHeight || window.innerHeight || 600);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(initW, initH, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, initW / initH, 0.2, 240);
    this.camera.position.set(0, 14, 34);
    this.camera.lookAt(0, 1, 8);

    // Medieval daylight + fill lighting
    const hemi = new THREE.HemisphereLight(0xdceeff, 0x4b3b2b, 0.9);
    this.scene.add(hemi);

    this.dirLight = new THREE.DirectionalLight(0xfff1d6, 1.9);
    this.dirLight.position.set(28, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.set(1024, 1024);
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 130;
    const d = 42;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    this.rapierWorld = new RAPIER.World({ x: 0, y: -20.0, z: 0 });
    this.worldManager = new WorldManager(this.scene);
    this.playerCtrl = new PlayerController(this.scene, RAPIER, this.rapierWorld);
    this.monsterManager = new MonsterManager(this.scene, RAPIER, this.rapierWorld);
    this.cameraCtrl = new CameraController(this.camera, RAPIER, this.rapierWorld);

    this.campaign = new CampaignManager(
      this.worldManager,
      this.monsterManager,
      this.playerCtrl,
      this.cameraCtrl,
      (type, data) => this._emitEvent(type, data)
    );

    // Pre-initialize warrior and default medieval kingdom world
    await this.playerCtrl.init({ x: 0, y: 0.5, z: 12 });
    await this.worldManager.preloadWorld('medieval-kingdom');
    await this.campaign.startMission(1, RAPIER, this.rapierWorld, this.quality);

    this.applyQuality('HIGH');
    this._bindInput();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this._updateSize()).observe(this.canvas);
    }
    this.ready = true;
    this._emitEvent('ENGINE_READY', this.getDiagnostics());
    this._loop();
  }

  _bindInput() {
    window.addEventListener('resize', () => this._updateSize());

    // Touch drag for 360 camera rotation + 2-finger pinch zoom
    this.canvas.addEventListener('pointerdown', (e) => {
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activeTouches.size === 2) {
        const pts = [...this.activeTouches.values()];
        this.lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.activeTouches.has(e.pointerId)) return;
      const prev = this.activeTouches.get(e.pointerId);
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activeTouches.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (this.previewMode) {
          this.previewAngle += dx * 0.006;
        } else {
          this.cameraCtrl.rotateBy(dx * 0.0075, dy * 0.0055);
        }
      } else if (this.activeTouches.size === 2) {
        const pts = [...this.activeTouches.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.lastPinchDist !== null) {
          this.cameraCtrl.zoomBy((this.lastPinchDist - dist) * 0.02);
        }
        this.lastPinchDist = dist;
      }
    });

    const endTouch = (e) => {
      this.activeTouches.delete(e.pointerId);
      if (this.activeTouches.size < 2) this.lastPinchDist = null;
    };
    this.canvas.addEventListener('pointerup', endTouch);
    this.canvas.addEventListener('pointercancel', endTouch);
    this.canvas.addEventListener('wheel', (e) => {
      this.cameraCtrl.zoomBy(e.deltaY * 0.005);
    }, { passive: true });
  }

  _resetPhysicsWorld() {
    this.monsterManager.clearAll();
    this.rapierWorld = new RAPIER.World({ x: 0, y: -20.0, z: 0 });
    this.playerCtrl.physicsWorld = this.rapierWorld;
    this.monsterManager.physicsWorld = this.rapierWorld;
    this.cameraCtrl.setPhysicsWorld(this.rapierWorld);
  }

  async previewWorld(worldId = 'medieval-kingdom') {
    this.paused = false;
    this.previewMode = true;
    if (this.worldManager.activeWorldId !== worldId) {
      this._resetPhysicsWorld();
      await this.campaign.startFreeRoam(worldId, RAPIER, this.rapierWorld, this.quality);
    }
    this._emitTelemetry();
  }

  async startMission(missionId) {
    this.paused = false;
    this.previewMode = false;
    this._resetPhysicsWorld();
    await this.campaign.startMission(missionId, RAPIER, this.rapierWorld, this.quality);
    this._emitTelemetry();
  }

  async startFreeRoam(worldId) {
    this.paused = false;
    this.previewMode = false;
    this._resetPhysicsWorld();
    await this.campaign.startFreeRoam(worldId, RAPIER, this.rapierWorld, this.quality);
    this._emitTelemetry();
  }

  teleportToZone(zoneId) {
    const spawns = {
      town: { x: 0, y: 0.5, z: 8 },
      castle: { x: 0, y: 0.5, z: 24 },
      river: { x: 0, y: 0.8, z: 34 },
      forest: { x: -20, y: 0.5, z: 40 },
      goblin_camp: { x: 25, y: 0.5, z: 16 },
      mines: { x: 27, y: 0.5, z: -12 },
      boss_arena: { x: -24, y: 0.5, z: -22 },
      tournament: { x: 0, y: 0.5, z: 8 },
    };
    const sp = spawns[zoneId];
    if (!sp) return;
    if (zoneId === 'tournament' && this.worldManager.activeWorldId !== 'tournament-arena') {
      this.startFreeRoam('tournament-arena');
      return;
    }
    if (zoneId !== 'tournament' && this.worldManager.activeWorldId !== 'medieval-kingdom') {
      this.startFreeRoam('medieval-kingdom').then(() => {
        this.playerCtrl.createPhysicsBody(sp);
      });
      return;
    }
    this.playerCtrl.createPhysicsBody(sp);
  }

  applyQuality(q) {
    this.quality = q;
    if (!this.renderer) return;
    if (q === 'LOW') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
      this.renderer.shadowMap.enabled = false;
    } else if (q === 'MEDIUM') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
      this.renderer.shadowMap.enabled = true;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      this.renderer.shadowMap.enabled = true;
    }
    this.worldManager?.applyQuality(q);
  }

  _spawnHitSparks(pos, colorHex = 0xffca28, count = 8) {
    const geo = new THREE.SphereGeometry(0.08, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5.5,
        Math.random() * 4.5 + 1.5,
        (Math.random() - 0.5) * 5.5
      );
      this.scene.add(p);
      this.particles.push({ mesh: p, vel, life: 0.42 });
    }
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.setScalar(Math.max(0.01, p.life * 2.2));
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  _emitEvent(type, data) {
    if (window.AndroidBridge && window.AndroidBridge.onGameEvent) {
      window.AndroidBridge.onGameEvent(JSON.stringify({ type, data }));
    }
  }

  _emitTelemetry() {
    if (!window.AndroidBridge || !window.AndroidBridge.onTelemetry) return;
    const pPos = this.playerCtrl.group.position;
    const zone = this.worldManager.getZoneAt(pPos.x, pPos.z);
    const aliveMonsters = this.monsterManager.monsters.filter((m) => m.state !== 'DEATH');
    const activeBoss = aliveMonsters.find((m) => m.def.isBoss);

    const payload = {
      hp: Math.round(this.playerCtrl.hp),
      maxHp: this.playerCtrl.maxHp,
      stamina: Math.round(this.playerCtrl.stamina),
      maxStamina: this.playerCtrl.maxStamina,
      combo: this.playerCtrl.comboStep,
      weaponId: this.playerCtrl.weaponId,
      playerX: Number(pPos.x.toFixed(2)),
      playerY: Number(pPos.y.toFixed(2)),
      playerZ: Number(pPos.z.toFixed(2)),
      playerYaw: Number(this.playerCtrl.facingYaw.toFixed(2)),
      zoneId: zone?.id || 'town',
      zoneNameEn: zone?.nameEn || 'Kingdom',
      zoneNameAr: zone?.nameAr || 'المملكة',
      worldId: this.worldManager.activeWorldId,
      gateLocked: this.worldManager.gateLocked,
      lockOn: this.cameraCtrl.lockOnEnabled,
      enemiesAlive: aliveMonsters.length,
      kills: this.campaign.killsInMission,
      totalEnemies: this.campaign.totalEnemiesInMission,
      missionStatus: this.campaign.status,
      fps: this.currentFps,
      boss: activeBoss
        ? {
            nameEn: activeBoss.def.nameEn,
            nameAr: activeBoss.def.nameAr,
            hp: Math.round(activeBoss.hp),
            maxHp: activeBoss.maxHp,
            phase: activeBoss.phase,
            state: activeBoss.state,
          }
        : null,
      radarMonsters: aliveMonsters.map((m) => ({
        x: Number(m.group.position.x.toFixed(1)),
        z: Number(m.group.position.z.toFixed(1)),
        isBoss: m.def.isBoss,
      })),
    };

    window.AndroidBridge.onTelemetry(JSON.stringify(payload));
  }

  getDiagnostics() {
    return {
      ready: this.ready,
      worldsCached: [...this.worldManager.cachedWorlds.keys()],
      worldStats: this.worldManager.worldStats,
      physicsStats: this.worldManager.physicsMeta?.stats || null,
      playerJoints: this.playerCtrl.modelRoot ? 13 : 0,
      activeMonsters: this.monsterManager.monsters.length,
      fps: this.currentFps,
    };
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this.clock.getDelta());

    if (dt > 0) {
      this.fpsSamples.push(1 / dt);
      if (this.fpsSamples.length > 20) this.fpsSamples.shift();
      this.currentFps = Math.round(
        this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length
      );
    }

    if (!this.paused && this.ready) {
      if (this.previewMode) {
        this.previewAngle += dt * 0.2;
        this.playerCtrl.animator?.update(dt);
        for (const m of this.monsterManager.monsters) {
          m.animator?.update(dt);
        }
        const isArena = this.worldManager.activeWorldId === 'tournament-arena';
        const targetX = 0;
        const targetY = isArena ? 1.5 : 2.5;
        const targetZ = isArena ? 0 : 12;
        const radius = isArena ? 19 : 34;
        const height = isArena ? 10.5 : 17.5;
        this.camera.position.set(
          targetX + Math.sin(this.previewAngle) * radius,
          height,
          targetZ + Math.cos(this.previewAngle) * radius
        );
        this.camera.lookAt(targetX, targetY, targetZ);
      } else {
        this.rapierWorld.step();
        this.playerCtrl.update(dt, this.cameraCtrl.yaw);

        // Check warrior weapon hitbox against monsters
        const hitbox = this.playerCtrl.getActiveAttackHitbox();
        if (hitbox) {
          const hits = this.monsterManager.applyPlayerHit(hitbox);
          for (const h of hits) {
            const sparkPos = h.monster.group.position.clone().add(new THREE.Vector3(0, 1.1, 0));
            this._spawnHitSparks(sparkPos, h.isCrit ? 0xff5722 : 0xffd54f, h.isCrit ? 12 : 7);
            this._emitEvent('HIT_MONSTER', { damage: h.damage, isCrit: h.isCrit });
          }
        }

        this.monsterManager.update(dt, this.playerCtrl, this.camera.position, (attacker, res) => {
          const pSpark = this.playerCtrl.group.position.clone().add(new THREE.Vector3(0, 1.1, 0));
          this._spawnHitSparks(pSpark, res.blocked ? 0x4fc3f7 : 0xe53935, 8);
        });

        this.cameraCtrl.update(
          dt,
          this.playerCtrl.group.position,
          this.playerCtrl.collider,
          this.monsterManager.monsters
        );
        this._updateParticles(dt);
        this.campaign.update();
      }
    }

    this.renderer.render(this.scene, this.camera);

    this.telemetryTimer += dt;
    if (this.telemetryTimer >= 0.08) {
      this.telemetryTimer = 0;
      this._emitTelemetry();
    }
  };
}

const engine = new MonsterKingdomEngine();
window.GameAPI = {
  command(cmd, payloadJson) {
    const payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson || '{}') : (payloadJson || {});
    if (cmd === 'PAUSE') engine.paused = true;
    else if (cmd === 'RESUME') { engine.paused = false; engine.previewMode = false; }
    else if (cmd === 'PREVIEW_WORLD') engine.previewWorld(payload.worldId || 'medieval-kingdom');
    else if (cmd === 'SET_WEAPON') engine.playerCtrl?.setWeapon(payload.weaponId);
    else if (cmd === 'SET_QUALITY') engine.applyQuality(payload.quality);
    else if (cmd === 'ZOOM') engine.cameraCtrl?.zoomBy(payload.delta || 0);
    else if (cmd === 'ROTATE_CAM') engine.cameraCtrl?.rotateBy(payload.dyaw || 0, payload.dpitch || 0);
    else if (cmd === 'TOGGLE_LOCK_ON') engine.cameraCtrl?.toggleLockOn();
    else if (cmd === 'START_MISSION') engine.startMission(payload.missionId || 1);
    else if (cmd === 'START_FREE_ROAM') engine.startFreeRoam(payload.worldId || 'medieval-kingdom');
    else if (cmd === 'TELEPORT_ZONE') engine.teleportToZone(payload.zoneId);
    else engine.playerCtrl?.handleCommand(cmd, payload);
  },
  diagnostics() {
    return JSON.stringify(engine.getDiagnostics());
  },
};

engine.init().catch((err) => {
  console.error('Engine init error:', err);
  if (window.AndroidBridge?.onGameEvent) {
    window.AndroidBridge.onGameEvent(JSON.stringify({ type: 'ERROR', data: { message: String(err) } }));
  }
});
