import * as THREE from 'three';
import { BlockType, isSolid } from './blocks.js';
import { CHUNK_SIZE } from './chunk.js';

const MOB_TYPES = {
  cow: {
    name: 'Vaca',
    bodyColor: 0x6B3A2A,
    spotColor: 0xF5F5DC,
    legColor: 0x5C3317,
    width: 0.7,
    height: 1.2,
    bodyLen: 1.0,
    speed: 1.0,
    health: 10,
  },
  pig: {
    name: 'Porco',
    bodyColor: 0xFFA0B0,
    spotColor: 0xFF8C9E,
    legColor: 0xFFA0B0,
    width: 0.5,
    height: 0.8,
    bodyLen: 0.7,
    speed: 1.2,
    health: 10,
  },
  chicken: {
    name: 'Galinha',
    bodyColor: 0xF0F0F0,
    spotColor: 0xE8E8E8,
    legColor: 0xFF8C00,
    width: 0.3,
    height: 0.6,
    bodyLen: 0.35,
    speed: 1.4,
    health: 4,
  },
};

function createMobModel(type) {
  const group = new THREE.Group();
  const t = MOB_TYPES[type];

  const bodyMat = new THREE.MeshLambertMaterial({ color: t.bodyColor });
  const spotMat = new THREE.MeshLambertMaterial({ color: t.spotColor });
  const legMat = new THREE.MeshLambertMaterial({ color: t.legColor });

  const bodyH = t.height * 0.4;
  const bodyW = t.width;
  const bodyL = t.bodyLen;
  const bodyY = t.height * 0.45;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW, bodyH, bodyL),
    bodyMat
  );
  body.position.y = bodyY;
  body.name = 'body';
  group.add(body);

  const headSize = type === 'chicken' ? 0.22 : type === 'pig' ? 0.3 : 0.4;
  const headY = bodyY + bodyH * 0.3 + headSize * 0.5;
  const headZ = bodyL * 0.5 + headSize * 0.35;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headSize, headSize, headSize),
    bodyMat
  );
  head.position.set(0, headY, headZ);
  head.name = 'head';
  group.add(head);

  if (type === 'cow') {
    const spotW = bodyW * 0.7;
    const spotH = bodyH * 0.6;
    const spotL = bodyL * 0.8;
    const spot = new THREE.Mesh(
      new THREE.BoxGeometry(spotW, spotH, spotL),
      spotMat
    );
    spot.position.y = bodyY + bodyH * 0.15;
    group.add(spot);

    const muzzle = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.08),
      spotMat
    );
    muzzle.position.set(0, headY - headSize * 0.2, headZ + headSize * 0.5);
    group.add(muzzle);

    const earGeo = new THREE.BoxGeometry(0.08, 0.05, 0.1);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-headSize * 0.55, headY + headSize * 0.2, headZ);
    earL.rotation.z = 0.5;
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(headSize * 0.55, headY + headSize * 0.2, headZ);
    earR.rotation.z = -0.5;
    group.add(earR);

    const hornGeo = new THREE.BoxGeometry(0.04, 0.1, 0.04);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xF5DEB3 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-headSize * 0.4, headY + headSize * 0.5, headZ);
    hornL.rotation.z = 0.3;
    group.add(hornL);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(headSize * 0.4, headY + headSize * 0.5, headZ);
    hornR.rotation.z = -0.3;
    group.add(hornR);
  }

  if (type === 'pig') {
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xFF8A9E })
    );
    snout.position.set(0, headY - headSize * 0.15, headZ + headSize * 0.5);
    group.add(snout);

    const nostrilGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    const nostrilMat = new THREE.MeshLambertMaterial({ color: 0xCC6677 });
    const nL = new THREE.Mesh(nostrilGeo, nostrilMat);
    nL.position.set(-0.04, headY - headSize * 0.15, headZ + headSize * 0.55);
    group.add(nL);
    const nR = new THREE.Mesh(nostrilGeo, nostrilMat);
    nR.position.set(0.04, headY - headSize * 0.15, headZ + headSize * 0.55);
    group.add(nR);

    const earGeo = new THREE.BoxGeometry(0.12, 0.1, 0.06);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-headSize * 0.4, headY + headSize * 0.4, headZ - headSize * 0.1);
    earL.rotation.z = 0.4;
    earL.rotation.x = -0.3;
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(headSize * 0.4, headY + headSize * 0.4, headZ - headSize * 0.1);
    earR.rotation.z = -0.4;
    earR.rotation.x = -0.3;
    group.add(earR);

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.15),
      bodyMat
    );
    tail.position.set(0, bodyY + bodyH * 0.2, -bodyL * 0.55);
    tail.rotation.x = -0.5;
    tail.name = 'tail';
    group.add(tail);
  }

  if (type === 'chicken') {
    const beak = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
    );
    beak.position.set(0, headY - headSize * 0.1, headZ + headSize * 0.55);
    group.add(beak);

    const comb = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.1, 0.06),
      new THREE.MeshLambertMaterial({ color: 0xCC0000 })
    );
    comb.position.set(0, headY + headSize * 0.5, headZ);
    group.add(comb);

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.18, 0.08),
      bodyMat
    );
    tail.position.set(0, bodyY + bodyH * 0.3, -bodyL * 0.5);
    tail.rotation.x = -0.4;
    tail.name = 'tail';
    group.add(tail);

    const wingGeo = new THREE.BoxGeometry(0.05, 0.15, 0.2);
    const wingL = new THREE.Mesh(wingGeo, spotMat);
    wingL.position.set(-bodyW * 0.5, bodyY, 0);
    wingL.rotation.z = 0.2;
    group.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, spotMat);
    wingR.position.set(bodyW * 0.5, bodyY, 0);
    wingR.rotation.z = -0.2;
    group.add(wingR);
  }

  const legGeo = new THREE.BoxGeometry(0.12, t.height * 0.3, 0.12);
  const legPositions = [
    [-bodyW * 0.3, t.height * 0.15, bodyL * 0.3],
    [bodyW * 0.3, t.height * 0.15, bodyL * 0.3],
    [-bodyW * 0.3, t.height * 0.15, -bodyL * 0.3],
    [bodyW * 0.3, t.height * 0.15, -bodyL * 0.3],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, ly, lz);
    leg.name = 'leg';
    group.add(leg);
  }

  return group;
}

