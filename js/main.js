import * as THREE from 'three';
import { createTextureAtlas } from './texture.js';
import { DimensionManager } from './dimensions.js';
import { Player } from './player.js';
import { raycastVoxels } from './raycast.js';
import { DayNightCycle } from './daynight.js';
import { SoundManager } from './sound.js';
import { UI } from './ui.js';
import { Clouds } from './clouds.js';
import { MobManager } from './mobs.js';
import { getBlock, isSolid, BlockType } from './blocks.js';
import { CHUNK_HEIGHT, CHUNK_SIZE } from './chunk.js';

class DebugInfo {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.visible = false;
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position:fixed;top:8px;left:8px;color:white;font:12px/1.6 monospace;
      background:rgba(0,0,0,0.5);padding:8px 12px;border-radius:4px;
      pointer-events:none;z-index:20;display:none;white-space:pre;
      text-shadow:1px 1px 0 black,-1px -1px 0 black,1px -1px 0 black,-1px 1px 0 black;
    `;
    document.body.appendChild(this.el);
  }

  update(dt, player, world, dayNight, targetBlock, mobs) {
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
    if (!this.visible) return;
    const p = player.position;
    const block = world.getBlock(Math.floor(p.x), Math.floor(p.y) - 1, Math.floor(p.z));
    const dimNames = { overworld: 'Overworld', nether: 'Nether', end: 'The End' };
    let text = `Rain's Craft v1.0\n`;
    text += `${this.fps} FPS\n\n`;
    text += `Dimensao: ${dimNames[world.dimension] || world.dimension}\n`;
    text += `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}\n`;
    text += `Bloco sob pes: ${getBlock(block).name}\n`;
    text += `No chao: ${player.onGround ? 'Sim' : 'Nao'}\n`;
    text += `Na agua: ${player.inWater ? 'Sim' : 'Nao'}\n`;
    text += `Mobs: ${mobs ? mobs.mobs.length : 0}\n`;
    text += `Seed: ${world.seedName}\n`;
    const timePercent = Math.round(dayNight.time * 100);
    const timeHours = Math.floor(dayNight.time * 24);
    const timeMinutes = Math.floor((dayNight.time * 24 - timeHours) * 60);
    text += `Hora: ${String(timeHours).padStart(2, '0')}:${String(timeMinutes).padStart(2, '0')}\n`;
    if (targetBlock) {
      const tb = getBlock(targetBlock.block);
      text += `Mirando: ${tb.name} (${targetBlock.x}, ${targetBlock.y}, ${targetBlock.z})\n`;
    }
    this.el.textContent = text;
  }

  toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }
}

