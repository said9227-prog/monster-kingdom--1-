import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { buildWorldPhysics } from './physicsBuilder.js';

export const WORLD_CONFIGS = {
  'medieval-kingdom': {
    id: 'medieval-kingdom',
    path: './worlds/medieval-kingdom/model.glb',
    skyColor: 0x87b5d8,
    fogColor: 0x9fc2d9,
    fogNear: 38,
    fogFar: 115,
    ambientIntensity: 0.75,
    sunPosition: [32, 48, 28],
    playerDefaultSpawn: [0, 0.5, 11],
  },
  'tournament-arena': {
    id: 'tournament-arena',
    path: './worlds/tournament-arena/model.glb',
    skyColor: 0xc29e74,
    fogColor: 0xd0b08a,
    fogNear: 28,
    fogFar: 90,
    ambientIntensity: 0.85,
    sunPosition: [18, 36, 22],
    playerDefaultSpawn: [0, 0.5, 8],
  },
};

export const REALM_ZONES = [
  {
    id: 'town',
    nameEn: 'Walled Town',
    nameAr: 'المدينة المسورة',
    worldId: 'medieval-kingdom',
    center: { x: 0, z: 2 },
    radius: 17,
    spawnPoint: { x: 0, y: 0.5, z: 8 },
    waypoints: [
      { x: 0, z: 12 }, { x: 0, z: 2 }, { x: 0, z: -8 },
      { x: -8, z: 0 }, { x: 10, z: 4 }, { x: 16, z: 8 },
    ],
  },
  {
    id: 'castle',
    nameEn: 'Castle Gate & Ramparts',
    nameAr: 'بوابة القلعة والأسوار',
    worldId: 'medieval-kingdom',
    center: { x: 0, z: 20 },
    radius: 9,
    spawnPoint: { x: 0, y: 0.5, z: 25 },
    waypoints: [
      { x: 0, z: 24 }, { x: 0, z: 20 }, { x: 0, z: 15 }, { x: -6, z: 16.4 },
    ],
  },
  {
    id: 'river',
    nameEn: 'River & Bridges',
    nameAr: 'النهر والجسور',
    worldId: 'medieval-kingdom',
    center: { x: 0, z: 34 },
    radius: 14,
    spawnPoint: { x: 0, y: 0.8, z: 29 },
    waypoints: [
      { x: 0, z: 28 }, { x: 0, z: 34 }, { x: 0, z: 40 },
      { x: -16, z: 34 }, { x: 16, z: 34 },
    ],
  },
  {
    id: 'forest',
    nameEn: 'Whispering Forest',
    nameAr: 'الغابة الغامضة',
    worldId: 'medieval-kingdom',
    center: { x: -24, z: 36 },
    radius: 16,
    spawnPoint: { x: 0, y: 0.5, z: 41 },
    waypoints: [
      { x: 0, z: 41 }, { x: -12, z: 42 }, { x: -24, z: 38 },
      { x: -28, z: 26 }, { x: 12, z: 42 },
    ],
  },
  {
    id: 'goblin_camp',
    nameEn: 'Goblin Camp',
    nameAr: 'مخيم الغوبلن',
    worldId: 'medieval-kingdom',
    center: { x: 30, z: 13 },
    radius: 10,
    spawnPoint: { x: 24, y: 0.5, z: 22 },
    waypoints: [
      { x: 24, z: 18 }, { x: 28, z: 14 }, { x: 32, z: 13 }, { x: 28, z: 8 },
    ],
  },
  {
    id: 'mines',
    nameEn: 'Ancient Mines',
    nameAr: 'المناجم القديمة',
    worldId: 'medieval-kingdom',
    center: { x: 29, z: -18 },
    radius: 11,
    spawnPoint: { x: 26, y: 0.5, z: -8 },
    waypoints: [
      { x: 26, z: -10 }, { x: 28, z: -16 }, { x: 30, z: -21 },
    ],
  },
  {
    id: 'boss_arena',
    nameEn: 'Stone Circle Boss Sanctum',
    nameAr: 'حلبة الزعيم الحجرية',
    worldId: 'medieval-kingdom',
    center: { x: -30, z: -27 },
    radius: 11,
    spawnPoint: { x: -24, y: 0.5, z: -18 },
    waypoints: [
      { x: -26, z: -22 }, { x: -30, z: -27 }, { x: -28, z: -30 },
    ],
  },
  {
    id: 'tournament',
    nameEn: 'Tournament Jousting Ground',
    nameAr: 'ساحة المبارزة الملكية',
    worldId: 'tournament-arena',
    center: { x: 0, z: 0 },
    radius: 16,
    spawnPoint: { x: 0, y: 0.5, z: 8 },
    waypoints: [
      { x: 0, z: 6 }, { x: 6, z: 3 }, { -6, z: 3 }, { 0, z: -6 },
    ],
  },
];