export class MobManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.mobs = [];
    this.maxMobs = 30;
    this.spawnRadius = 40;
    this.despawnRadius = 60;
    this.spawnTimer = 0;
    this.spawnInterval = 3;
  }

  update(dt, playerPos) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.mobs.length < this.maxMobs) {
      this.spawnTimer = 0;
      this.trySpawnMob(playerPos);
    }

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      this.updateMob(mob, dt, playerPos);

      const dist = mob.group.position.distanceTo(playerPos);
      if (dist > this.despawnRadius) {
        this.scene.remove(mob.group);
        this.mobs.splice(i, 1);
      }
    }
  }

  trySpawnMob(playerPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * (this.spawnRadius - 20);
    const wx = playerPos.x + Math.cos(angle) * dist;
    const wz = playerPos.z + Math.sin(angle) * dist;

    const groundY = this.getGroundHeight(wx, wz);
    if (groundY <= 0) return;

    const block = this.world.getBlock(Math.floor(wx), groundY, Math.floor(wz));
    if (block !== BlockType.GRASS) return;

    const typeKeys = Object.keys(MOB_TYPES);
    const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];

    this.spawnMob(type, wx, groundY + 1, wz);
  }

  getGroundHeight(wx, wz) {
    for (let y = 127; y >= 0; y--) {
      const block = this.world.getBlock(Math.floor(wx), y, Math.floor(wz));
      if (isSolid(block)) return y;
    }
    return 0;
  }

  spawnMob(type, x, y, z) {
    const model = createMobModel(type);
    model.position.set(x, y, z);
    this.scene.add(model);

    this.mobs.push({
      type,
      group: model,
      velocity: new THREE.Vector3(0, 0, 0),
      targetDir: Math.random() * Math.PI * 2,
      wanderTimer: 0,
      pauseTimer: 0,
      isFleeing: false,
      onGround: false,
      health: MOB_TYPES[type].health,
    });
  }

  updateMob(mob, dt, playerPos) {
    const t = MOB_TYPES[mob.type];
    const mobPos = mob.group.position;
    const distToPlayer = mobPos.distanceTo(playerPos);

    if (distToPlayer < 6) {
      const away = new THREE.Vector3().subVectors(mobPos, playerPos).normalize();
      mob.targetDir = Math.atan2(away.x, away.z);
      mob.isFleeing = true;
      mob.pauseTimer = 0;
    } else {
      mob.isFleeing = false;
      mob.wanderTimer -= dt;

      if (mob.wanderTimer <= 0) {
        if (mob.pauseTimer > 0) {
          mob.pauseTimer -= dt;
          mob.wanderTimer = 0.1;
        } else {
          mob.targetDir = Math.random() * Math.PI * 2;
          mob.wanderTimer = 2 + Math.random() * 3;
          if (Math.random() < 0.3) {
            mob.pauseTimer = 1 + Math.random() * 2;
            mob.wanderTimer = 0.1;
          }
        }
      }
    }

    const isMoving = mob.isFleeing || mob.pauseTimer <= 0;

    if (isMoving) {
      const speed = mob.isFleeing ? t.speed * 1.5 : t.speed;
      const dx = Math.sin(mob.targetDir) * speed * dt;
      const dz = Math.cos(mob.targetDir) * speed * dt;

      const newX = mobPos.x + dx;
      const newZ = mobPos.z + dz;

      const bx = Math.floor(newX);
      const bz = Math.floor(newZ);
      const by1 = Math.floor(mobPos.y);
      const by2 = Math.floor(mobPos.y + 1);

      const blocked = isSolid(this.world.getBlock(bx, by1, bz)) ||
                      isSolid(this.world.getBlock(bx, by2, bz)) ||
                      isSolid(this.world.getBlock(bx, by2 + 1, bz));

      if (!blocked) {
        mobPos.x = newX;
        mobPos.z = newZ;
      } else {
        if (mob.onGround && !isSolid(this.world.getBlock(bx, by2 + 2, bz))) {
          mob.velocity.y = 7;
          mob.onGround = false;
        }
        mob.targetDir = Math.random() * Math.PI * 2;
        mob.wanderTimer = 0.5 + Math.random();
      }
    }

    mob.velocity.y -= 20 * dt;
    mobPos.y += mob.velocity.y * dt;

    const groundY = this.getGroundHeight(mobPos.x, mobPos.z);
    const feetPos = groundY + 1;
    if (mobPos.y <= feetPos) {
      mobPos.y = feetPos;
      mob.velocity.y = 0;
      mob.onGround = true;
    }

    let diff = mob.targetDir - mob.group.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    mob.group.rotation.y += diff * Math.min(1, dt * 5);

    const time = performance.now() * 0.001;
    const legSpeed = isMoving ? (mob.isFleeing ? 8 : 4) : 0;
    mob.group.children.forEach((child) => {
      if (child.name === 'leg') {
        const target = Math.sin(time * legSpeed + child.position.x * 3) * 0.4;
        child.rotation.x += (target - child.rotation.x) * 0.15;
      }
      if (child.name === 'head') {
        child.rotation.x = Math.sin(time * 1.5) * 0.05;
      }
      if (child.name === 'tail') {
        child.rotation.x = -0.3 + Math.sin(time * 3) * 0.15;
      }
    });
  }
}

