import * as THREE from 'three';

export class Clouds {
  constructor(scene, seed = 42) {
    this.scene = scene;
    this.offset = 0;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const simplex = this.simplex2D(seed);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const nx = x / 256;
        const ny = y / 256;
        let v = 0;
        v += simplex(nx * 3, ny * 3) * 0.5;
        v += simplex(nx * 6, ny * 6) * 0.25;
        v += simplex(nx * 12, ny * 12) * 0.125;
        v = (v + 1) / 2;
        const alpha = v > 0.5 ? (v - 0.5) * 2 * 180 : 0;
        ctx.fillStyle = `rgba(255,255,255,${alpha / 255})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const geo = new THREE.PlaneGeometry(512, 512);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 110;
    scene.add(this.mesh);
  }

  update(dt) {
    this.offset += dt * 0.5;
    this.mesh.material.map.offset.x = this.offset * 0.001;
    this.mesh.material.map.offset.y = this.offset * 0.0005;
  }

  simplex2D(seed) {
    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

    const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
    const F = 0.5 * (Math.sqrt(3) - 1);
    const G = (3 - Math.sqrt(3)) / 6;

    return (x, y) => {
      const s = (x + y) * F;
      const i = Math.floor(x + s);
      const j = Math.floor(y + s);
      const t = (i + j) * G;
      const x0 = x - (i - t);
      const y0 = y - (j - t);
      const i1 = x0 > y0 ? 1 : 0;
      const j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G;
      const y1 = y0 - j1 + G;
      const x2 = x0 - 1 + 2 * G;
      const y2 = y0 - 1 + 2 * G;
      const ii = i & 255;
      const jj = j & 255;

      let n0 = 0, n1 = 0, n2 = 0;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) { t0 *= t0; const g = grad[perm[ii + perm[jj]] % 8]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) { t1 *= t1; const g = grad[perm[ii + i1 + perm[jj + j1]] % 8]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) { t2 *= t2; const g = grad[perm[ii + 1 + perm[jj + 1]] % 8]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }

      return 70 * (n0 + n1 + n2);
    };
  }
}
