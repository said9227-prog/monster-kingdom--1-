import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import * as SkeletonUtils from '../vendor/SkeletonUtils.js';
import { CharacterAnimator } from './animator.js';
import { MONSTER_REGISTRY } from './monsterRegistry.js';

export const AI_STATES = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  DETECT_PLAYER: 'DETECT_PLAYER',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  HURT: 'HURT',
  STUN: 'STUN',
  RETREAT: 'RETREAT',
  RETURN_HOME: 'RETURN_HOME',
  DEATH: 'DEATH',
};

export class MonsterManager {
  constructor(scene, RAPIER, physicsWorld) {
    this.scene = scene;
    this.RAPIER = RAPIER;
    this.physicsWorld = physicsWorld;
    this.loader = new GLTFLoader();
    this.modelCache = new Map();
    this.monsters = [];
    this.nextId = 1;
  }

  async _loadBaseModel(monsterKey) {
    if (this.modelCache.has(monsterKey)) {
      return this.modelCache.get(monsterKey);
    }
    const def = MONSTER_REGISTRY[monsterKey];
    if (!def) throw new Error(`Unknown monster: ${monsterKey}`);
    const gltf = await this.loader.loadAsync(def.path);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const normScale = def.targetHeight / Math.max(0.1, size.y);

    const entry = {
      gltf,
      normScale,
      rawBox: box,
      skeletonJoints: this._countJoints(gltf.scene),
      clips: gltf.animations.map((a) => a.name),
    };
    this.modelCache.set(monsterKey, entry);
    return entry;
  }

  _countJoints(root) {
    let joints = 0;
    root.traverse((o) => {
      if (o.isBone) joints++;
    });
    return joints;
  }

  clearAll() {
    for (const m of this.monsters) {
      if (m.group.parent) this.scene.remove(m.group);
      if (m.charController) {
        try { this.physicsWorld.removeCharacterController(m.charController); } catch (_) {}
      }
      if (m.rigidBody) {
        try { this.physicsWorld.removeRigidBody(m.rigidBody); } catch (_) {}
      }
    }
    this.monsters = [];
  }

