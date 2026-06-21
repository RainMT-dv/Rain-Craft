import { HOTBAR_BLOCKS, getBlock, BlockType } from './blocks.js';

export class UI {
  constructor(atlas) {
    this.atlas = atlas;
    this.selectedSlot = 0;
    this.createCrosshair();
    this.createHotbar();
    this.createInstructions();
    this.setupInput();
  }

  createCrosshair() {
    const el = document.createElement('div');
    el.id = 'crosshair';
    el.innerHTML = `
      <div style="position:absolute;width:20px;height:2px;background:white;left:50%;top:50%;transform:translate(-50%,-50%);mix-blend-mode:difference"></div>
      <div style="position:absolute;width:2px;height:20px;background:white;left:50%;top:50%;transform:translate(-50%,-50%);mix-blend-mode:difference"></div>
    `;
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    document.body.appendChild(el);
    this.crosshair = el;
  }

  createHotbar() {
    const container = document.createElement('div');
    container.id = 'hotbar';
    container.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      display:flex;gap:2px;z-index:10;
    `;

    for (let i = 0; i < HOTBAR_BLOCKS.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'hotbar-slot';
      slot.style.cssText = `
        width:48px;height:48px;background:rgba(0,0,0,0.6);
        border:2px solid ${i === 0 ? 'white' : 'rgba(255,255,255,0.3)'};
        display:flex;align-items:center;justify-content:center;
        position:relative;
      `;

      const canvas = this.createBlockIcon(HOTBAR_BLOCKS[i]);
      canvas.style.cssText = 'width:32px;height:32px;image-rendering:pixelated;';
      slot.appendChild(canvas);

      const num = document.createElement('span');
      num.textContent = i + 1;
      num.style.cssText = 'position:absolute;top:1px;left:4px;color:white;font:bold 10px monospace;';
      slot.appendChild(num);

      container.appendChild(slot);
    }

    document.body.appendChild(container);
    this.hotbarContainer = container;
    this.slots = container.querySelectorAll('.hotbar-slot');
  }

  createBlockIcon(blockType) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const b = getBlock(blockType);
    const texIdx = b.texSide;
    const col = texIdx % this.atlas.ATLAS_COLS;
    const row = (texIdx / this.atlas.ATLAS_COLS) | 0;

    ctx.drawImage(
      this.atlas.canvas,
      col * 16, row * 16, 16, 16,
      0, 0, 16, 16
    );

    return canvas;
  }

  createInstructions() {
    const overlay = document.createElement('div');
    overlay.id = 'instructions-overlay';
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;
      z-index:100;cursor:pointer;
    `;
    overlay.innerHTML = `
      <div style="text-align:center;color:white;font-family:monospace;max-width:500px;">
        <h1 style="font-size:32px;margin-bottom:10px;color:#4CAF50;">Rain's Craft</h1>
        <p style="font-size:18px;margin:15px 0;">Clique para jogar</p>
        <div style="text-align:left;background:rgba(0,0,0,0.5);padding:20px;border-radius:8px;margin:15px 0;">
          <p><b>WASD</b> - Mover</p>
          <p><b>Mouse</b> - Olhar ao redor</p>
          <p><b>Botão Esquerdo</b> - Quebrar bloco</p>
          <p><b>Direito</b> - Colocar bloco</p>
          <p><b>Espaço</b> - Pular / Nadar para cima</p>
          <p><b>Shift</b> - Correr</p>
          <p><b>1-9 / Scroll</b> - Selecionar bloco</p>
          <p><b>F3</b> - Informacoes de debug</p>
          <p><b>M</b> - Menu de spawn de animais</p>
          <p><b>1/2/3</b> - Selecionar animal no menu</p>
          <p><b>G</b> - Spawnar animal selecionado</p>
          <p><b>T</b> - Ir para The End</p>
          <p><b>N</b> - Ir para o Nether</p>
          <p><b>O</b> - Voltar ao Overworld</p>
        </div>
        <p style="font-size:14px;color:#aaa;">Pressione ESC para liberar o cursor</p>
      </div>
    `;
    document.body.appendChild(overlay);
    this.instructionsOverlay = overlay;
  }

  setupInput() {
    document.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        this.selectedSlot = (this.selectedSlot + 1) % HOTBAR_BLOCKS.length;
      } else {
        this.selectedSlot = (this.selectedSlot - 1 + HOTBAR_BLOCKS.length) % HOTBAR_BLOCKS.length;
      }
      this.updateHotbar();
    });

    document.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= HOTBAR_BLOCKS.length) {
        this.selectedSlot = num - 1;
        this.updateHotbar();
      }
    });
  }

  updateHotbar() {
    this.slots.forEach((slot, i) => {
      slot.style.borderColor = i === this.selectedSlot ? 'white' : 'rgba(255,255,255,0.3)';
    });
  }

  getSelectedBlock() {
    return HOTBAR_BLOCKS[this.selectedSlot];
  }

  hideInstructions() {
    this.instructionsOverlay.style.display = 'none';
  }

  showInstructions() {
    this.instructionsOverlay.style.display = 'flex';
  }
}
