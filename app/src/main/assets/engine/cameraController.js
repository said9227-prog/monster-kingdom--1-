import * as THREE from '../vendor/three.module.min.js';

export class CameraController {
  constructor(camera, RAPIER, physicsWorld) {
    this.camera = camera;
    this.RAPIER = RAPIER;
    this.physicsWorld = physicsWorld;

    this.yaw = 0; // Camera looks toward -Z when yaw=0
    this.pitch = 0.42;
    this.distance = 6.8;
    this.minDist = 3.6;
    this.maxDist = 11.5;

    this.currentLookAt = new THREE.Vector3();
    this.currentCamPos = new THREE.Vector3(0, 4, 15);
    this.lockOnEnabled = false;

    // Boss cinematic intro state
    this.cinematicTimer = 0;
    this.cinematicTarget = null;
  }

  setPhysicsWorld(physicsWorld) {
    this.physicsWorld = physicsWorld;
  }

  rotateBy(dyaw, dpitch) {
    if (this.cinematicTimer > 0) return;
    this.yaw -= dyaw;
    this.pitch = Math.max(0.12, Math.min(1.18, this.pitch + dpitch));
  }

  zoomBy(delta) {
    this.distance = Math.max(this.minDist, Math.min(this.maxDist, this.distance + delta));
  }

  toggleLockOn() {
    this.lockOnEnabled = !this.lockOnEnabled;
    return this.lockOnEnabled;
  }

  startBossCinematic(bossPos, duration = 2.6) {
    this.cinematicTimer = duration;
    this.cinematicTarget = bossPos.clone();
  }

  update(dt, playerPos, playerCollider, monsters = []) {
    if (this.cinematicTimer > 0 && this.cinematicTarget) {
      this.cinematicTimer -= dt;
      const t = this.cinematicTimer;
      const angle = t * 1.1;
      const camPos = new THREE.Vector3(
        this.cinematicTarget.x + Math.sin(angle) * 6.5,
        this.cinematicTarget.y + 3.2,
        this.cinematicTarget.z + Math.cos(angle) * 6.5
      );
      this.currentCamPos.lerp(camPos, Math.min(1, dt * 5));
      const look = this.cinematicTarget.clone().add(new THREE.Vector3(0, 1.5, 0));
      this.currentLookAt.lerp(look, Math.min(1, dt * 6));
      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // Lock-on yaw assistance toward closest alive enemy
    if (this.lockOnEnabled && monsters.length > 0) {
      let closest = null;
      let minD = 22;
      for (const m of monsters) {
        if (m.state === 'DEATH') continue;
        const d = m.group.position.distanceTo(playerPos);
        if (d < minD) {
          minD = d;
          closest = m;
        }
      }
      if (closest) {
        const dx = closest.group.position.x - playerPos.x;
        const dz = closest.group.position.z - playerPos.z;
        const targetYaw = Math.atan2(-dx, -dz);
        let diff = targetYaw - this.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.yaw += diff * Math.min(1, dt * 5.5);
      }
    }

    const anchor = new THREE.Vector3(playerPos.x, playerPos.y + 1.55, playerPos.z);
    const horizDist = Math.cos(this.pitch) * this.distance;
    const vertDist = Math.sin(this.pitch) * this.distance;

    const offsetX = Math.sin(this.yaw) * horizDist;
    const offsetZ = Math.cos(this.yaw) * horizDist;
    const desiredPos = new THREE.Vector3(anchor.x + offsetX, anchor.y + vertDist, anchor.z + offsetZ);

    // Anti-wall clipping via Rapier raycast
    if (this.physicsWorld) {
      const dir = new THREE.Vector3().subVectors(desiredPos, anchor);
      const maxLen = dir.length();
      if (maxLen > 0.2) {
        dir.normalize();
        const ray = new this.RAPIER.Ray(
          { x: anchor.x, y: anchor.y, z: anchor.z },
          { x: dir.x, y: dir.y, z: dir.z }
        );
        const hit = this.physicsWorld.castRay(ray, maxLen, true, undefined, undefined, playerCollider);
        if (hit && hit.timeOfImpact > 0.4 && hit.timeOfImpact < maxLen) {
          const safeDist = Math.max(1.2, hit.timeOfImpact - 0.35);
          desiredPos.copy(anchor).addScaledVector(dir, safeDist);
        }
      }
    }

    this.currentCamPos.lerp(desiredPos, Math.min(1, dt * 12));
    this.currentLookAt.lerp(anchor, Math.min(1, dt * 14));
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
