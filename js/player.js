import * as THREE from 'three';
import { isSolid, isLiquid, BlockType } from './blocks.js';
import { CHUNK_HEIGHT } from './chunk.js';

const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;
const GRAVITY = -28;
const WATER_GRAVITY = -4;
const JUMP_VELOCITY = 9;
const SWIM_UP_VELOCITY = 6;
const MOVE_SPEED = 5.5;
const WATER_MOVE_SPEED = 3.0;
const SPRINT_MULT = 1.6;
const MOUSE_SENSITIVITY = 0.002;
const TERMINAL_VELOCITY = -50;
const WATER_TERMINAL = -3;
const MAX_STEP = 0.4;

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;

    this.position = new THREE.Vector3(0, 80, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = { yaw: 0, pitch: 0 };
    this.onGround = false;
    this.inWater = false;

    this.keys = {};
    this.locked = false;
    this.isMoving = false;

    this.setupControls();
  }

  setWorld(world) {
    this.world = world;
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.rotation.yaw -= e.movementX * MOUSE_SENSITIVITY;
      this.rotation.pitch -= e.movementY * MOUSE_SENSITIVITY;
      this.rotation.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.rotation.pitch));
    });
  }

  isPlayerInWater() {
    const halfW = PLAYER_WIDTH / 2;
    const checks = [
      [this.position.x, this.position.y + 0.5, this.position.z],
      [this.position.x - halfW, this.position.y + 0.5, this.position.z],
      [this.position.x + halfW, this.position.y + 0.5, this.position.z],
      [this.position.x, this.position.y + 0.5, this.position.z - halfW],
      [this.position.x, this.position.y + 0.5, this.position.z + halfW],
    ];
    for (const [px, py, pz] of checks) {
      if (isLiquid(this.world.getBlock(Math.floor(px), Math.floor(py), Math.floor(pz)))) {
        return true;
      }
    }
    return false;
  }

  update(dt) {
    dt = Math.min(dt, 0.05);

    this.inWater = this.isPlayerInWater();

    const forward = new THREE.Vector3(
      -Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw)
    ).normalize();
    const right = new THREE.Vector3(
      Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw)
    ).normalize();

    const baseSpeed = this.inWater ? WATER_MOVE_SPEED : MOVE_SPEED;
    const speed = baseSpeed * (this.keys['ShiftLeft'] ? SPRINT_MULT : 1);
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyD']) moveDir.add(right);
    if (this.keys['KeyA']) moveDir.sub(right);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    this.isMoving = moveDir.lengthSq() > 0 && (this.onGround || this.inWater);

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    if (this.inWater) {
      if (this.keys['Space']) {
        this.velocity.y = SWIM_UP_VELOCITY;
      } else {
        this.velocity.y += WATER_GRAVITY * dt;
      }
      this.velocity.y = Math.max(this.velocity.y, WATER_TERMINAL);
      this.velocity.y = Math.min(this.velocity.y, SWIM_UP_VELOCITY);
    } else {
      if (this.keys['Space'] && this.onGround) {
        this.velocity.y = JUMP_VELOCITY;
        this.onGround = false;
      }
      this.velocity.y += GRAVITY * dt;
      if (this.velocity.y < TERMINAL_VELOCITY) this.velocity.y = TERMINAL_VELOCITY;
    }

    const totalDx = this.velocity.x * dt;
    const totalDy = this.velocity.y * dt;
    const totalDz = this.velocity.z * dt;

    this.moveAxisSubstep(0, totalDx);
    this.moveAxisSubstep(1, totalDy);
    this.moveAxisSubstep(2, totalDz);

    if (this.position.y < -10) {
      this.position.y = 100;
      this.velocity.y = 0;
    }

    const q = new THREE.Quaternion();
    q.setFromEuler(new THREE.Euler(this.rotation.pitch, this.rotation.yaw, 0, 'YXZ'));
    this.camera.quaternion.copy(q);
    this.camera.position.copy(this.position).add(new THREE.Vector3(0, EYE_HEIGHT, 0));
  }

  moveAxisSubstep(axis, totalDelta) {
    const axes = ['x', 'y', 'z'];
    const a = axes[axis];

    if (Math.abs(totalDelta) < 0.0001) {
      if (a === 'y') {
        this.onGround = false;
        this.checkGround();
      }
      return;
    }

    const steps = Math.max(1, Math.ceil(Math.abs(totalDelta) / MAX_STEP));
    const stepSize = totalDelta / steps;

    for (let s = 0; s < steps; s++) {
      this.position[a] += stepSize;

      if (a === 'y') {
        this.onGround = false;
      }

      if (this.checkCollisionAxis(axis)) {
        break;
      }
    }
  }

  checkCollisionAxis(axis) {
    const halfW = PLAYER_WIDTH / 2;
    const axes = ['x', 'y', 'z'];
    const a = axes[axis];

    const x0 = this.position.x - halfW;
    const x1 = this.position.x + halfW - 0.001;
    const y0 = this.position.y;
    const y1 = this.position.y + PLAYER_HEIGHT - 0.001;
    const z0 = this.position.z - halfW;
    const z1 = this.position.z + halfW - 0.001;

    const bx0 = Math.floor(x0);
    const bx1 = Math.floor(x1);
    const by0 = Math.floor(y0);
    const by1 = Math.floor(y1);
    const bz0 = Math.floor(z0);
    const bz1 = Math.floor(z1);

    for (let bx = bx0; bx <= bx1; bx++) {
      for (let by = by0; by <= by1; by++) {
        for (let bz = bz0; bz <= bz1; bz++) {
          if (by < 0 || by >= CHUNK_HEIGHT) continue;
          if (!isSolid(this.world.getBlock(bx, by, bz))) continue;

          if (x1 > bx && x0 < bx + 1 &&
              y1 > by && y0 < by + 1 &&
              z1 > bz && z0 < bz + 1) {

            if (a === 'x') {
              if (this.velocity.x > 0) {
                this.position.x = bx - halfW;
              } else if (this.velocity.x < 0) {
                this.position.x = bx + 1 + halfW;
              }
              this.velocity.x = 0;
              return true;
            } else if (a === 'y') {
              if (this.velocity.y < 0) {
                this.position.y = by + 1;
                this.onGround = true;
              } else if (this.velocity.y > 0) {
                this.position.y = by - PLAYER_HEIGHT;
              }
              this.velocity.y = 0;
              return true;
            } else {
              if (this.velocity.z > 0) {
                this.position.z = bz - halfW;
              } else if (this.velocity.z < 0) {
                this.position.z = bz + 1 + halfW;
              }
              this.velocity.z = 0;
              return true;
            }
          }
        }
      }
    }

    if (a === 'y' && this.position.y < 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.onGround = true;
      return true;
    }

    return false;
  }

  checkGround() {
    const halfW = PLAYER_WIDTH / 2;
    const testY = this.position.y - 0.05;
    const x0 = this.position.x - halfW;
    const x1 = this.position.x + halfW - 0.001;
    const z0 = this.position.z - halfW;
    const z1 = this.position.z + halfW - 0.001;

    const bx0 = Math.floor(x0);
    const bx1 = Math.floor(x1);
    const by = Math.floor(testY);
    const bz0 = Math.floor(z0);
    const bz1 = Math.floor(z1);

    for (let bx = bx0; bx <= bx1; bx++) {
      for (let bz = bz0; bz <= bz1; bz++) {
        if (by < 0 || by >= CHUNK_HEIGHT) continue;
        if (isSolid(this.world.getBlock(bx, by, bz))) {
          this.onGround = true;
          return;
        }
      }
    }
  }

  getForward() {
    return new THREE.Vector3(
      -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
      Math.sin(this.rotation.pitch),
      -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
    ).normalize();
  }
}
