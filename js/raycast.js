import * as THREE from 'three';
import { isSolid, BlockType } from './blocks.js';
import { CHUNK_HEIGHT } from './chunk.js';

const MAX_REACH = 8;

export function raycastVoxels(origin, direction, world) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = direction.x > 0 ? 1 : -1;
  const stepY = direction.y > 0 ? 1 : -1;
  const stepZ = direction.z > 0 ? 1 : -1;

  const tDeltaX = direction.x !== 0 ? Math.abs(1 / direction.x) : Infinity;
  const tDeltaY = direction.y !== 0 ? Math.abs(1 / direction.y) : Infinity;
  const tDeltaZ = direction.z !== 0 ? Math.abs(1 / direction.z) : Infinity;

  let tMaxX = direction.x !== 0
    ? ((direction.x > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX)
    : Infinity;
  let tMaxY = direction.y !== 0
    ? ((direction.y > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY)
    : Infinity;
  let tMaxZ = direction.z !== 0
    ? ((direction.z > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ)
    : Infinity;

  let prevX = x, prevY = y, prevZ = z;

  for (let i = 0; i < MAX_REACH * 3; i++) {
    const block = world.getBlock(x, y, z);
    if (isSolid(block)) {
      return {
        x, y, z,
        block,
        normal: new THREE.Vector3(prevX - x, prevY - y, prevZ - z),
        distance: origin.distanceTo(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5)),
      };
    }

    prevX = x; prevY = y; prevZ = z;

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        if (tMaxX > MAX_REACH) break;
        x += stepX;
        tMaxX += tDeltaX;
      } else {
        if (tMaxZ > MAX_REACH) break;
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        if (tMaxY > MAX_REACH) break;
        y += stepY;
        tMaxY += tDeltaY;
      } else {
        if (tMaxZ > MAX_REACH) break;
        z += stepZ;
        tMaxZ += tDeltaZ;
      }
    }

    if (y < 0 || y >= CHUNK_HEIGHT) break;
  }

  return null;
}
