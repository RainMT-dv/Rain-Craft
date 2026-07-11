<div align="center">

  # Rain's Craft
  *Clone do Minecraft rodando inteiramente no navegador*

  [![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![Three.js](https://img.shields.io/badge/Three.js-r164-black?style=flat-square)](https://threejs.org)
  [![Licença](https://img.shields.io/badge/licença-MIT-blue?style=flat-square)](LICENSE)

  **[👉 Jogue agora online!](https://rainmt-dv.github.io/Rain-Craft/)**

  [Funcionalidades](#funcionalidades) • [Como jogar](#como-jogar) • [Instalação](#instalação) • [Estrutura](#estrutura)

</div>

---

Rain's Craft é um clone do Minecraft Java Edition feito em HTML5 e JavaScript com Three.js. Roda inteiramente no navegador — sem instalação, sem ferramentas de build, zero dependências externas além do Three.js.

## Funcionalidades

- **Terreno procedural** gerado com Simplex Noise — colinas, cavernas, árvores e minérios
- **Chunks** de 16×128×16 blocos com face culling para renderização otimizada
- **28 tipos de blocos**: grama, pedra, madeira, água, minérios (carvão, ferro, ouro, diamante), blocos do Nether, End e mais
- **3 dimensões**: Overworld, Nether e The End
- **Ciclo dia/noite** de 5 minutos com mudanças de iluminação e cor do céu
- **Mobs** — vacas, porcos e galinhas com IA básica (passeio e fuga do jogador)
- **Sistema de seeds** para mundos reproduzíveis
- **Controles FPS** com pointer lock (WASD + mouse)
- **Colisão AABB** por eixo com sub-stepping e natação na água
- **Sons** via Web Audio API — passos, quebrar e colocar blocos
- **Texturas procedurais** geradas por canvas — zero assets externos

## Como jogar

| Tecla | Ação |
|---|---|
| `W A S D` | Mover |
| `Mouse` | Olhar ao redor |
| `Botão esquerdo` | Quebrar bloco |
| `Botão direito` | Colocar bloco |
| `Espaço` | Pular / Nadar para cima |
| `Shift` | Correr |
| `1–9` ou `Scroll` | Selecionar bloco na hotbar |
| `F3` | Painel de debug (FPS, posição, seed...) |
| `M` | Menu de spawn de animais |
| `G` | Spawnar animal selecionado |
| `N` | Ir para o Nether |
| `T` | Ir para The End |
| `O` | Voltar ao Overworld |
| `ESC` | Liberar cursor |

## Instalação

### Opção 1 — Arquivo único

Baixe `index.html` e abra diretamente no navegador. Nenhuma instalação necessária.

### Opção 2 — Servidor local (versão modular)

```bash
python -m http.server 8000
```

Acesse [http://localhost:8000](http://localhost:8000) no navegador.

## Estrutura

```
Rain-Craft/
├── index.html         # Versão single-file (GitHub Pages / release)
├── README.md
└── js/                # Versão modular
    ├── noise.js       # Simplex Noise 2D/3D com FBM
    ├── blocks.js      # Registro de tipos de blocos
    ├── texture.js     # Atlas de texturas procedural
    ├── chunk.js       # Dados do chunk + geração de malha
    ├── world.js       # Gerenciamento de chunks e terreno
    ├── player.js      # Controles FPS + colisão AABB
    ├── raycast.js     # Raycast voxel (Amanatides & Woo)
    ├── dimensions.js  # Gerenciamento das 3 dimensões
    ├── daynight.js    # Ciclo dia/noite
    ├── sound.js       # Sons via Web Audio API
    ├── ui.js          # Hotbar, crosshair e tela de instruções
    ├── clouds.js      # Nuvens procedurais
    ├── mobs.js        # Sistema de mobs
    └── main.js        # Inicialização e game loop
```

## Tecnologias

- **Three.js** (r164) — renderização 3D via WebGL
- **ES Modules** com import maps — zero ferramentas de build
- **Web Audio API** — síntese de som procedural
- **Canvas 2D** — geração procedural de texturas

## Contribuindo

Sinta-se à vontade para modificar e melhorar! Crie um fork e publique as suas mudanças.
