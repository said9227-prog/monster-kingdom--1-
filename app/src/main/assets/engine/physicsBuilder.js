import * as THREE from '../vendor/three.module.min.js';

/**
 * Extracts world-space vertices and triangle indices from an Object3D for Rapier Trimesh colliders.
 * Used selectively for walkable bridges, stairs, and ramparts to preserve 60fps mobile performance.
 */
function extractTrimeshData(object3d) {
  object3d.updateMatrixWorld(true);
  const vertices = [];
  const indices = [];
  let vertexOffset = 0;
  const v = new THREE.Vector3();

  object3d.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const geom = child.geometry;
    const pos = geom.attributes.position;
    if (!pos) return;

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(child.matrixWorld);
      vertices.push(v.x, v.y, v.z);
    }

    if (geom.index) {
      const idx = geom.index;
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + vertexOffset);
      }
    }
    vertexOffset += pos.count;
  });

  if (vertices.length === 0 || indices.length === 0) return null;
  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

function addFixedBoxFromBounds(RAPIER, world, box, shrinkXZ = 1.0, minHalf = 0.25) {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const hx = Math.max(minHalf, (size.x * 0.5) * shrinkXZ);
  const hy = Math.max(0.25, size.y * 0.5);
  const hz = Math.max(minHalf, (size.z * 0.5) * shrinkXZ);

  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(center.x, center.y, center.z));
  const collider = world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
  return { body, collider, center, halfExtents: { hx, hy, hz } };
}

function addFixedTrimesh(RAPIER, world, object3d) {
  const data = extractTrimeshData(object3d);
  if (!data) return null;
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const desc = RAPIER.ColliderDesc.trimesh(data.vertices, data.indices);
  const collider = world.createCollider(desc, body);
  return { body, collider };
}

/**
 * Builds Rapier physics world colliders directly from the loaded GLB scene graph.
 */