export class WorldManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.cachedWorlds = new Map();
    this.activeWorldId = null;
    this.activeWorldRoot = null;
    this.physicsMeta = null;
    this.gateBarrierMesh = null;
    this.gateLocked = false;
    this.worldStats = {};
  }

  async preloadWorld(worldId) {
    if (this.cachedWorlds.has(worldId)) {
      return this.cachedWorlds.get(worldId);
    }
    const cfg = WORLD_CONFIGS[worldId];
    if (!cfg) throw new Error(`Unknown worldId: ${worldId}`);

    const gltf = await this.loader.loadAsync(cfg.path);
    const root = gltf.scene;
    root.name = `world_${worldId}`;

    let meshCount = 0;
    let nodeCount = 0;
    const namedGroups = new Set();
    root.traverse((obj) => {
      nodeCount++;
      if (obj.name && !obj.name.includes('/')) {
        namedGroups.add(obj.name);
      }
      if (obj.isMesh) {
        meshCount++;
        obj.castShadow = true;
        obj.receiveShadow = true;
        // Performance: avoid shadow casting on small flat ground/grass tiles
        const n = (obj.name || obj.parent?.name || '').toLowerCase();
        if (
          n.includes('grass-ground') ||
          n.includes('cobble') ||
          n.includes('plaza') ||
          n.includes('dirt-path') ||
          n.includes('river') ||
          n.includes('tournament-ground') ||
          n.includes('flower') ||
          n.includes('fern')
        ) {
          obj.castShadow = false;
        }
      }
    });

    const entry = {
      gltf,
      root,
      stats: {
        worldId,
        path: cfg.path,
        animations: gltf.animations.length,
        meshes: meshCount,
        nodes: nodeCount,
        placedObjects: namedGroups.size,
      },
    };
    this.cachedWorlds.set(worldId, entry);
    this.worldStats[worldId] = entry.stats;
    return entry;
  }

  async activateWorld(worldId, RAPIER, physicsWorld, quality = 'HIGH') {
    const entry = await this.preloadWorld(worldId);
    const cfg = WORLD_CONFIGS[worldId];

    if (this.activeWorldRoot && this.activeWorldRoot.parent) {
      this.scene.remove(this.activeWorldRoot);
    }
    if (this.gateBarrierMesh && this.gateBarrierMesh.parent) {
      this.scene.remove(this.gateBarrierMesh);
    }

    this.activeWorldId = worldId;
    this.activeWorldRoot = entry.root;
    this.scene.add(this.activeWorldRoot);

    this.scene.background = new THREE.Color(cfg.skyColor);
    this.scene.fog = new THREE.Fog(cfg.fogColor, cfg.fogNear, cfg.fogFar);

    this.applyQuality(quality);

    // Build Rapier colliders from actual loaded GLB scene geometry
    this.physicsMeta = buildWorldPhysics(RAPIER, physicsWorld, this.activeWorldRoot, worldId);

    // Visual indicator at gatehouse archway when locked (Mission 5)
    if (worldId === 'medieval-kingdom') {
      const geo = new THREE.BoxGeometry(2.4, 3.2, 0.25);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd9381e,
        emissive: 0x7a1208,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.52,
        roughness: 0.4,
      });
      this.gateBarrierMesh = new THREE.Mesh(geo, mat);
      this.gateBarrierMesh.position.set(0, 1.6, 20);
      this.gateBarrierMesh.visible = false;
      this.scene.add(this.gateBarrierMesh);
    }

    return {
      worldStats: entry.stats,
      physicsStats: this.physicsMeta.stats,
    };
  }

  setCastleGateLocked(locked) {
    this.gateLocked = Boolean(locked);
    if (this.physicsMeta) {
      this.physicsMeta.setGateLocked(this.gateLocked);
    }
    if (this.gateBarrierMesh) {
      this.gateBarrierMesh.visible = this.gateLocked;
    }
  }

  applyQuality(quality) {
    if (!this.activeWorldRoot) return;
    const enableShadows = quality !== 'LOW';
    this.activeWorldRoot.traverse((obj) => {
      if (obj.isMesh) {
        obj.receiveShadow = enableShadows;
        if (quality === 'LOW') {
          obj.castShadow = false;
        }
      }
    });
  }

  getZoneAt(x, z) {
    if (this.activeWorldId === 'tournament-arena') {
      return REALM_ZONES.find((zDef) => zDef.id === 'tournament');
    }
    let best = REALM_ZONES[0];
    let bestDist = Infinity;
    for (const zone of REALM_ZONES) {
      if (zone.worldId !== this.activeWorldId) continue;
      const dx = x - zone.center.x;
      const dz = z - zone.center.z;
      const d = Math.hypot(dx, dz);
      if (d <= zone.radius && d < bestDist) {
        best = zone;
        bestDist = d;
      }
    }
    if (bestDist === Infinity) {
      // Fallback nearest
      for (const zone of REALM_ZONES) {
        if (zone.worldId !== this.activeWorldId) continue;
        const d = Math.hypot(x - zone.center.x, z - zone.center.z);
        if (d < bestDist) {
          best = zone;
          bestDist = d;
        }
      }
    }
    return best;
  }
}
