export const MISSIONS = [
  {
    id: 1,
    worldId: 'medieval-kingdom',
    zoneId: 'town',
    difficulty: 1.0,
    gateLockedInitially: false,
    playerSpawn: { x: 0, y: 0.5, z: 12 },
    waves: [
      [
        { key: 'goblin_scout', pos: { x: -3, y: 0.5, z: 2 }, patrol: [{ x: -3, z: 4 }, { x: 4, z: 4 }] },
        { key: 'goblin_scout', pos: { x: 4, y: 0.5, z: 0 }, patrol: [{ x: 4, z: 2 }, { x: 4, z: -5 }] },
        { key: 'goblin_raider', pos: { x: 0, y: 0.5, z: -7 }, patrol: [{ x: -2, z: -7 }, { x: 2, z: -7 }] },
      ],
    ],
  },
  {
    id: 2,
    worldId: 'medieval-kingdom',
    zoneId: 'forest',
    difficulty: 1.05,
    gateLockedInitially: false,
    playerSpawn: { x: 0, y: 0.5, z: 40 },
    waves: [
      [
        { key: 'shadow_bat', pos: { x: -12, y: 0.5, z: 41 }, patrol: [{ x: -15, z: 42 }, { x: -8, z: 41 }] },
        { key: 'goblin_stalker', pos: { x: -22, y: 0.5, z: 39 }, patrol: [{ x: -25, z: 38 }, { x: -18, z: 41 }] },
        { key: 'armored_rhino', pos: { x: -27, y: 0.5, z: 28 }, patrol: [{ x: -28, z: 24 }, { x: -24, z: 31 }] },
        { key: 'shadow_bat', pos: { x: -30, y: 0.5, z: 22 }, patrol: [{ x: -32, z: 20 }, { x: -27, z: 25 }] },
      ],
    ],
  },
  {
    id: 3,
    worldId: 'medieval-kingdom',
    zoneId: 'town',
    difficulty: 1.15,
    gateLockedInitially: false,
    playerSpawn: { x: 0, y: 0.5, z: 14 },
    waves: [
      [
        { key: 'orc_legionary', pos: { x: -4, y: 0.5, z: 2 }, patrol: [{ x: -6, z: 2 }, { x: 4, z: 2 }] },
        { key: 'orc_legionary', pos: { x: 4, y: 0.5, z: 2 }, patrol: [{ x: 4, z: 6 }, { x: 4, z: -4 }] },
        { key: 'goblin_raider', pos: { x: 0, y: 0.5, z: -8 }, patrol: [{ x: -3, z: -8 }, { x: 3, z: -8 }] },
      ],
      [
        { key: 'orc_shieldbearer', pos: { x: 0, y: 0.5, z: -4 }, patrol: [{ x: -3, z: -4 }, { x: 3, z: -4 }] },
        { key: 'orc_legionary', pos: { x: -8, y: 0.5, z: 0 }, patrol: [{ x: -8, z: 4 }, { x: -8, z: -4 }] },
      ],
    ],
  },
  {
    id: 4,
    worldId: 'medieval-kingdom',
    zoneId: 'goblin_camp',
    difficulty: 1.25,
    gateLockedInitially: false,
    playerSpawn: { x: 24, y: 0.5, z: 24 },
    waves: [
      [
        { key: 'goblin_scout', pos: { x: 26, y: 0.5, z: 16 }, patrol: [{ x: 25, z: 18 }, { x: 29, z: 14 }] },
        { key: 'goblin_raider', pos: { x: 28, y: 0.5, z: 10 }, patrol: [{ x: 26, z: 11 }, { x: 31, z: 9 }] },
        { key: 'goblin_stalker', pos: { x: 32, y: 0.5, z: 14 }, patrol: [{ x: 31, z: 16 }, { x: 33, z: 12 }] },
        { key: 'goblin_shaman', pos: { x: 29, y: 0.5, z: 13 }, patrol: [{ x: 28, z: 13 }, { x: 31, z: 13 }] },
      ],
    ],
  },
  {
    id: 5,
    worldId: 'medieval-kingdom',
    zoneId: 'castle',
    difficulty: 1.3,
    gateLockedInitially: true, // Gate locks until wave 1 gatekeepers fall!
    playerSpawn: { x: 0, y: 0.5, z: 40 }, // Start across the stone arch bridge!
    waves: [
      [
        { key: 'orc_shieldbearer', pos: { x: -2, y: 0.5, z: 24 }, patrol: [{ x: -3, z: 24 }, { x: 3, z: 24 }] },
        { key: 'orc_legionary', pos: { x: 3, y: 0.5, z: 25 }, patrol: [{ x: 2, z: 26 }, { x: 5, z: 23 }] },
      ],
      [
        { key: 'orc_legionary', pos: { x: -3, y: 0.5, z: 13 }, patrol: [{ x: -5, z: 13 }, { x: 3, z: 13 }] },
        { key: 'orc_shieldbearer', pos: { x: 4, y: 0.5, z: 10 }, patrol: [{ x: 4, z: 12 }, { x: 4, z: 6 }] },
        { key: 'goblin_shaman', pos: { x: 0, y: 0.5, z: 4 }, patrol: [{ x: -2, z: 4 }, { x: 2, z: 4 }] },
      ],
    ],
  },
  {
    id: 6,
    worldId: 'tournament-arena',
    zoneId: 'tournament',
    difficulty: 1.2,
    gateLockedInitially: false,
    playerSpawn: { x: 0, y: 0.5, z: 9 },
    waves: [
      [
        { key: 'orc_legionary', pos: { x: -4, y: 0.5, z: -2 }, patrol: [{ x: -5, z: 2 }, { x: -2, z: -4 }] },
        { key: 'orc_shieldbearer', pos: { x: 4, y: 0.5, z: -2 }, patrol: [{ x: 5, z: 2 }, { x: 2, z: -4 }] },
      ],
      [
        { key: 'boss_juggernaut', pos: { x: 0, y: 0.5, z: -6 }, patrol: [{ x: -4, z: -5 }, { x: 4, z: -5 }] },
      ],
    ],
  },
  {
    id: 7,
    worldId: 'medieval-kingdom',
    zoneId: 'boss_arena',
    difficulty: 1.35,
    gateLockedInitially: false,
    playerSpawn: { x: -20, y: 0.5, z: -24 },
    waves: [
      [
        { key: 'orc_legionary', pos: { x: -27, y: 0.5, z: -25 }, patrol: [{ x: -25, z: -24 }, { x: -29, z: -28 }] },
        { key: 'armored_rhino', pos: { x: -31, y: 0.5, z: -29 }, patrol: [{ x: -29, z: -30 }, { x: -33, z: -26 }] },
      ],
      [
        { key: 'boss_orc_champion', pos: { x: -30, y: 0.5, z: -27 }, patrol: [{ x: -28, z: -27 }, { x: -32, z: -27 }] },
        { key: 'boss_werewolf', pos: { x: -27, y: 0.5, z: -30 }, patrol: [{ x: -26, z: -28 }, { x: -31, z: -30 }] },
      ],
    ],
  },
];

