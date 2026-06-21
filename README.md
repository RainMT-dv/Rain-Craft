# Rain's Craft

### 👉 [Jogue agora online!](https://rainmt-dv.github.io/Rain-Craft/)

Um clone do **Minecraft Java Edition** feito em HTML5/JavaScript com Three.js. Roda inteiramente no navegador — sem necessidade de ferramentas de compilação.

## Funcionalidades

- **Terreno procedural** gerado com Simplex Noise (colinas, cavernas, árvores, minérios)
- **Chunks** de 16×128×16 blocos com renderização otimizada (face culling)
- **28 tipos de blocos**: grama, terra, pedra, tronco, folhas, areia, água, bedrock, carvão, ferro, ouro, diamante, tábuas, cascalho, tijolo, bloco de ferro, neve, gravel, estante, glowstone, netherrack, soul sand, nether brick, obsidiana, end stone, purpur, crimson/warped nylium
- **Dia/noite** com ciclo de 5 minutos, mudanças de iluminação e cores do céu
- **Nuvens** procedurais em camada
- **Mobs**: vacas, porcos e galinhas com IA básica (passeio e fuga do jogador)
- **Sistema de seeds** para mundos reproduzíveis
- **Controles FPS** com pointer lock (WASD + mouse)
- **Colisão AABB** por eixo com sub-stepping
- **Natação** na água (Espaço para nadar para cima)
- **Colocar e quebrar** blocos com clique esquerdo/direito
- **Hotbar** com 9 slots, seleção por scroll ou teclas 1-9
- **Painel de debug** (F3) com FPS, posição, chunk, seed e mais
- **3 Dimensões**: Overworld, Nether (N), The End (T), voltar com O
- **Menu de spawn** de animais (M) — selecione com 1/2/3, G para spawnar
- **Sons** via Web Audio API (quebrar, colocar, passos)
- **Texturas procedurais** geradas por canvas — zero dependências externas

## Como Jogar

| Tecla | Ação |
|-------|------|
| `W A S D` | Mover |
| `Mouse` | Olhar ao redor |
| `Botão esquerdo` | Quebrar bloco |
| `Botão direito` | Colocar bloco |
| `Espaço` | Pular / Nadar para cima |
| `Shift` | Correr |
| `1-9` ou `Scroll` | Selecionar bloco |
| `F3` | Painel de debug |
| `M` | Menu de spawn de animais |
| `G` | Spawnar animal selecionado |
| `T` | Ir para The End |
| `N` | Ir para o Nether |
| `O` | Voltar ao Overworld |
| `ESC` | Liberar cursor |

## Como Jogar

### Opção 1 — Arquivo único

Baixe `RainsCraft.html` e abra diretamente no navegador. Nenhuma instalação necessária.

### Opção 2 — Servidor local (versão modular)

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000` no navegador.

### GitHub Pages

O arquivo `RainsCraft.html` também pode ser servido via GitHub Pages.

## Estrutura do projeto

```
Rain-Craft/
├── RainsCraft.html    # Versão single-file (para GitHub Pages/Release)
├── README.md
└── js/                # Versão modular (desenvolvimento)
    ├── noise.js       # Simplex Noise 2D/3D com FBM
    ├── blocks.js      # Registro de tipos de blocos
    ├── texture.js     # Atlas de texturas procedural (canvas)
    ├── chunk.js       # Dados do chunk + geração de malha
    ├── world.js       # Gerenciamento de chunks + terreno
    ├── player.js      # Controles FPS + colisão AABB
    ├── raycast.js     # Raycast voxel (Amanatides & Woo)
    ├── dimensions.js  # Gerenciamento de 3 dimensões
    ├── daynight.js    # Ciclo dia/noite
    ├── sound.js       # Sons via Web Audio API
    ├── ui.js          # Hotbar, crosshair, tela de instruções
    ├── clouds.js      # Camada de nuvens procedural
    ├── mobs.js        # Sistema de mobs (vacas, porcos, galinhas)
    └── main.js        # Inicialização + game loop
```

## Tecnologias

- **Three.js** (r164) — renderização 3D via WebGL
- **ES Modules** com import maps — zero ferramentas de build
- **Web Audio API** — síntese de som procedural
- **Canvas 2D** — geração procedural de texturas

## Licença

MIT
