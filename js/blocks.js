export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  OAK_LOG: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  BEDROCK: 8,
  COAL_ORE: 9,
  IRON_ORE: 10,
  OAK_PLANKS: 11,
  COBBLESTONE: 12,
  GOLD_ORE: 13,
  DIAMOND_ORE: 14,
  BRICK: 15,
  GLASS: 16,
  SNOW: 17,
  GRAVEL: 18,
  BOOKSHELF: 19,
  GLOWSTONE: 20,
  NETHERRACK: 21,
  SOUL_SAND: 22,
  NETHER_BRICK: 23,
  OBSIDIAN: 24,
  END_STONE: 25,
  PURPUR: 26,
  CRIMSON_NYLIUM: 27,
  WARPED_NYLIUM: 28,
};

export const BLOCK_SIZE = 16;

const blocks = {};

function def(id, name, opts) {
  blocks[id] = {
    id,
    name,
    solid: opts.solid !== false,
    transparent: opts.transparent || false,
    liquid: opts.liquid || false,
    texTop: opts.texTop ?? opts.texSide,
    texSide: opts.texSide,
    texBottom: opts.texBottom ?? opts.texSide,
    ...opts,
  };
}

def(BlockType.AIR, 'Ar', { solid: false, transparent: true, texSide: 0 });
def(BlockType.GRASS, 'Grama', { texTop: 0, texSide: 1, texBottom: 2 });
def(BlockType.DIRT, 'Terra', { texSide: 2 });
def(BlockType.STONE, 'Pedra', { texSide: 3 });
def(BlockType.OAK_LOG, 'Tronco', { texTop: 4, texSide: 5, texBottom: 4 });
def(BlockType.LEAVES, 'Folhas', { texSide: 6, transparent: true });
def(BlockType.SAND, 'Areia', { texSide: 7 });
def(BlockType.WATER, 'Agua', { texSide: 8, transparent: true, liquid: true, solid: false });
def(BlockType.BEDROCK, 'Bedrock', { texSide: 9 });
def(BlockType.COAL_ORE, 'Min. Carvao', { texSide: 10 });
def(BlockType.IRON_ORE, 'Min. Ferro', { texSide: 11 });
def(BlockType.OAK_PLANKS, 'Tábua', { texSide: 12 });
def(BlockType.COBBLESTONE, 'Cascalho', { texSide: 13 });
def(BlockType.GOLD_ORE, 'Min. Ouro', { texSide: 14 });
def(BlockType.DIAMOND_ORE, 'Min. Diamante', { texSide: 15 });
def(BlockType.BRICK, 'Tijolo', { texSide: 17 });
def(BlockType.GLASS, 'Bloco de Ferro', { texSide: 18 });
def(BlockType.SNOW, 'Neve', { texTop: 20, texSide: 19, texBottom: 2 });
def(BlockType.GRAVEL, 'Gravel', { texSide: 21 });
def(BlockType.BOOKSHELF, 'Estante', { texTop: 12, texSide: 22, texBottom: 12 });
def(BlockType.GLOWSTONE, 'Glowstone', { texSide: 23 });
def(BlockType.NETHERRACK, 'Netherrack', { texSide: 24 });
def(BlockType.SOUL_SAND, 'Soul Sand', { texSide: 25 });
def(BlockType.NETHER_BRICK, 'Nether Brick', { texSide: 26 });
def(BlockType.OBSIDIAN, 'Obsidiana', { texSide: 27 });
def(BlockType.END_STONE, 'End Stone', { texSide: 28 });
def(BlockType.PURPUR, 'Purpur', { texSide: 29 });
def(BlockType.CRIMSON_NYLIUM, 'Crimson Nylium', { texTop: 30, texSide: 21, texBottom: 21 });
def(BlockType.WARPED_NYLIUM, 'Warped Nylium', { texTop: 31, texSide: 21, texBottom: 21 });

export function getBlock(id) { return blocks[id] || blocks[BlockType.AIR]; }
export function isSolid(id) { return blocks[id]?.solid ?? false; }
export function isTransparent(id) { return blocks[id]?.transparent ?? false; }
export function isLiquid(id) { return blocks[id]?.liquid ?? false; }

export const HOTBAR_BLOCKS = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.OAK_LOG,
  BlockType.OAK_PLANKS,
  BlockType.COBBLESTONE,
  BlockType.BRICK,
  BlockType.GLASS,
  BlockType.GLOWSTONE,
];