export const FREE_ROAM_SPAWNS = [
  { key: 'goblin_scout', pos: { x: 2, y: 0.5, z: -5 } },
  { key: 'goblin_raider_alt', pos: { x: 29, y: 0.5, z: 13 } },
  { key: 'goblin_chieftain', pos: { x: 32, y: 0.5, z: 11 } },
  { key: 'river_hippo', pos: { x: -12, y: 0.5, z: 31 } },
  { key: 'crimson_beast', pos: { x: -18, y: 0.5, z: 41 } },
  { key: 'shadow_bat', pos: { x: -24, y: 0.5, z: 38 } },
  { key: 'armored_rhino', pos: { x: -27, y: 0.5, z: 27 } },
  { key: 'orc_legionary', pos: { x: 28, y: 0.5, z: -18 } },
  { key: 'orc_shieldbearer', pos: { x: 29, y: 0.5, z: -14 } },
  { key: 'boss_werewolf', pos: { x: -30, y: 0.5, z: -27 } },
];

export class CampaignManager {
  constructor(worldManager, monsterManager, playerCtrl, cameraCtrl, onMissionState) {
    this.worldManager = worldManager;
    this.monsterManager = monsterManager;
    this.playerCtrl = playerCtrl;
    this.cameraCtrl = cameraCtrl;
    this.onMissionState = onMissionState;

    this.mode = 'campaign'; // 'campaign' | 'freeroam'
    this.currentMission = null;
    this.waveIndex = 0;
    this.totalEnemiesInMission = 0;
    this.killsInMission = 0;
    this.status = 'IDLE'; // IDLE, PLAYING, VICTORY, DEFEAT
  }

