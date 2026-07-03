export const MANUAL_BLOCK_TYPES = new Set([
  'WATER_MESH', 'LEAF_MESH', 'PILLAR_MESH', 'GLASS_FULL_MESH',
  'GRASS_MESH', 'WOOD_MESH', 'SAND_MESH', 'ROCK_MESH',
  'FENCE_MESH', 'LANTERN_MESH'
]);

/**
 * Checks if a voxel is within the strict grid boundaries.
 */
export const inBounds = (v) => v.x >= -10 && v.x <= 10 && v.y >= 0 && v.y < 15 && v.z >= -10 && v.z <= 10;

/**
 * Evaluates contextual rules for a list of voxels.
 */
export const evaluateAllVoxels = (list) => {
  return list.map(v => {
    const { x, y, z, isStair, type: originalType } = v;

    // Blok manual — kekalkan jenis asal tanpa penilaian semula
    if (MANUAL_BLOCK_TYPES.has(originalType)) return { ...v, rotationY: 0 };

    const hasTop = list.some(n => n.x === x && n.y === y + 1 && n.z === z);
    const hasBottom = list.some(n => n.x === x && n.y === y - 1 && n.z === z);
    const hasLeft = list.some(n => n.x === x - 1 && n.y === y && n.z === z);
    const hasRight = list.some(n => n.x === x + 1 && n.y === y && n.z === z);
    const hasFront = list.some(n => n.x === x && n.y === y && n.z === z + 1);
    const hasBack = list.some(n => n.x === x && n.y === y && n.z === z - 1);

    let type = 'GENERIC_BLOCK';
    let rotationY = 0;

    if (isStair) {
      type = 'STAIRS_MESH';
      if (hasRight) rotationY = 0;
      else if (hasLeft) rotationY = Math.PI;
      else if (hasFront) rotationY = -Math.PI / 2;
      else if (hasBack) rotationY = Math.PI / 2;
    } else {
      if (y === 0) {
        type = 'FOUNDATION_MESH';
      } else if (!hasTop) {
        type = 'ROOF_MESH';
      } else if (hasTop && hasBottom) {
        type = (hasLeft && hasRight) ? 'WALL_SOLID_MESH' : 'WALL_INTERMEDIATE_MESH';
      }
    }

    return { ...v, type, rotationY };
  });
};