export function buildWorldPhysics(RAPIER, world, worldRoot, worldId) {
  worldRoot.updateMatrixWorld(true);
  const stats = {
    groundColliders: 0,
    wallColliders: 0,
    buildingColliders: 0,
    propColliders: 0,
    trimeshColliders: 0,
    totalColliders: 0,
  };

  let gateBlockerCollider = null;
  const obstacleBoxes = []; // Used by camera raycast and AI steering metadata

  const addGroundSlab = (cx, cy, cz, hx, hy, hz) => {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy, cz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
    stats.groundColliders++;
  };

  if (worldId === 'medieval-kingdom') {
    // Playable terrain covers roughly x in [-38, 38], z in [-34, 46]
    // River channel sits around z in [32.8, 39.2] for x in [-26, 22] -> keep north & south slabs + river bed
    addGroundSlab(0, -0.5, -2.5, 42, 0.5, 35.3);   // North of river: z in [-37.8, 32.8]
    addGroundSlab(0, -0.5, 43.5, 42, 0.5, 4.3);    // South of river: z in [39.2, 47.8]
    addGroundSlab(32, -0.5, 36.0, 10, 0.5, 3.2);   // East bank past river bend
    addGroundSlab(-33, -0.5, 36.0, 7, 0.5, 3.2);   // West bank
    addGroundSlab(-2, -1.3, 36.0, 26, 0.5, 3.5);   // River bed floor (prevents falling through world)

    // World outer safety perimeter boundaries
    addGroundSlab(0, 4, -37.5, 42, 5, 0.5);
    addGroundSlab(0, 4, 47.5, 42, 5, 0.5);
    addGroundSlab(-39.5, 4, 5, 0.5, 5, 43);
    addGroundSlab(39.5, 4, 5, 0.5, 5, 43);
  } else {
    // Tournament Arena flat ground
    addGroundSlab(0, -0.5, 0, 24, 0.5, 20);
    addGroundSlab(0, 4, -18.5, 24, 5, 0.5);
    addGroundSlab(0, 4, 18.5, 24, 5, 0.5);
    addGroundSlab(-22.5, 4, 0, 0.5, 5, 19);
    addGroundSlab(22.5, 4, 0, 0.5, 5, 19);
  }

  const box = new THREE.Box3();
  const rootContainer = worldRoot.children[0] || worldRoot;

  for (const obj of rootContainer.children) {
    const name = (obj.name || '').toLowerCase();
    if (!name) continue;

    // Skip flat ground / road / river / purely decorative small foliage
    if (
      name.includes('grass-ground-tile') ||
      name.includes('cobble-road') ||
      name.includes('plaza-paving') ||
      name.includes('dirt-path') ||
      name.includes('wheat-field') ||
      name.includes('ploughed-field') ||
      name.includes('river-tile') ||
      name.includes('river-bank') ||
      name.includes('river-bend') ||
      name.includes('tournament-ground-module') ||
      name.includes('churned-ground-patch') ||
      name.includes('flower-patch') ||
      name.includes('grass-tuft') ||
      name.includes('fern-clump') ||
      name.includes('lily-pads') ||
      name.includes('reed-clump') ||
      name.includes('mushroom-ring') ||
      name.includes('rug') ||
      name.includes('pennant-line') ||
      name.includes('chandelier')
    ) {
      continue;
    }

    box.setFromObject(obj);
    if (box.isEmpty()) continue;

    // Walkable elevated Trimesh colliders (bridges, stairs, wall-walk)
    if (
      name.includes('bridge') ||
      name.includes('wall-stair') ||
      name.includes('wall-walk-crenellated') ||
      name.includes('spectator-stand-stair') ||
      name.includes('heralds-platform')
    ) {
      if (addFixedTrimesh(RAPIER, world, obj)) {
        stats.trimeshColliders++;
      }
      continue;
    }

    // Gatehouse: keep archway open by creating left and right pillar colliders + toggleable gate blocker
    if (name.includes('wall-gatehouse')) {
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      // Left pillar
      const leftBox = new THREE.Box3(
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(center.x - 1.25, box.max.y, box.max.z)
      );
      // Right pillar
      const rightBox = new THREE.Box3(
        new THREE.Vector3(center.x + 1.25, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z)
      );
      addFixedBoxFromBounds(RAPIER, world, leftBox, 1.0, 0.3);
      addFixedBoxFromBounds(RAPIER, world, rightBox, 1.0, 0.3);
      stats.wallColliders += 2;

      // Controllable gate blocker across the archway
      const gateBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(center.x, 1.8, center.z)
      );
      gateBlockerCollider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(1.25, 1.8, 0.7),
        gateBody
      );
      // Start unlocked by default; Mission 5 locks it until gatekeeper defeated
      gateBlockerCollider.setEnabled(false);
      continue;
    }

    // Town walls & corner towers
    if (name.includes('town-wall-segment') || name.includes('wall-corner-tower')) {
      const res = addFixedBoxFromBounds(RAPIER, world, box, 0.96, 0.3);
      obstacleBoxes.push(box.clone());
      stats.wallColliders++;
      continue;
    }

    // Buildings & large structures
    if (
      name.includes('tavern') ||
      name.includes('town-hall') ||
      name.includes('store') ||
      name.includes('bank') ||
      name.includes('church') ||
      name.includes('smithy') ||
      name.includes('kitchen') ||
      name.includes('barracks') ||
      name.includes('timber-house') ||
      name.includes('cottage') ||
      name.includes('watchtower') ||
      name.includes('fletcher') ||
      name.includes('farmhouse') ||
      name.includes('windmill') ||
      name.includes('wizard-tower') ||
      name.includes('fishing-hut') ||
      name.includes('mine-entrance') ||
      name.includes('cave-mouth') ||
      name.includes('goblin-tent') ||
      name.includes('royal-box') ||
      name.includes('spectator-stand') ||
      name.includes('pavilion') ||
      name.includes('tent')
    ) {
      addFixedBoxFromBounds(RAPIER, world, box, 0.84, 0.4);
      obstacleBoxes.push(box.clone());
      stats.buildingColliders++;
      continue;
    }

    // Trees: compact trunk collider so player walks smoothly under canopy
    if (name.includes('tree')) {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const trunkBox = new THREE.Box3(
        new THREE.Vector3(center.x - 0.5, box.min.y, center.z - 0.5),
        new THREE.Vector3(center.x + 0.5, box.max.y * 0.75, center.z + 0.5)
      );
      addFixedBoxFromBounds(RAPIER, world, trunkBox, 1.0, 0.4);
      stats.propColliders++;
      continue;
    }

    // Tournament lists fences, tilt barriers, boulders, standing stones, wells, stalls
    if (
      name.includes('boulder') ||
      name.includes('rock-outcrop') ||
      name.includes('standing-stone') ||
      name.includes('town-well') ||
      name.includes('market-stall') ||
      name.includes('tilt-barrier') ||
      (name.includes('lists-fence') && !name.includes('gate')) ||
      name.includes('cow-pen-fence') ||
      name.includes('fence-run') ||
      name.includes('altar')
    ) {
      addFixedBoxFromBounds(RAPIER, world, box, 0.88, 0.25);
      stats.propColliders++;
      continue;
    }
  }

  stats.totalColliders =
    stats.groundColliders +
    stats.wallColliders +
    stats.buildingColliders +
    stats.propColliders +
    stats.trimeshColliders;

  return {
    stats,
    obstacleBoxes,
    setGateLocked(locked) {
      if (gateBlockerCollider) {
        gateBlockerCollider.setEnabled(Boolean(locked));
      }
    },
  };
}
