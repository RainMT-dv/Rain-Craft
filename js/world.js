import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT, buildChunkMesh } from './chunk.js';
import { createNoise } from './noise.js';
import { BlockType, isSolid } from './blocks.js';

const RENDER_DISTANCE = 8;
const WATER_LEVEL = 36;
const BASE_HEIGHT = 40;
const HEIGHT_AMP = 25;

export class World {
  constructor(scene, atlas, seed = 12345, seedName = '12345', dimension = 'overworld') {
    this.scene = scene;
    this.atlas = atlas;
    this.seed = seed;
    this.seedName = seedName;
    this.dimension = dimension;
    this.chunks = new Map();
    this.noise = createNoise(seed + (dimension === 'overworld' ? 0 : dimension === 'nether' ? 1000 : 2000));
    this.generateQueue = [];
    this.pendingTrees = [];
    this.solidMaterial = new THREE.MeshLambertMaterial({ map: atlas.texture, alphaTest: 0.5, side: THREE.FrontSide });
    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: atlas.texture,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  chunkKey(cx, cz) { return `${cx},${cz}`; }
  getChunk(cx, cz) { return this.chunks.get(this.chunkKey(cx, cz)); }

  getBlock(wx, wy, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk || !chunk.generated) return BlockType.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, wy, lz);
  }

  setBlock(wx, wy, wz, type) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, type);
    this.rebuildChunkMesh(cx, cz);
    if (lx === 0) this.rebuildChunkMesh(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.rebuildChunkMesh(cx + 1, cz);
    if (lz === 0) this.rebuildChunkMesh(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.rebuildChunkMesh(cx, cz + 1);
  }

  setBlockNoRebuild(wx, wy, wz, type) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, type);
  }

  generateTerrain(chunk) {
    if (this.dimension === 'nether') {
      this.generateNether(chunk);
    } else if (this.dimension === 'end') {
      this.generateEnd(chunk);
    } else {
      this.generateOverworld(chunk);
    }
    chunk.generated = true;
  }

  generateOverworld(chunk) {
    const wx0 = chunk.cx * CHUNK_SIZE;
    const wz0 = chunk.cz * CHUNK_SIZE;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        const h = this.getHeight(wx, wz);
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let block = BlockType.AIR;
          if (y === 0) {
            block = BlockType.BEDROCK;
          } else if (y < h - 4) {
            block = BlockType.STONE;
          } else if (y < h) {
            block = BlockType.DIRT;
          } else if (y === h) {
            const temp = this.noise.noise2D(wx * 0.005, wz * 0.005);
            if (h <= WATER_LEVEL) block = BlockType.SAND;
            else if (temp > 0.4 && h > 55) block = BlockType.SNOW;
            else block = BlockType.GRASS;
          } else if (y <= WATER_LEVEL && y > h) {
            block = BlockType.WATER;
          }
          if (block === BlockType.STONE && y > 2 && y < h - 2) {
            const ore3d = this.noise.noise3D(wx * 0.1, y * 0.1, wz * 0.1);
            if (ore3d > 0.7 && Math.random() < 0.1) block = BlockType.COAL_ORE;
            else if (ore3d > 0.75 && Math.random() < 0.05) block = BlockType.IRON_ORE;
            else if (ore3d > 0.8 && y < 32 && Math.random() < 0.03) block = BlockType.GOLD_ORE;
            else if (ore3d > 0.85 && y < 16 && Math.random() < 0.01) block = BlockType.DIAMOND_ORE;
          }
          if (y > 2 && y < 20 && h > WATER_LEVEL) {
            const cave = this.noise.noise3D(wx * 0.05, y * 0.08, wz * 0.05);
            if (cave > 0.55 && block !== BlockType.BEDROCK) block = BlockType.AIR;
          }
          chunk.setBlock(lx, y, lz, block);
        }
        if (h > WATER_LEVEL + 1) {
          const temp = this.noise.noise2D(wx * 0.005, wz * 0.005);
          if (temp <= 0.4 || h <= 55) this.recordTree(wx, h + 1, wz);
        }
      }
    }
  }

  generateNether(chunk) {
    const wx0 = chunk.cx * CHUNK_SIZE;
    const wz0 = chunk.cz * CHUNK_SIZE;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        const noiseVal = this.noise.fbm2D(wx * 0.02, wz * 0.02, 4);
        const baseH = 40 + noiseVal * 20;
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let block = BlockType.AIR;
          if (y < 5) {
            block = BlockType.BEDROCK;
          } else if (y < baseH - 2) {
            block = BlockType.NETHERRACK;
          } else if (y < baseH) {
            const nylium = this.noise.noise2D(wx * 0.1, wz * 0.1);
            if (nylium > 0.3) block = BlockType.CRIMSON_NYLIUM;
            else if (nylium < -0.3) block = BlockType.WARPED_NYLIUM;
            else block = BlockType.NETHERRACK;
          } else if (y < 32 && y > baseH && this.noise.noise3D(wx * 0.04, y * 0.06, wz * 0.04) > 0.6) {
            block = BlockType.SOUL_SAND;
          }
          if (block === BlockType.NETHERRACK && y > 6 && y < baseH - 3) {
            const ore3d = this.noise.noise3D(wx * 0.08, y * 0.08, wz * 0.08);
            if (ore3d > 0.7 && Math.random() < 0.05) block = BlockType.GLOWSTONE;
            else if (ore3d > 0.75 && Math.random() < 0.03) block = BlockType.NETHER_BRICK;
          }
          if (y < baseH && this.noise.noise3D(wx * 0.06, y * 0.08, wz * 0.06) > 0.6) {
            block = BlockType.AIR;
          }
          chunk.setBlock(lx, y, lz, block);
        }
      }
    }
  }

  generateEnd(chunk) {
    const wx0 = chunk.cx * CHUNK_SIZE;
    const wz0 = chunk.cz * CHUNK_SIZE;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = wx0 + lx;
        const wz = wz0 + lz;
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          chunk.setBlock(lx, y, lz, BlockType.AIR);
        }
        const distFromCenter = Math.sqrt(wx * wx + wz * wz);
        if (distFromCenter < 3) {
          for (let y = 0; y <= 64; y++) {
            chunk.setBlock(lx, y, lz, BlockType.OBSIDIAN);
          }
          continue;
        }
        const islandNoise = this.noise.noise2D(wx * 0.03, wz * 0.03);
        const islandSize = 8 + this.noise.noise2D(wx * 0.01, wz * 0.01) * 12;
        const edgeDist = islandSize - distFromCenter % islandSize;
        if (islandNoise > 0.1 && edgeDist > 0) {
          const islandH = 50 + this.noise.fbm2D(wx * 0.05, wz * 0.05, 3) * 8;
          for (let y = 0; y < CHUNK_HEIGHT; y++) {
            let block = BlockType.AIR;
            if (y < 10) block = BlockType.BEDROCK;
            else if (y < islandH - 2) block = BlockType.END_STONE;
            else if (y < islandH) block = BlockType.END_STONE;
            if (y === Math.floor(islandH) && Math.random() < 0.005 && distFromCenter > 15) {
              block = BlockType.PURPUR;
              for (let py = 1; py <= 4 + Math.random() * 6 | 0; py++) {
                chunk.setBlock(lx, y + py, lz, BlockType.PURPUR);
              }
            }
            chunk.setBlock(lx, y, lz, block);
          }
        }
      }
    }
  }

  recordTree(wx, y, wz) {
    const treeNoise = this.noise.noise2D(wx * 0.5, wz * 0.5);
    if (treeNoise < 0.3) return;
    const chunk = this.getChunk(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE));
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (lx < 2 || lx >= CHUNK_SIZE - 2 || lz < 2 || lz >= CHUNK_SIZE - 2) return;
    if (Math.random() > 0.02) return;
    const trunkHeight = 4 + (Math.random() * 3) | 0;
    this.pendingTrees.push({ wx, y, wz, trunkHeight });
  }

  placePendingTrees() {
    const trees = this.pendingTrees;
    this.pendingTrees = [];
    for (const tree of trees) {
      const { wx, y, wz, trunkHeight } = tree;
      for (let ty = 0; ty < trunkHeight; ty++) {
        this.setBlockNoRebuild(wx, y + ty, wz, BlockType.OAK_LOG);
      }
      const leafStart = y + trunkHeight - 2;
      const leafEnd = y + trunkHeight + 1;
      for (let ly = leafStart; ly <= leafEnd; ly++) {
        const radius = ly < leafEnd ? 2 : 1;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (dx === 0 && dz === 0 && ly < y + trunkHeight) continue;
            if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() > 0.6) continue;
            const lwx = wx + dx;
            const lwz = wz + dz;
            if (this.getBlock(lwx, ly, lwz) === BlockType.AIR) {
              this.setBlockNoRebuild(lwx, ly, lwz, BlockType.LEAVES);
            }
          }
        }
      }
    }
    const dirtyChunks = new Set();
    for (const tree of trees) {
      const cx = Math.floor(tree.wx / CHUNK_SIZE);
      const cz = Math.floor(tree.wz / CHUNK_SIZE);
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          dirtyChunks.add(this.chunkKey(cx + dx, cz + dz));
        }
      }
    }
    for (const key of dirtyChunks) {
      const [cx, cz] = key.split(',').map(Number);
      this.rebuildChunkMesh(cx, cz);
    }
  }

  getHeight(wx, wz) {
    const scale1 = 0.01;
    const scale2 = 0.03;
    const scale3 = 0.005;
    let h = BASE_HEIGHT;
    h += this.noise.fbm2D(wx * scale1, wz * scale1, 4) * HEIGHT_AMP;
    h += this.noise.noise2D(wx * scale2, wz * scale2) * 8;
    h += this.noise.noise2D(wx * scale3, wz * scale3) * 15;
    return Math.max(1, Math.min(CHUNK_HEIGHT - 2, Math.round(h)));
  }

  getNeighborBlock = (wx, wy, wz) => {
    return this.getBlock(wx, wy, wz);
  };

  rebuildChunkMesh(cx, cz) {
    const chunk = this.getChunk(cx, cz);
    if (!chunk || !chunk.generated) return;
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }
    if (chunk.waterMesh) {
      this.scene.remove(chunk.waterMesh);
      chunk.waterMesh.geometry.dispose();
      chunk.waterMesh = null;
    }
    const { solid, water } = buildChunkMesh(chunk, this.getNeighborBlock, this.atlas);
    if (solid) {
      chunk.mesh = new THREE.Mesh(solid, this.solidMaterial);
      chunk.mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
      chunk.mesh.matrixAutoUpdate = false;
      chunk.mesh.updateMatrix();
      this.scene.add(chunk.mesh);
    }
    if (water) {
      chunk.waterMesh = new THREE.Mesh(water, this.waterMaterial);
      chunk.waterMesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
      chunk.waterMesh.matrixAutoUpdate = false;
      chunk.waterMesh.updateMatrix();
      this.scene.add(chunk.waterMesh);
    }
    chunk.dirty = false;
  }

  removeAllChunks() {
    for (const [key, chunk] of this.chunks) {
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
      }
      if (chunk.waterMesh) {
        this.scene.remove(chunk.waterMesh);
        chunk.waterMesh.geometry.dispose();
      }
    }
    this.chunks.clear();
    this.generateQueue = [];
    this.pendingTrees = [];
  }

  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);
    const needed = new Set();
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE) continue;
        needed.add(this.chunkKey(pcx + dx, pcz + dz));
      }
    }
    for (const key of needed) {
      if (!this.chunks.has(key)) {
        const [cx, cz] = key.split(',').map(Number);
        const chunk = new Chunk(cx, cz);
        this.chunks.set(key, chunk);
        this.generateQueue.push(chunk);
      }
    }
    let generated = 0;
    while (this.generateQueue.length > 0 && generated < 2) {
      const chunk = this.generateQueue.shift();
      if (!needed.has(this.chunkKey(chunk.cx, chunk.cz))) continue;
      this.generateTerrain(chunk);
      this.rebuildChunkMesh(chunk.cx, chunk.cz);
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [ddx, ddz] of dirs) {
        const nb = this.getChunk(chunk.cx + ddx, chunk.cz + ddz);
        if (nb && nb.generated) this.rebuildChunkMesh(chunk.cx + ddx, chunk.cz + ddz);
      }
      generated++;
    }
    if (this.pendingTrees.length > 0) this.placePendingTrees();
    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        if (chunk.mesh) { this.scene.remove(chunk.mesh); chunk.mesh.geometry.dispose(); }
        if (chunk.waterMesh) { this.scene.remove(chunk.waterMesh); chunk.waterMesh.geometry.dispose(); }
        this.chunks.delete(key);
      }
    }
  }

  getSpawnHeight(x, z) {
    if (this.dimension === 'nether') return 50;
    if (this.dimension === 'end') return 68;
    const h = this.getHeight(x, z);
    return Math.max(h + 2, WATER_LEVEL + 2);
  }
}