  async spawnMonster(monsterKey, spawnPos, patrolPoints = [], difficultyScale = 1.0, onEvent = null) {
    const def = MONSTER_REGISTRY[monsterKey];
    const cached = await this._loadBaseModel(monsterKey);

    const clone = SkeletonUtils.clone(cached.gltf.scene);
    clone.scale.setScalar(cached.normScale);
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    clone.position.set(-center.x, -scaledBox.min.y, -center.z);

    clone.traverse((c) => {
      if (c.isMesh || c.isSkinnedMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.frustumCulled = false; // Required for animated SkinnedMesh
      }
    });

    const group = new THREE.Group();
    group.name = `monster_${monsterKey}_${this.nextId}`;
    group.add(clone);
    group.position.set(spawnPos.x, spawnPos.y || 0, spawnPos.z);
    this.scene.add(group);

    // Floating 3D HP bar above monster
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(def.isBoss ? 1.8 : 1.0, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x1a120e, side: THREE.DoubleSide })
    );
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(def.isBoss ? 1.74 : 0.94, 0.08),
      new THREE.MeshBasicMaterial({ color: def.isBoss ? 0xff3d00 : 0xe53935, side: THREE.DoubleSide })
    );
    hpFill.position.z = 0.01;
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, def.targetHeight + 0.38, 0);
    hpGroup.add(hpBg);
    hpGroup.add(hpFill);
    group.add(hpGroup);

    // Boss Phase 2 fiery aura ring
    let auraMesh = null;
    if (def.isBoss) {
      const auraGeo = new THREE.RingGeometry(1.1, 1.55, 24);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff3d00,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.rotation.x = -Math.PI / 2;
      auraMesh.position.y = 0.08;
      auraMesh.visible = false;
      group.add(auraMesh);
    }

    const animator = new CharacterAnimator(clone, cached.gltf.animations, def.animMeta);

    // Rapier Capsule Collider + Kinematic Character Controller
    const radius = def.isBoss ? 0.65 : 0.36;
    const halfH = Math.max(0.35, def.targetHeight * 0.32);
    const centerOffset = halfH + radius;
    const rbDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawnPos.x, (spawnPos.y || 0) + centerOffset, spawnPos.z);
    const rigidBody = this.physicsWorld.createRigidBody(rbDesc);
    const collider = this.physicsWorld.createCollider(
      this.RAPIER.ColliderDesc.capsule(halfH, radius),
      rigidBody
    );
    const charController = this.physicsWorld.createCharacterController(0.05);
    charController.enableAutostep(0.55, 0.25, true);
    charController.enableSnapToGround(0.35);

    const maxHp = Math.round(def.maxHp * difficultyScale);
    const monster = {
      id: this.nextId++,
      key: monsterKey,
      def,
      group,
      model: clone,
      hpGroup,
      hpFill,
      auraMesh,
      animator,
      rigidBody,
      collider,
      charController,
      centerOffset,
      homePos: new THREE.Vector3(spawnPos.x, spawnPos.y || 0, spawnPos.z),
      patrolPoints: patrolPoints.length > 0 ? patrolPoints : [
        { x: spawnPos.x + 3.5, z: spawnPos.z + 2 },
        { x: spawnPos.x - 3.5, z: spawnPos.z - 2 },
      ],
      patrolIdx: 0,
      state: AI_STATES.PATROL,
      stateTimer: 0,
      hp: maxHp,
      maxHp,
      damage: Math.round(def.damage * difficultyScale),
      defense: def.defense,
      speed: def.speed,
      attackRange: def.attackRange,
      detectRange: def.detectRange,
      chaseRange: def.chaseRange,
      attackCooldown: 0.4,
      velocityY: 0,
      facingYaw: 0,
      phase: 1,
      hitAppliedThisAttack: false,
      currentAttackType: def.attacks[0],
      knockbackVel: new THREE.Vector3(),
      onEvent,
      despawnTimer: 0,
      clips: cached.clips,
      skeletonJoints: cached.skeletonJoints,
    };

    this.monsters.push(monster);
    return monster;
  }

  applyPlayerHit(hitbox) {
    const hits = [];
    for (const m of this.monsters) {
      if (m.state === AI_STATES.DEATH) continue;
      const dist = m.group.position.distanceTo(hitbox.center);
      const hitRadius = hitbox.radius + (m.def.isBoss ? 0.95 : 0.55);
      if (dist <= hitRadius) {
        let dmg = Math.max(1, hitbox.damage - m.defense);
        if (m.state === AI_STATES.DEFEND) {
          dmg = Math.max(1, Math.round(dmg * 0.35));
        }
        m.hp = Math.max(0, m.hp - dmg);

        // Knockback
        const push = new THREE.Vector3().subVectors(m.group.position, hitbox.center);
        push.y = 0;
        if (push.lengthSq() > 0.001) {
          const resist = m.def.hitResistance || 0;
          push.normalize().multiplyScalar(hitbox.knockback * (1 - resist));
          m.knockbackVel.copy(push);
        }

        // Boss Phase 2 transition at <= 50% HP!
        if (m.def.isBoss && m.phase === 1 && m.hp > 0 && m.hp <= m.maxHp * 0.5) {
          m.phase = 2;
          m.speed *= 1.38;
          m.damage = Math.round(m.damage * 1.3);
          m.state = AI_STATES.ATTACK;
          m.currentAttackType = 'Roar';
          m.stateTimer = 0.85;
          m.hitAppliedThisAttack = false;
          m.animator.play('special', true, 1.25);
          if (m.auraMesh) m.auraMesh.visible = true;
          if (m.onEvent) m.onEvent('BOSS_PHASE_2', m);
        }

        if (m.hp <= 0) {
          m.state = AI_STATES.DEATH;
          m.despawnTimer = 2.6;
          m.animator.play('death', true);
          m.collider.setEnabled(false);
          if (m.onEvent) m.onEvent('MONSTER_KILLED', m);
        } else if (!m.def.isBoss || Math.random() > (m.def.hitResistance || 0)) {
          if (m.state !== AI_STATES.DEFEND && m.state !== AI_STATES.STUN) {
            m.state = hitbox.isCrit && Math.random() < 0.35 ? AI_STATES.STUN : AI_STATES.HURT;
            m.stateTimer = m.state === AI_STATES.STUN ? 1.1 : 0.32;
            m.animator.play('hit', true);
          }
        }

        hits.push({ monster: m, damage: dmg, isCrit: hitbox.isCrit });
      }
    }
    return hits;
  }

  _steerAroundObstacles(m, dirX, dirZ) {
    // Cast 3 short forward feeler rays in Rapier to avoid walls & buildings
    const origin = {
      x: m.group.position.x,
      y: m.group.position.y + 0.9,
      z: m.group.position.z,
    };
    const rayLen = 1.6;
    const baseAngle = Math.atan2(dirX, dirZ);

    const isBlocked = (angle) => {
      const rx = Math.sin(angle);
      const rz = Math.cos(angle);
      const ray = new this.RAPIER.Ray(origin, { x: rx, y: 0, z: rz });
      const hit = this.physicsWorld.castRay(ray, rayLen, true, undefined, undefined, m.collider);
      return hit !== null && hit.timeOfImpact < rayLen;
    };

    if (!isBlocked(baseAngle)) return { x: dirX, z: dirZ };
    const offsets = [0.55, -0.55, 1.05, -1.05, 1.5, -1.5];
    for (const off of offsets) {
      const a = baseAngle + off;
      if (!isBlocked(a)) {
        return { x: Math.sin(a), z: Math.cos(a) };
      }
    }
    return { x: dirX, z: dirZ };
  }

  update(dt, playerCtrl, cameraPos, onPlayerHit) {
    const playerPos = playerCtrl.group.position;
    const playerAlive = playerCtrl.actionState !== 'DEAD';

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      // Keep floating HP bar facing camera
      if (m.hpGroup && cameraPos) {
        m.hpGroup.lookAt(cameraPos);
        const ratio = Math.max(0.001, m.hp / m.maxHp);
        m.hpFill.scale.x = ratio;
        m.hpFill.position.x = -(1 - ratio) * (m.def.isBoss ? 0.87 : 0.47);
        m.hpGroup.visible = m.state !== AI_STATES.DEATH;
      }

      if (m.auraMesh && m.auraMesh.visible) {
        m.auraMesh.rotation.z += dt * 2.2;
      }

      if (m.state === AI_STATES.DEATH) {
        m.animator.update(dt);
        m.despawnTimer -= dt;
        if (m.despawnTimer <= 0) {
          if (m.group.parent) this.scene.remove(m.group);
          try { this.physicsWorld.removeCharacterController(m.charController); } catch (_) {}
          try { this.physicsWorld.removeRigidBody(m.rigidBody); } catch (_) {}
          this.monsters.splice(i, 1);
        }
        continue;
      }

      m.attackCooldown = Math.max(0, m.attackCooldown - dt);
      if (m.stateTimer > 0) m.stateTimer -= dt;

      const distToPlayer = m.group.position.distanceTo(playerPos);
      const distToHome = m.group.position.distanceTo(m.homePos);

      let moveVx = 0;
      let moveVz = 0;

      // 11-State AI Machine
      switch (m.state) {
        case AI_STATES.HURT:
        case AI_STATES.STUN:
        case AI_STATES.DEFEND:
          if (m.stateTimer <= 0) {
            m.state = distToPlayer < m.detectRange ? AI_STATES.CHASE : AI_STATES.PATROL;
          }
          break;

        case AI_STATES.IDLE:
          m.animator.play('idle');
          if (playerAlive && distToPlayer <= m.detectRange) {
            m.state = AI_STATES.DETECT_PLAYER;
            m.stateTimer = 0.35;
          } else if (m.stateTimer <= 0) {
            m.state = AI_STATES.PATROL;
          }
          break;

        case AI_STATES.DETECT_PLAYER:
          m.animator.play('idle');
          m.facingYaw = Math.atan2(playerPos.x - m.group.position.x, playerPos.z - m.group.position.z);
          if (m.stateTimer <= 0) {
            m.state = AI_STATES.CHASE;
          }
          break;

        case AI_STATES.PATROL: {
          if (playerAlive && distToPlayer <= m.detectRange) {
            m.state = AI_STATES.DETECT_PLAYER;
            m.stateTimer = 0.25;
            break;
          }
          const wp = m.patrolPoints[m.patrolIdx];
          const dx = wp.x - m.group.position.x;
          const dz = wp.z - m.group.position.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.9) {
            m.patrolIdx = (m.patrolIdx + 1) % m.patrolPoints.length;
            m.state = AI_STATES.IDLE;
            m.stateTimer = 1.1;
          } else {
            const steered = this._steerAroundObstacles(m, dx / d, dz / d);
            const patrolSpeed = m.speed * 0.55;
            moveVx = steered.x * patrolSpeed;
            moveVz = steered.z * patrolSpeed;
            m.facingYaw = Math.atan2(steered.x, steered.z);
            m.animator.play('walk');
          }
          break;
        }

        case AI_STATES.RETURN_HOME: {
          if (playerAlive && distToPlayer <= m.detectRange * 0.85 && distToHome < m.chaseRange * 0.7) {
            m.state = AI_STATES.CHASE;
            break;
          }
          const dx = m.homePos.x - m.group.position.x;
          const dz = m.homePos.z - m.group.position.z;
          const d = Math.hypot(dx, dz);
          if (d < 1.2) {
            m.hp = Math.min(m.maxHp, m.hp + 15);
            m.state = AI_STATES.PATROL;
          } else {
            const steered = this._steerAroundObstacles(m, dx / d, dz / d);
            moveVx = steered.x * m.speed * 0.85;
            moveVz = steered.z * m.speed * 0.85;
            m.facingYaw = Math.atan2(steered.x, steered.z);
            m.animator.play('walk');
          }
          break;
        }

        case AI_STATES.RETREAT: {
          const dx = m.group.position.x - playerPos.x;
          const dz = m.group.position.z - playerPos.z;
          const d = Math.max(0.1, Math.hypot(dx, dz));
          const steered = this._steerAroundObstacles(m, dx / d, dz / d);
          moveVx = steered.x * m.speed * 0.9;
          moveVz = steered.z * m.speed * 0.9;
          m.facingYaw = Math.atan2(steered.x, steered.z);
          m.animator.play('run');
          if (m.stateTimer <= 0 || distToPlayer > m.attackRange * 2.6) {
            m.state = distToHome > m.chaseRange ? AI_STATES.RETURN_HOME : AI_STATES.CHASE;
          }
          break;
        }

        case AI_STATES.CHASE: {
          if (!playerAlive || distToHome > m.chaseRange || distToPlayer > m.chaseRange * 1.2) {
            m.state = AI_STATES.RETURN_HOME;
            break;
          }
          // Non-boss wounded retreat chance
          if (!m.def.isBoss && m.hp < m.maxHp * 0.22 && Math.random() < 0.008) {
            m.state = AI_STATES.RETREAT;
            m.stateTimer = 1.6;
            break;
          }
          if (distToPlayer <= m.attackRange && m.attackCooldown <= 0) {
            // Optional Shieldbearer defend before strike
            if (m.def.canDefend && Math.random() < 0.25) {
              m.state = AI_STATES.DEFEND;
              m.stateTimer = 0.8;
              m.animator.play('idle');
              break;
            }
            const atkIdx = Math.floor(Math.random() * m.def.attacks.length);
            m.currentAttackType = m.def.attacks[atkIdx];
            m.state = AI_STATES.ATTACK;
            m.stateTimer = 0.65 / (m.def.attackSpeed * (m.phase === 2 ? 1.25 : 1.0));
            m.hitAppliedThisAttack = false;
            m.attackCooldown = (m.def.cooldown / (m.phase === 2 ? 1.35 : 1.0));
            const useSpecial = m.currentAttackType === 'Ground Slam' || m.currentAttackType === 'Roar';
            m.animator.play(useSpecial ? 'special' : 'attack', true, m.def.attackSpeed);
            break;
          }
          const dx = playerPos.x - m.group.position.x;
          const dz = playerPos.z - m.group.position.z;
          const d = Math.max(0.01, Math.hypot(dx, dz));
          const steered = this._steerAroundObstacles(m, dx / d, dz / d);
          moveVx = steered.x * m.speed;
          moveVz = steered.z * m.speed;
          m.facingYaw = Math.atan2(steered.x, steered.z);
          m.animator.play('run');
          break;
        }

        case AI_STATES.ATTACK: {
          m.facingYaw = Math.atan2(playerPos.x - m.group.position.x, playerPos.z - m.group.position.z);
          if (m.currentAttackType === 'Charge Attack' && m.stateTimer > 0.2) {
            moveVx = Math.sin(m.facingYaw) * m.speed * 1.45;
            moveVz = Math.cos(m.facingYaw) * m.speed * 1.45;
          }
          if (!m.hitAppliedThisAttack && m.stateTimer < 0.34) {
            m.hitAppliedThisAttack = true;
            const reach = m.currentAttackType === 'Ground Slam' || m.currentAttackType === 'Roar'
              ? m.attackRange * 1.45
              : m.attackRange * 1.15;
            if (playerAlive && distToPlayer <= reach) {
              const mult = m.currentAttackType === 'Ground Slam' || m.currentAttackType === 'Heavy Strike' ? 1.35 : 1.0;
              const hitRes = playerCtrl.takeDamage(Math.round(m.damage * mult), m.group.position);
              if (hitRes.hit && onPlayerHit) {
                onPlayerHit(m, hitRes);
              }
            }
          }
          if (m.stateTimer <= 0) {
            m.state = AI_STATES.CHASE;
          }
          break;
        }
      }

      // Apply knockback + gravity + Rapier movement
      moveVx += m.knockbackVel.x;
      moveVz += m.knockbackVel.z;
      m.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 8));

      m.velocityY -= 20.0 * dt;
      if (m.velocityY < -20) m.velocityY = -20;

      m.charController.computeColliderMovement(m.collider, {
        x: moveVx * dt,
        y: m.velocityY * dt,
        z: moveVz * dt,
      });
      const corr = m.charController.computedMovement();
      if (m.charController.computedGrounded() && m.velocityY < 0) {
        m.velocityY = -0.5;
      }

      const pos = m.rigidBody.translation();
      const nx = pos.x + corr.x;
      const ny = Math.max(-0.8, pos.y + corr.y);
      const nz = pos.z + corr.z;
      m.rigidBody.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

      m.group.position.set(nx, ny - m.centerOffset, nz);
      m.model.rotation.y = m.facingYaw; // Gobkit models face +Z

      m.animator.update(dt);
    }
  }
}
