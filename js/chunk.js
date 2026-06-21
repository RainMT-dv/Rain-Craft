import * as THREE from 'three';
import { getBlock, isSolid, isTransparent, isLiquid, BlockType } from './blocks.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    this.mesh = null;
    this.waterMesh = null;
    this.dirty = true;
    this.generated = false;
  }

  index(x, y, z) {
    return (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE)
      return BlockType.AIR;
    return this.blocks[this.index(x, y, z)];
  }

  setBlock(x, y, z, type) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.blocks[this.index(x, y, z)] = type;
    this.dirty = true;
  }
}

// Face definitions: [dx,dy,dz, vertices (4 corners), normal]
const FACES = [
  { dir: [0, 1, 0], name: 'top', corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], normal: [0,1,0] },
  { dir: [0,-1, 0], name: 'bottom', corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], normal: [0,-1,0] },
  { dir: [0, 0, 1], name: 'front', corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], normal: [0,0,1] },
  { dir: [0, 0,-1], name: 'back', corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], normal: [0,0,-1] },
  { dir: [1, 0, 0], name: 'right', corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], normal: [1,0,0] },
  { dir: [-1, 0, 0], name: 'left', corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], normal: [-1,0,0] },
];

function getFaceTex(block, faceName) {
  const b = getBlock(block);
  if (faceName === 'top') return b.texTop;
  if (faceName === 'bottom') return b.texBottom;
  return b.texSide;
}

export function buildChunkMesh(chunk, getNeighborBlock, atlas) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const waterPositions = [];
  const waterNormals = [];
  const waterUvs = [];
  const waterIndices = [];

  let vertexCount = 0;
  let waterVertexCount = 0;

  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const block = chunk.getBlock(x, y, z);
        if (block === BlockType.AIR) continue;

        const blockDef = getBlock(block);
        const isWater = blockDef.liquid;
        const targetPositions = isWater ? waterPositions : positions;
        const targetNormals = isWater ? waterNormals : normals;
        const targetUvs = isWater ? waterUvs : uvs;
        const targetIndices = isWater ? waterIndices : indices;

        for (const face of FACES) {
          const nx = x + face.dir[0];
          const ny = y + face.dir[1];
          const nz = z + face.dir[2];

          let neighbor;
          if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) {
            const wx = chunk.cx * CHUNK_SIZE + nx;
            const wz = chunk.cz * CHUNK_SIZE + nz;
            neighbor = getNeighborBlock(wx, ny, wz);
          } else if (ny < 0 || ny >= CHUNK_HEIGHT) {
            neighbor = BlockType.AIR;
          } else {
            neighbor = chunk.getBlock(nx, ny, nz);
          }

          if (isWater) {
            if (neighbor === block) continue;
            if (isSolid(neighbor)) continue;
          } else {
            if (!isTransparent(neighbor)) continue;
          }

          const texIdx = getFaceTex(block, face.name);
          const { u0, v0, u1, v1 } = atlas.getUV(texIdx);

          const faceUvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

          const vc = isWater ? waterVertexCount : vertexCount;
          for (let i = 0; i < 4; i++) {
            const c = face.corners[i];
            targetPositions.push(x + c[0], y + c[1], z + c[2]);
            targetNormals.push(face.normal[0], face.normal[1], face.normal[2]);
            targetUvs.push(faceUvs[i][0], faceUvs[i][1]);
          }

          targetIndices.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
          if (isWater) waterVertexCount += 4;
          else vertexCount += 4;
        }
      }
    }
  }

  return {
    solid: createGeometry(positions, normals, uvs, indices),
    water: createGeometry(waterPositions, waterNormals, waterUvs, waterIndices),
  };
}

function createGeometry(positions, normals, uvs, indices) {
  if (indices.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}
