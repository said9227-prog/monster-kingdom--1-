import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { CharacterAnimator } from './animator.js';
import { WARRIOR_DEF } from './monsterRegistry.js';

export const WEAPONS = {
  broadsword: {
    id: 'broadsword',
    damage: 24,
    heavyDamage: 46,
    range: 2.5,
    attackSpeed: 1.15,
    staminaCost: 14,
    heavyCost: 28,
    critChance: 0.18,
  },
  greatsword: {
    id: 'greatsword',
    damage: 36,
    heavyDamage: 66,
    range: 3.0,
    attackSpeed: 0.92,
    staminaCost: 20,
    heavyCost: 36,
    critChance: 0.22,
  },
  battleaxe: {
    id: 'battleaxe',
    damage: 42,
    heavyDamage: 74,
    range: 2.65,
    attackSpeed: 0.85,
    staminaCost: 22,
    heavyCost: 38,
    critChance: 0.25,
  },
  twinblade: {
    id: 'twinblade',
    damage: 20,
    heavyDamage: 40,
    range: 2.35,
    attackSpeed: 1.45,
    staminaCost: 10,
    heavyCost: 22,
    critChance: 0.30,
  },
};

export class PlayerController {
  constructor(scene, RAPIER, physicsWorld) {
    this.scene = scene;
    this.RAPIER = RAPIER;
    this.physicsWorld = physicsWorld;
    this.loader = new GLTFLoader();

    this.group = new THREE.Group();
    this.group.name = 'player_warrior_root';
    this.scene.add(this.group);

    this.modelRoot = null;
    this.animator = null;
    this.shieldMesh = null;
    this.slashArcMesh = null;

    this.rigidBody = null;
    this.collider = null;
    this.charController = null;

    // Movement & Action state
    this.input = {
      moveX: 0,
      moveY: 0,
      forward: false,
      backward: false,
      left: false,
      right: false,
      rotateLeft: false,
      rotateRight: false,
      run: true,
      block: false,
    };

    this.facingYaw = Math.PI; // Faces -Z initially (into the plaza)
    this.velocityY = 0;
    this.grounded = false;

    // Combat stats
    this.maxHp = 220;
    this.hp = 220;
    this.maxStamina = 100;
    this.stamina = 100;
    this.defense = 6;
    this.weaponId = 'broadsword';

    this.actionState = 'IDLE'; // IDLE, MOVE, ATTACK, HEAVY, DODGE, BLOCK, HURT, DEAD
    this.actionTimer = 0;
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.attackCooldown = 0;
    this.dodgeCooldown = 0;
    this.invulnTimer = 0;
    this.hitTriggeredInSwing = false;
    this.dodgeDir = new THREE.Vector3();
    this.knockbackVel = new THREE.Vector3();
    this.slashTimer = 0;
  }

