import * as THREE from 'three';
import { BLOCK_SIZE } from './blocks.js';

const ATLAS_COLS = 8;
const ATLAS_ROWS = 4;
const W = ATLAS_COLS * BLOCK_SIZE;
const H = ATLAS_ROWS * BLOCK_SIZE;

function rand(n) { return (Math.random() * n) | 0; }
function clamp(v) { return Math.max(0, Math.min(255, v)); }
function mix(a, b, t) { return a + (b - a) * t; }

export function createTextureAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;

  function setPixel(x, y, r, g, b, a = 255) {
    const i = (y * W + x) * 4;
    d[i] = clamp(r); d[i+1] = clamp(g); d[i+2] = clamp(b); d[i+3] = a;
  }

  function tex(idx, fn) {
    const col = idx % ATLAS_COLS;
    const row = (idx / ATLAS_COLS) | 0;
    const ox = col * BLOCK_SIZE;
    const oy = row * BLOCK_SIZE;
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const c = fn(x, y);
        setPixel(ox + x, oy + y, c[0], c[1], c[2], c[3] || 255);
      }
  }

  function stoneBase(x, y) {
    const v = 130
      + Math.sin(x * Math.PI * 2 / 16) * 5
      + Math.cos(y * Math.PI * 2 / 16) * 4
      + Math.sin((x + y) * Math.PI * 2 / 16) * 3;
    return [v, v, v];
  }

  tex(0, (x, y) => {
    const p = Math.sin(x*1.2)*Math.cos(y*0.9)*15;
    const v = (x*7+y*13)%5;
    if (v<2) return [75+p+rand(8), 165+p+rand(10), 45+p+rand(6)];
    if (v<4) return [65+p+rand(8), 145+p+rand(10), 35+p+rand(6)];
    return [85+p+rand(8), 180+p+rand(10), 55+p+rand(6)];
  });

  tex(1, (x, y) => {
    if (y < 3) {
      const p = Math.sin(x * 1.5 + y) * 10;
      return [70 + p + rand(10), 155 + p + rand(12), 40 + p + rand(8)];
    }
    if (y === 3) {
      const hang = Math.sin(x * 1.8) * 2 | 0;
      if (hang > 0) return [70 + rand(10), 150 + rand(12), 40 + rand(8)];
      return [100 + rand(10), 100 + rand(10), 55 + rand(8)];
    }
    const n = Math.sin(x * 0.6 + y * 0.9) * 8;
    const s = (x * 3 + y * 7) % 8 === 0 ? -12 : 0;
    return [134 + n + s + rand(6), 96 + n + s + rand(6), 67 + n + s + rand(6)];
  });

  tex(2, (x, y) => {
    const n=Math.sin(x*0.6+y*0.9)*8;
    const s=(x*3+y*7)%8===0?-12:0;
    return [134+n+s+rand(6), 96+n+s+rand(6), 67+n+s+rand(6)];
  });

  tex(3, (x, y) => {
    return stoneBase(x, y);
  });

  tex(4, (x, y) => {
    const d=Math.sqrt((x-7.5)**2+(y-7.5)**2);
    if(d<5){const r=((d|0)%2===0)?12:0;return[155+r+rand(4),125+r+rand(4),80+r+rand(4)];}
    return [95+rand(4),68+rand(4),38+rand(4)];
  });

  tex(5, (x, y) => {
    const groove = Math.sin(x * 0.5) * 3 | 0;
    const ring = ((y + groove) % 4 < 2) ? 8 : -4;
    const grain = Math.sin(y * 1.8 + x * 0.2) * 5;
    const n = rand(5) - 2;
    return [98 + ring + grain + n, 68 + ring + grain + n, 38 + ring + grain + n];
  });

  tex(6, (x, y) => {
    const v = Math.sin(x * 1.3 + y * 0.8) + Math.cos(x * 0.7 - y * 1.5);
    if (v > 1.2) return [30, 90, 20, 0];
    const g = 120 + Math.sin(x * 0.9 + y * 1.2) * 25 + Math.cos(x * 1.5 - y * 0.6) * 15;
    const n = rand(12) - 6;
    return [clamp(g * 0.3 + n), clamp(g + n * 0.5), clamp(g * 0.2 + n)];
  });

  tex(7, (x, y) => {
    const cols=[[210,195,150],[215,200,155],[205,190,145],[220,205,160]];
    const c=cols[(x*3+y*7)%4];
    const n=rand(6);
    return [c[0]+n, c[1]+n, c[2]+n];
  });

  tex(8, (x, y) => {
    const w=Math.sin(x*0.8+y*0.3)*12;
    return [30+rand(6), 75+w+rand(6), 185+w+rand(6), 170];
  });

  tex(9, (x, y) => {
    const n=rand(8);
    const m=(x*5+y*3)%7===0?-15:0;
    return [50+n+m, 50+n+m, 50+n+m];
  });

  tex(10, (x, y) => {
    const v=stoneBase(x,y);
    const spots=[[3,3],[4,3],[3,4],[4,4],[8,7],[9,7],[8,8],[9,8],[11,11],[12,11],[11,12],[12,12]];
    for(const[sx,sy]of spots) if(x===sx&&y===sy) return [55+rand(15),55+rand(15),55+rand(15)];
    return v;
  });

  tex(11, (x, y) => {
    const v=stoneBase(x,y);
    const spots=[[3,3],[4,3],[3,4],[4,4],[9,8],[10,8],[9,9],[10,9],[6,11],[7,11],[6,12],[7,12]];
    for(const[sx,sy]of spots) if(x===sx&&y===sy) return [195+rand(15),165+rand(15),125+rand(15)];
    return v;
  });

  tex(12, (x, y) => {
    const plank = y >> 3;
    const off = plank * 3;
    const px = (x + off) % 16;
    const plankWidth = 8;
    const localX = px % plankWidth;
    const isGap = localX === 0;
    const grain = Math.sin(px * 0.4 + plank * 7) * 8;
    const ring = Math.sin(localX * 1.2) * 4;
    const n = rand(5) - 2;
    if (isGap) return [140 + n, 100 + n, 55 + n];
    return [182 + grain + ring + n, 142 + grain + ring + n, 82 + grain + ring + n];
  });

  tex(13, (x, y) => {
    const stones=[[1,1,4,4],[6,0,9,3],[11,1,14,4],[0,5,3,8],[5,5,8,8],[10,5,14,8],[1,9,4,12],[6,9,9,12],[11,9,14,12]];
    for(const[x1,y1,x2,y2]of stones){
      if(x>=x1&&x<=x2&&y>=y1&&y<=y2){
        const sh=100+((x1+y1*3)%25);
        const isE=(x===x1||x===x2||y===y1||y===y2);
        const n=rand(8);
        return[isE?sh-15+n:sh+n, isE?sh-15+n:sh+n, isE?sh-15+n:sh+n];
      }
    }
    return [70+rand(6),70+rand(6),70+rand(6)];
  });

  tex(14, (x, y) => {
    const v=stoneBase(x,y);
    const spots=[[4,4],[5,4],[4,5],[5,5],[10,9],[11,9],[10,10],[11,10],[7,12],[8,12],[7,13],[8,13]];
    for(const[sx,sy]of spots) if(x===sx&&y===sy) return [215+rand(15),195+rand(15),45+rand(15)];
    return v;
  });

  tex(15, (x, y) => {
    const v=stoneBase(x,y);
    const spots=[[3,3],[4,3],[3,4],[4,4],[9,8],[10,8],[9,9],[10,9],[6,12],[7,12],[6,13],[7,13]];
    for(const[sx,sy]of spots) if(x===sx&&y===sy) return [75+rand(15),215+rand(15),225+rand(15)];
    return v;
  });

  tex(17, (x, y) => {
    const row=y>>2, off=(row&1)*4, bx=(x+off)%8;
    if(bx===0||y%4===0) return [185+rand(4),180+rand(4),170+rand(4)];
    const n=rand(12)-6;
    return [165+n, 65+n, 50+n];
  });

  tex(18, (x, y) => {
    const base = 180 + Math.sin(x * 0.8 + y * 0.5) * 10 + Math.cos(x * 0.6 - y * 0.7) * 8;
    const n = rand(6) - 3;
    return [clamp(base + n), clamp(base + 5 + n), clamp(base + 10 + n), 255];
  });

  tex(19, (x, y) => {
    if (y < 3) {
      const p = Math.sin(x * 1.5 + y) * 8;
      return [235 + p + rand(6), 240 + p + rand(6), 250 + p + rand(4)];
    }
    if (y === 3) {
      const hang = Math.sin(x * 1.8) * 2 | 0;
      if (hang > 0) return [230 + rand(8), 238 + rand(8), 248 + rand(6)];
      return [134 + rand(6), 96 + rand(6), 67 + rand(6)];
    }
    const d = Math.sqrt((x-7.5)**2 + (y-11)**2);
    const n = Math.sin(d * 0.8) * 8;
    const s = ((x*3+y*7) % 8 === 0) ? -12 : 0;
    return [134 + n + s + rand(6), 96 + n + s + rand(6), 67 + n + s + rand(6)];
  });

  tex(20, (x, y) => {
    const n = rand(4);
    return [242 + n, 247 + n, 255];
  });

  tex(21, (x, y) => {
    const cols=[[130,125,115],[120,115,108],[140,135,125],[115,110,102]];
    const c=cols[(x*3+y*7)%4];
    const b=(x+y*5)%6===0?25:0;
    return [c[0]+rand(6)+b, c[1]+rand(6)+b, c[2]+rand(6)+b];
  });

  tex(22, (x, y) => {
    if(y<2||(y>6&&y<9)||y>13) return [120+rand(6),80+rand(6),40+rand(6)];
    const bk=y<7?0:1, bx=(x+bk*3)%6;
    const cols=[[150,40,40],[40,80,140],[40,120,40],[140,120,40],[120,40,120],[180,60,30]];
    const c=cols[bx];
    return [c[0]+rand(8)-4, c[1]+rand(8)-4, c[2]+rand(8)-4];
  });

  tex(23, (x, y) => {
    const d=Math.sqrt((x-7.5)**2+(y-7.5)**2);
    const b=Math.max(0,1-d/9);
    return [clamp(175+b*80+rand(12)), clamp(145+b*85+rand(12)), clamp(45+b*55+rand(12))];
  });

  tex(24, (x, y) => { const n=rand(10); return [100+n,30+n,30+n]; });
  tex(25, (x, y) => { const n=rand(8); return [80+n,60+n,40+n]; });

  tex(26, (x, y) => {
    if(x%8===0||y%4===0) return [35+rand(4),15+rand(4),15+rand(4)];
    return [55+rand(8),28+rand(8),28+rand(8)];
  });

  tex(27, (x, y) => { const n=rand(6); return [15+n,10+n,25+n]; });
  tex(28, (x, y) => { const n=rand(5); return [215+n,205+n,175+n]; });
  tex(29, (x, y) => { const n=rand(8); return [170+n,125+n,170+n]; });
  tex(30, (x, y) => { const n=rand(8); return [120+n,20+n,20+n]; });
  tex(31, (x, y) => { const n=rand(6); return [30+n,95+n,95+n]; });

  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.premultiplyAlpha = false;
  texture.needsUpdate = true;

  return {
    texture, canvas,
    getUV(texIndex) {
      const col = texIndex % ATLAS_COLS;
      const row = (texIndex / ATLAS_COLS) | 0;
      return {
        u0: col / ATLAS_COLS,
        v0: 1 - (row + 1) / ATLAS_ROWS,
        u1: (col + 1) / ATLAS_COLS,
        v1: 1 - row / ATLAS_ROWS,
      };
    },
    ATLAS_COLS, ATLAS_ROWS, BLOCK_SIZE,
  };
}
