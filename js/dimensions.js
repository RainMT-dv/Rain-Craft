import * as THREE from 'three';
import { World } from './world.js';

export class DimensionManager {
  constructor(scene, atlas, seed, seedName) {
    this.scene = scene;
    this.atlas = atlas;
    this.seed = seed;
    this.seedName = seedName;
    this.currentDimension = 'overworld';
    this.dimensions = {};
    this.savedPositions = {};

    this.dimensions.overworld = new World(scene, atlas, seed, seedName, 'overworld');
    this.dimensions.nether = new World(scene, atlas, seed, seedName, 'nether');
    this.dimensions.end = new World(scene, atlas, seed, seedName, 'end');
  }

  get current() {
    return this.dimensions[this.currentDimension];
  }

  switchTo(dimension, player) {
    if (this.currentDimension === dimension) return;
    this.savedPositions[this.currentDimension] = player.position.clone();

    this.current.removeAllChunks();

    this.currentDimension = dimension;
    const world = this.current;

    if (this.savedPositions[dimension]) {
      player.position.copy(this.savedPositions[dimension]);
    } else {
      player.position.set(8.5, world.getSpawnHeight(8, 8), 8.5);
    }
    player.velocity.set(0, 0, 0);
    player.setWorld(world);
    player.inWater = false;

    world.update(player.position.x, player.position.z);
  }
}