class SpawnMenu {
  constructor() {
    this.visible = false;
    this.selectedType = 'cow';
    this.playerPos = null;
    this.playerYaw = 0;
    this.onSpawnClick = null;
    this.onClose = null;
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      background:rgba(0,0,0,0.85);color:white;font:14px/1.6 monospace;
      padding:20px 28px;border-radius:8px;z-index:200;display:none;
      border:2px solid rgba(255,255,255,0.2);min-width:250px;
      pointer-events:auto;
    `;
    document.body.appendChild(this.el);
    this.render();
  }

  render() {
    const types = [
      { key: '1', name: 'Vaca', type: 'cow', color: '#8B4513' },
      { key: '2', name: 'Porco', type: 'pig', color: '#FFA0B0' },
      { key: '3', name: 'Galinha', type: 'chicken', color: '#F0F0F0' },
    ];
    let html = `<div style="text-align:center;margin-bottom:12px;font-size:16px;color:#4CAF50;">Spawnar Animal</div>`;
    for (const t of types) {
      const sel = this.selectedType === t.type;
      const bg = sel ? 'rgba(76,175,80,0.4)' : 'rgba(255,255,255,0.1)';
      const border = sel ? '2px solid #4CAF50' : '2px solid transparent';
      html += `<div style="padding:6px 10px;margin:4px 0;border-radius:4px;background:${bg};border:${border};cursor:pointer;" data-type="${t.type}">
        <span style="color:${t.color};font-weight:bold;">[${t.key}]</span> ${t.name}
      </div>`;
    }
    html += `<div style="text-align:center;margin-top:14px;">
      <button id="spawn-btn" style="padding:8px 24px;font:14px monospace;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">Spawnar [G]</button>
      &nbsp; <button id="close-menu-btn" style="padding:8px 16px;font:14px monospace;background:#555;color:white;border:none;border-radius:4px;cursor:pointer;">Fechar [M]</button>
    </div>`;
    this.el.innerHTML = html;

    this.el.querySelectorAll('[data-type]').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedType = el.dataset.type;
        this.render();
      });
    });

    this.el.querySelector('#spawn-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.doSpawn();
    });
    this.el.querySelector('#close-menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.doClose();
    });
  }

  doSpawn() {
    if (this.onSpawnClick) this.onSpawnClick();
  }

  doClose() {
    if (this.onClose) this.onClose();
  }

  toggle(playerPos, exitPointerLock, playerYaw) {
    if (this.visible) {
      this.hide();
    } else {
      this.visible = true;
      this.playerPos = playerPos.clone();
      this.playerYaw = playerYaw;
      this.render();
      this.el.style.display = 'block';
      exitPointerLock();
    }
  }

  hide() {
    this.visible = false;
    this.el.style.display = 'none';
  }
}

export class Game {
  constructor(seed = 12345, seedName = '12345') {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);

    this.atlas = createTextureAtlas();
    this.dims = new DimensionManager(this.scene, this.atlas, seed, seedName);
    this.player = new Player(this.camera, this.dims.current);
    this.dayNight = new DayNightCycle(this.scene);
    this.sound = new SoundManager();
    this.clouds = new Clouds(this.scene);
    this.mobs = new MobManager(this.scene, this.dims.current);
    this.ui = new UI(this.atlas);
    this.debug = new DebugInfo();
    this.spawnMenu = new SpawnMenu();
    this.spawnMenu.onSpawnClick = () => {
      const yaw = this.player.rotation.yaw;
      const wx = this.player.position.x - Math.sin(yaw) * 2;
      const wz = this.player.position.z - Math.cos(yaw) * 2;
      this.mobs.spawnMob(this.spawnMenu.selectedType, wx, this.player.position.y, wz);
      this.spawnMenu.hide();
      this.renderer.domElement.requestPointerLock();
    };
    this.spawnMenu.onClose = () => {
      this.spawnMenu.hide();
      this.renderer.domElement.requestPointerLock();
    };

    this.highlightMesh = this.createHighlight();
    this.targetBlock = null;
    this.footstepTimer = 0;
    this.footstepInterval = 0.4;
    this.lastTime = performance.now();
    this.locked = false;

    this.dimConfigs = {
      overworld: { sky: 0x87ceeb, fog: 0x87ceeb, fogDensity: 0.015, sunColor: 0xffffff, ambientIntensity: 0.4 },
      nether: { sky: 0x1a0000, fog: 0x330000, fogDensity: 0.03, sunColor: 0xff4400, ambientIntensity: 0.6 },
      end: { sky: 0x000011, fog: 0x0a0020, fogDensity: 0.02, sunColor: 0x8866cc, ambientIntensity: 0.3 },
    };

    this.setupPointerLock();
    this.setupBlockInteraction();
    this.setupResize();
    this.setupDimensionKeys();
    this.setupSpawnMenu();

    this.camera.position.set(8.5, 70, 8.5);
    this.camera.lookAt(0, 60, 0);
    this.dims.current.update(8, 8);
    this.waitForSpawn();
  }

  waitForSpawn() {
    const spawnX = 8, spawnZ = 8;
    const cx = Math.floor(spawnX / CHUNK_SIZE);
    const cz = Math.floor(spawnZ / CHUNK_SIZE);
    const loop = () => {
      this.dims.current.update(spawnX, spawnZ);
      this.renderer.render(this.scene, this.camera);
      const chunk = this.dims.current.getChunk(cx, cz);
      if (chunk && chunk.generated) {
        const h = this.dims.current.getSpawnHeight(spawnX, spawnZ);
        this.player.position.set(spawnX + 0.5, h + 1, spawnZ + 0.5);
        this.animate();
      } else {
        requestAnimationFrame(loop);
      }
    };
    loop();
  }

  createHighlight() {
    const geo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.5 });
    const mesh = new THREE.LineSegments(edges, mat);
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  setupPointerLock() {
    const canvas = this.renderer.domElement;
    const overlay = this.ui.instructionsOverlay;
    const requestLock = () => { if (!this.locked) canvas.requestPointerLock(); };
    canvas.addEventListener('click', requestLock);
    overlay.addEventListener('click', requestLock);
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.player.locked = this.locked;
      if (this.locked) { this.sound.init(); this.ui.hideInstructions(); }
      else if (!this.spawnMenu.visible) { this.ui.showInstructions(); }
    });
  }

  setupBlockInteraction() {
    document.addEventListener('mousedown', (e) => {
      if (!this.locked || !this.targetBlock) return;
      const t = this.targetBlock;
      if (e.button === 0) {
        this.dims.current.setBlock(t.x, t.y, t.z, BlockType.AIR);
        this.sound.playBlockBreak();
      } else if (e.button === 2) {
        const px = t.x + t.normal.x;
        const py = t.y + t.normal.y;
        const pz = t.z + t.normal.z;
        const pp = this.player.position;
        const halfW = 0.3;
        if (px + 1 > pp.x - halfW && px < pp.x + halfW &&
            py + 1 > pp.y && py < pp.y + 1.8 &&
            pz + 1 > pp.z - halfW && pz < pp.z + halfW) return;
        if (py >= 0 && py < CHUNK_HEIGHT) {
          this.dims.current.setBlock(px, py, pz, this.ui.getSelectedBlock());
          this.sound.playBlockPlace();
        }
      }
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupDimensionKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'F3') { e.preventDefault(); this.debug.toggle(); return; }

      if (e.code === 'KeyM') {
        e.preventDefault();
        if (this.spawnMenu.visible) {
          this.spawnMenu.hide();
          this.renderer.domElement.requestPointerLock();
        } else {
          this.spawnMenu.toggle(this.player.position, () => document.exitPointerLock(), this.player.rotation.yaw);
        }
        return;
      }

      if (this.spawnMenu.visible) {
        if (e.key === 'g' || e.key === 'G' || e.code === 'KeyG' || e.code === 'Enter') {
          e.preventDefault();
          this.spawnMenu.doSpawn();
        }
        if (e.key === '1') { this.spawnMenu.selectedType = 'cow'; this.spawnMenu.render(); }
        if (e.key === '2') { this.spawnMenu.selectedType = 'pig'; this.spawnMenu.render(); }
        if (e.key === '3') { this.spawnMenu.selectedType = 'chicken'; this.spawnMenu.render(); }
        return;
      }

      if (!this.locked) return;
      if (e.key === 'g' || e.key === 'G' || e.code === 'KeyG') {
        e.preventDefault();
        const yaw = this.player.rotation.yaw;
        const wx = this.player.position.x - Math.sin(yaw) * 2;
        const wz = this.player.position.z - Math.cos(yaw) * 2;
        this.mobs.spawnMob(this.spawnMenu.selectedType, wx, this.player.position.y, wz);
      }

      if (!this.locked) return;
      if (e.code === 'KeyT') {
        this.switchDimension('end');
      } else if (e.code === 'KeyN') {
        this.switchDimension('nether');
      } else if (e.code === 'KeyO') {
        this.switchDimension('overworld');
      }
    });
  }

  setupSpawnMenu() {}

  switchDimension(dim) {
    this.spawnMenu.hide();
    this.dims.switchTo(dim, this.player);
    this.mobs = new MobManager(this.scene, this.dims.current);
    this.spawnMenu.onSpawnClick = () => {
      const yaw = this.player.rotation.yaw;
      const wx = this.player.position.x - Math.sin(yaw) * 2;
      const wz = this.player.position.z - Math.cos(yaw) * 2;
      this.mobs.spawnMob(this.spawnMenu.selectedType, wx, this.player.position.y, wz);
      this.spawnMenu.hide();
      this.renderer.domElement.requestPointerLock();
    };
    this.spawnMenu.onClose = () => {
      this.spawnMenu.hide();
      this.renderer.domElement.requestPointerLock();
    };

    const cfg = this.dimConfigs[dim];
    this.scene.background = new THREE.Color(cfg.sky);
    this.scene.fog = new THREE.FogExp2(cfg.fog, cfg.fogDensity);

    if (dim === 'overworld') {
      this.dayNight.enabled = true;
      this.clouds.mesh.visible = true;
    } else {
      this.dayNight.enabled = false;
      this.dayNight.setFixedColor(cfg.sky, cfg.sunColor);
      this.clouds.mesh.visible = false;
    }
  }

  updateRaycast() {
    const origin = this.camera.position.clone();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const hit = raycastVoxels(origin, direction, this.dims.current);
    if (hit) {
      this.targetBlock = hit;
      this.highlightMesh.visible = true;
      this.highlightMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    } else {
      this.targetBlock = null;
      this.highlightMesh.visible = false;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.locked && !this.spawnMenu.visible) this.player.update(dt);
    if (!this.spawnMenu.visible) {
      this.dims.current.update(this.player.position.x, this.player.position.z);
      this.mobs.update(dt, this.player.position);
    }
    this.dayNight.update(dt);
    this.clouds.update(dt);
    this.updateRaycast();
    this.debug.update(dt, this.player, this.dims.current, this.dayNight, this.targetBlock, this.mobs);

    if (this.locked && this.player.isMoving) {
      this.footstepTimer += dt;
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        this.sound.playFootstep();
      }
    } else {
      this.footstepTimer = this.footstepInterval * 0.9;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