  async init(spawn = { x: 0, y: 0.5, z: 8 }) {
    if (!this.modelRoot) {
      const gltf = await this.loader.loadAsync(WARRIOR_DEF.path);
      const model = gltf.scene;
      // Normalize height and ground feet at y = 0
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const scale = WARRIOR_DEF.targetHeight / Math.max(0.1, size.y);
      model.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);
      model.position.set(-center.x, -scaledBox.min.y, -center.z);

      model.traverse((c) => {
        if (c.isMesh || c.isSkinnedMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.frustumCulled = false;
        }
      });

      this.modelRoot = model;
      this.group.add(this.modelRoot);
      this.animator = new CharacterAnimator(this.modelRoot, gltf.animations, WARRIOR_DEF.animMeta);

      // Subtle translucent energy shield dome visible only when BLOCK/DEFEND is active
      const shieldGeo = new THREE.SphereGeometry(0.95, 16, 12, 0, Math.PI * 1.1, 0.25, Math.PI * 0.65);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      });
      this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      this.shieldMesh.position.set(0, 1.0, 0.35);
      this.shieldMesh.rotation.y = -Math.PI * 0.05;
      this.shieldMesh.visible = false;
      this.group.add(this.shieldMesh);

      // Weapon swing arc VFX
      const slashGeo = new THREE.RingGeometry(0.9, 2.0, 18, 1, -Math.PI * 0.45, Math.PI * 0.9);
      const slashMat = new THREE.MeshBasicMaterial({
        color: 0xffd54f,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      this.slashArcMesh = new THREE.Mesh(slashGeo, slashMat);
      this.slashArcMesh.rotation.x = -Math.PI / 2;
      this.slashArcMesh.position.set(0, 1.05, 0.25);
      this.slashArcMesh.visible = false;
      this.group.add(this.slashArcMesh);
    }

    this.createPhysicsBody(spawn);
  }

  createPhysicsBody(spawn) {
    if (this.charController) {
      try { this.physicsWorld.removeCharacterController(this.charController); } catch (_) {}
    }
    if (this.rigidBody) {
      try { this.physicsWorld.removeRigidBody(this.rigidBody); } catch (_) {}
    }

    const bodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawn.x, spawn.y + 0.9, spawn.z);
    this.rigidBody = this.physicsWorld.createRigidBody(bodyDesc);
    const colDesc = this.RAPIER.ColliderDesc.capsule(0.5, 0.38);
    this.collider = this.physicsWorld.createCollider(colDesc, this.rigidBody);

    this.charController = this.physicsWorld.createCharacterController(0.05);
    this.charController.enableAutostep(0.55, 0.25, true);
    this.charController.enableSnapToGround(0.35);
    this.charController.setMaxSlopeClimbAngle((48 * Math.PI) / 180);
    this.charController.setMinSlopeSlideAngle((55 * Math.PI) / 180);

    this.group.position.set(spawn.x, spawn.y, spawn.z);
    this.velocityY = 0;
  }

  resetForMission(spawn) {
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.actionState = 'IDLE';
    this.actionTimer = 0;
    this.comboStep = 0;
    this.invulnTimer = 0.5;
    this.knockbackVel.set(0, 0, 0);
    this.createPhysicsBody(spawn);
    this.animator?.play('idle', true);
  }

  setWeapon(weaponId) {
    if (WEAPONS[weaponId]) {
      this.weaponId = weaponId;
    }
  }

  handleCommand(cmd, payload = {}) {
    if (this.actionState === 'DEAD') return;

    switch (cmd) {
      case 'JOYSTICK':
        this.input.moveX = payload.x || 0;
        this.input.moveY = payload.y || 0;
        if (typeof payload.run === 'boolean') this.input.run = payload.run;
        break;
      case 'MOVE_FORWARD':
        this.input.forward = payload.active !== false;
        break;
      case 'MOVE_BACKWARD':
        this.input.backward = payload.active !== false;
        break;
      case 'MOVE_LEFT':
        this.input.left = payload.active !== false;
        break;
      case 'MOVE_RIGHT':
        this.input.right = payload.active !== false;
        break;
      case 'RUN':
        this.input.run = payload.active !== false;
        break;
      case 'WALK':
        this.input.run = false;
        break;
      case 'ROTATE_LEFT':
        this.input.rotateLeft = payload.active !== false;
        break;
      case 'ROTATE_RIGHT':
        this.input.rotateRight = payload.active !== false;
        break;
      case 'STOP':
        this.input.moveX = 0;
        this.input.moveY = 0;
        this.input.forward = false;
        this.input.backward = false;
        this.input.left = false;
        this.input.right = false;
        this.input.block = false;
        break;
      case 'JUMP':
        if (this.grounded && this.stamina >= 10) {
          this.velocityY = 7.4;
          this.grounded = false;
          this.stamina -= 10;
        }
        break;
      case 'DEFEND':
      case 'BLOCK':
        this.input.block = payload.active !== false;
        break;
      case 'ATTACK':
        this.triggerAttack(false);
        break;
      case 'HEAVY_ATTACK':
        this.triggerAttack(true);
        break;
      case 'DODGE':
        this.triggerDodge();
        break;
    }
  }

  triggerAttack(isHeavy) {
    if (this.actionState === 'DEAD' || this.actionState === 'DODGE') return;
    if (this.attackCooldown > 0) return;

    const w = WEAPONS[this.weaponId];
    const cost = isHeavy ? w.heavyCost : w.staminaCost;
    if (this.stamina < cost) return;

    this.stamina -= cost;
    this.input.block = false;
    this.hitTriggeredInSwing = false;

    if (isHeavy) {
      this.actionState = 'HEAVY';
      this.actionTimer = 0.62 / w.attackSpeed;
      this.attackCooldown = 0.72 / w.attackSpeed;
      this.comboStep = 0;
      this.animator?.play('special', true, w.attackSpeed);
      if (this.slashArcMesh) {
        this.slashArcMesh.material.color.setHex(0xff7043);
        this.slashArcMesh.visible = true;
        this.slashTimer = 0.25;
      }
    } else {
      this.comboStep = (this.comboStep % 3) + 1;
      this.comboResetTimer = 1.3;
      this.actionState = 'ATTACK';
      this.actionTimer = 0.44 / w.attackSpeed;
      this.attackCooldown = 0.36 / w.attackSpeed;
      this.animator?.play('attack', true, w.attackSpeed * (this.comboStep === 3 ? 1.15 : 1.0));
      if (this.slashArcMesh) {
        this.slashArcMesh.material.color.setHex(this.comboStep === 3 ? 0xffca28 : 0xfff59d);
        this.slashArcMesh.visible = true;
        this.slashTimer = 0.18;
      }
    }
  }

  triggerDodge() {
    if (this.actionState === 'DEAD' || this.dodgeCooldown > 0 || this.stamina < 18) return;
    this.stamina -= 18;
    this.input.block = false;
    this.actionState = 'DODGE';
    this.actionTimer = 0.36;
    this.dodgeCooldown = 0.75;
    this.invulnTimer = 0.38;

    const forward = new THREE.Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));
    this.dodgeDir.copy(forward).normalize();
    this.animator?.play('run', true, 1.5);
  }

  takeDamage(amount, attackerPos) {
    if (this.actionState === 'DEAD' || this.invulnTimer > 0) return { hit: false, damage: 0, blocked: false };

    let finalDmg = Math.max(1, amount - this.defense * 0.5);
    let blocked = false;
    if (this.input.block && this.stamina > 5) {
      blocked = true;
      finalDmg = Math.max(1, Math.round(finalDmg * 0.25));
      this.stamina = Math.max(0, this.stamina - 12);
    } else {
      finalDmg = Math.round(finalDmg);
      this.actionState = 'HURT';
      this.actionTimer = 0.25;
      this.animator?.play('hit', true);
    }

    this.hp = Math.max(0, this.hp - finalDmg);
    this.invulnTimer = 0.3;

    if (attackerPos) {
      const push = new THREE.Vector3().subVectors(this.group.position, attackerPos);
      push.y = 0;
      if (push.lengthSq() > 0.001) {
        push.normalize().multiplyScalar(blocked ? 3.5 : 7.0);
        this.knockbackVel.copy(push);
      }
    }

    if (this.hp <= 0) {
      this.actionState = 'DEAD';
      this.animator?.play('death', true);
    }

    return { hit: true, damage: finalDmg, blocked };
  }

  getActiveAttackHitbox() {
    if ((this.actionState !== 'ATTACK' && this.actionState !== 'HEAVY') || this.hitTriggeredInSwing) {
      return null;
    }
    // Hit frames occur in middle of swing
    if (this.actionTimer < 0.28) {
      this.hitTriggeredInSwing = true;
      const w = WEAPONS[this.weaponId];
      const forward = new THREE.Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));
      const hitCenter = this.group.position.clone().addScaledVector(forward, w.range * 0.55);
      hitCenter.y += 1.0;

      const isCrit = Math.random() < w.critChance || this.comboStep === 3;
      const base = this.actionState === 'HEAVY' ? w.heavyDamage : w.damage * (this.comboStep === 3 ? 1.35 : 1.0);
      const damage = Math.round(base * (isCrit ? 1.5 : 1.0));

      return {
        center: hitCenter,
        radius: w.range * 0.65,
        damage,
        isCrit,
        knockback: this.actionState === 'HEAVY' ? 9.5 : 5.5,
      };
    }
    return null;
  }

  update(dt, cameraYaw) {
    if (!this.rigidBody || !this.charController) return;

    // Cooldowns & regeneration
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.comboResetTimer = Math.max(0, this.comboResetTimer - dt);
    if (this.comboResetTimer <= 0) this.comboStep = 0;

    if (this.slashTimer > 0) {
      this.slashTimer -= dt;
      if (this.slashArcMesh) {
        this.slashArcMesh.rotation.z += dt * 14;
        if (this.slashTimer <= 0) this.slashArcMesh.visible = false;
      }
    }

    if (this.actionState !== 'DEAD' && !this.input.block && this.actionState !== 'ATTACK' && this.actionState !== 'HEAVY') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    }

    if (this.shieldMesh) {
      this.shieldMesh.visible = this.input.block && this.actionState !== 'DEAD';
    }

    // State timer
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0 && this.actionState !== 'DEAD') {
        this.actionState = 'IDLE';
      }
    }

    // Horizontal movement
    let desiredVx = 0;
    let desiredVz = 0;

    if (this.actionState !== 'DEAD') {
      let ix = this.input.moveX + (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      let iy = this.input.moveY + (this.input.forward ? 1 : 0) - (this.input.backward ? 1 : 0);
      const mag = Math.hypot(ix, iy);

      if (this.input.rotateLeft) this.facingYaw += 2.6 * dt;
      if (this.input.rotateRight) this.facingYaw -= 2.6 * dt;

      if (this.actionState === 'DODGE') {
        desiredVx = this.dodgeDir.x * 11.5;
        desiredVz = this.dodgeDir.z * 11.5;
      } else if (mag > 0.08 && this.actionState !== 'HURT') {
        const nx = ix / Math.max(1, mag);
        const ny = iy / Math.max(1, mag);
        // Camera-relative movement:
        // Forward (ny > 0) moves along camera look dir (-sin(yaw), -cos(yaw))
        const camForwardX = -Math.sin(cameraYaw);
        const camForwardZ = -Math.cos(cameraYaw);
        const camRightX = Math.cos(cameraYaw);
        const camRightZ = -Math.sin(cameraYaw);

        const worldDirX = camForwardX * ny + camRightX * nx;
        const worldDirZ = camForwardZ * ny + camRightZ * nx;
        const moveLen = Math.hypot(worldDirX, worldDirZ) || 1;
        const dirX = worldDirX / moveLen;
        const dirZ = worldDirZ / moveLen;

        const isRunning = this.input.run && Math.min(1, mag) > 0.55 && !this.input.block;
        let speed = isRunning ? 6.8 : 3.7;
        if (this.input.block) speed = 2.4;
        if (this.actionState === 'ATTACK' || this.actionState === 'HEAVY') speed *= 0.35;

        desiredVx = dirX * speed * Math.min(1, mag);
        desiredVz = dirZ * speed * Math.min(1, mag);

        // Smoothly rotate character toward movement direction
        const targetYaw = Math.atan2(dirX, dirZ);
        let diff = targetYaw - this.facingYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.facingYaw += diff * Math.min(1, dt * 12);

        if (this.actionState === 'IDLE' || this.actionState === 'MOVE') {
          this.actionState = 'MOVE';
          this.animator?.play(isRunning ? 'run' : 'walk');
        }
      } else if (this.actionState === 'MOVE' || this.actionState === 'IDLE') {
        this.actionState = 'IDLE';
        this.animator?.play('idle');
      }
    }

    // Apply knockback decay
    desiredVx += this.knockbackVel.x;
    desiredVz += this.knockbackVel.z;
    this.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 8));

    // Gravity
    this.velocityY -= 20.0 * dt;
    if (this.velocityY < -22) this.velocityY = -22;

    const desiredDelta = {
      x: desiredVx * dt,
      y: this.velocityY * dt,
      z: desiredVz * dt,
    };

    this.charController.computeColliderMovement(this.collider, desiredDelta);
    const corrected = this.charController.computedMovement();
    this.grounded = this.charController.computedGrounded();
    if (this.grounded && this.velocityY < 0) {
      this.velocityY = -0.5;
    }

    const pos = this.rigidBody.translation();
    const nextX = pos.x + corrected.x;
    const nextY = Math.max(-0.8, pos.y + corrected.y);
    const nextZ = pos.z + corrected.z;
    this.rigidBody.setNextKinematicTranslation({ x: nextX, y: nextY, z: nextZ });

    // Sync visual group (capsule half-height 0.5 + radius 0.38 = 0.88 center offset)
    this.group.position.set(nextX, nextY - 0.88, nextZ);
    this.group.rotation.y = this.facingYaw;

    this.animator?.update(dt);
  }
}