  async startMission(missionId, RAPIER, physicsWorld, quality) {
    const mission = MISSIONS.find((m) => m.id === missionId) || MISSIONS[0];
    this.mode = 'campaign';
    this.currentMission = mission;
    this.waveIndex = 0;
    this.killsInMission = 0;
    this.totalEnemiesInMission = mission.waves.reduce((sum, w) => sum + w.length, 0);
    this.status = 'PLAYING';

    this.monsterManager.clearAll();
    await this.worldManager.activateWorld(mission.worldId, RAPIER, physicsWorld, quality);
    this.worldManager.setCastleGateLocked(mission.gateLockedInitially);

    this.playerCtrl.resetForMission(mission.playerSpawn);
    await this._spawnCurrentWave();
  }

  async startFreeRoam(worldId, RAPIER, physicsWorld, quality) {
    this.mode = 'freeroam';
    this.currentMission = null;
    this.waveIndex = 0;
    this.killsInMission = 0;
    this.status = 'PLAYING';

    this.monsterManager.clearAll();
    await this.worldManager.activateWorld(worldId, RAPIER, physicsWorld, quality);
    this.worldManager.setCastleGateLocked(false);

    const spawn = worldId === 'tournament-arena' ? { x: 0, y: 0.5, z: 8 } : { x: 0, y: 0.5, z: 12 };
    this.playerCtrl.resetForMission(spawn);

    if (worldId === 'tournament-arena') {
      this.totalEnemiesInMission = 3;
      await this.monsterManager.spawnMonster('orc_legionary', { x: -4, y: 0.5, z: -2 }, [], 1.0, this._onMonsterEvent);
      await this.monsterManager.spawnMonster('orc_shieldbearer', { x: 4, y: 0.5, z: -2 }, [], 1.0, this._onMonsterEvent);
      await this.monsterManager.spawnMonster('boss_juggernaut', { x: 0, y: 0.5, z: -8 }, [], 1.0, this._onMonsterEvent);
    } else {
      this.totalEnemiesInMission = FREE_ROAM_SPAWNS.length;
      for (const s of FREE_ROAM_SPAWNS) {
        await this.monsterManager.spawnMonster(s.key, s.pos, [], 1.0, this._onMonsterEvent);
      }
    }
  }

  _onMonsterEvent = (eventType, monster) => {
    if (eventType === 'MONSTER_KILLED') {
      this.killsInMission++;
      if (this.onMissionState) {
        this.onMissionState('KILL', { monsterKey: monster.key, isBoss: monster.def.isBoss });
      }
    } else if (eventType === 'BOSS_PHASE_2') {
      if (this.onMissionState) {
        this.onMissionState('BOSS_PHASE_2', { nameEn: monster.def.nameEn, nameAr: monster.def.nameAr });
      }
    }
  };

  async _spawnCurrentWave() {
    if (!this.currentMission) return;
    const wave = this.currentMission.waves[this.waveIndex];
    if (!wave) return;

    let bossSpawned = null;
    for (const entry of wave) {
      const m = await this.monsterManager.spawnMonster(
        entry.key,
        entry.pos,
        entry.patrol || [],
        this.currentMission.difficulty,
        this._onMonsterEvent
      );
      if (m.def.isBoss) bossSpawned = m;
    }

    if (bossSpawned) {
      this.cameraCtrl.startBossCinematic(bossSpawned.group.position, 2.5);
    }
  }

  async update() {
    if (this.status !== 'PLAYING') return;

    if (this.playerCtrl.actionState === 'DEAD') {
      this.status = 'DEFEAT';
      if (this.onMissionState) this.onMissionState('DEFEAT', {});
      return;
    }

    const aliveCount = this.monsterManager.monsters.filter((m) => m.state !== 'DEATH').length;

    if (this.mode === 'campaign' && this.currentMission && aliveCount === 0) {
      if (this.waveIndex + 1 < this.currentMission.waves.length) {
        this.waveIndex++;
        // Unlock castle gate in Mission 5 after wave 1 gatekeepers are defeated!
        if (this.currentMission.id === 5 && this.waveIndex === 1) {
          this.worldManager.setCastleGateLocked(false);
          if (this.onMissionState) this.onMissionState('GATE_UNLOCKED', {});
        }
        await this._spawnCurrentWave();
      } else {
        this.status = 'VICTORY';
        if (this.onMissionState) {
          this.onMissionState('VICTORY', { missionId: this.currentMission.id });
        }
      }
    }
  }
}
