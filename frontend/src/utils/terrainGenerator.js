import { createNoise2D } from 'simplex-noise';

/**
 * Jana terrain berdasarkan tema dan saiz grid.
 * @param {string} theme - 'mountain', 'beach', 'forest', 'desert'
 * @param {number} size - Saiz grid (cth: 15 bermaksud 15x15)
 * @returns {Array} - Array voksel
 */
export function generateTerrain(theme, size) {
  const noise2D = createNoise2D();
  const voxels = [];
  const offset = Math.floor(size / 2);

  // Parameter bunyi (noise parameters)
  let scale = 0.1;
  let heightMultiplier = 5;
  let baseHeight = 0;

  if (theme === 'mountain') {
    scale = 0.15;
    heightMultiplier = 8;
    baseHeight = 2;
  } else if (theme === 'beach') {
    scale = 0.08;
    heightMultiplier = 3;
    baseHeight = -1;
  } else if (theme === 'forest') {
    scale = 0.12;
    heightMultiplier = 4;
    baseHeight = 1;
  } else if (theme === 'desert') {
    scale = 0.05;
    heightMultiplier = 3;
    baseHeight = 1;
  }

  for (let x = -offset; x <= offset; x++) {
    for (let z = -offset; z <= offset; z++) {
      // Dapatkan nilai bunyi antara -1 dan 1, tukar ke 0 - 1
      let n = noise2D(x * scale, z * scale) * 0.5 + 0.5;
      
      // Ketinggian akhir (Y)
      let y = Math.floor(n * heightMultiplier) + baseHeight;
      if (y < 0) y = 0; // Pastikan tak kurang dari 0

      // Tentukan jenis blok berdasarkan tema dan ketinggian
      let type = 'GENERIC_BLOCK';
      
      if (theme === 'mountain') {
        type = y > 6 ? 'GENERIC_BLOCK' : 'ROCK_MESH'; // "Salji" di puncak
      } else if (theme === 'beach') {
        type = y <= 1 ? 'SAND_MESH' : 'GRASS_MESH';
      } else if (theme === 'forest') {
        type = 'GRASS_MESH';
      } else if (theme === 'desert') {
        type = 'SAND_MESH';
      }

      // Tambah lapisan blok ke bawah supaya terrain nampak solid
      for (let fillY = 0; fillY <= y; fillY++) {
        let fillType = type;
        if (theme === 'mountain' && fillY < y - 1) fillType = 'ROCK_MESH';
        if (theme === 'beach' && fillY < y) fillType = (fillY <= 0) ? 'SAND_MESH' : 'DIRT_MESH';
        if (theme === 'forest' && fillY < y) fillType = 'DIRT_MESH';
        if (theme === 'desert' && fillY < y - 1) fillType = 'SAND_MESH';

        voxels.push({ x, y: fillY, z, type: fillType, isStair: false });
      }

      // Penambahan hiasan/deco mengikut tema
      if (theme === 'beach' && y <= 0 && Math.random() < 0.8) {
        // Air laut
        // Pastikan voksel dalam sempadan (Y maksimum 14, X/Z maksimum 10)
        let waterY = 1;
        if (waterY >= 15) waterY = 14;
        if (x >= -10 && x <= 10 && z >= -10 && z <= 10 && waterY >= 0) {
          voxels.push({ x, y: waterY, z, type: 'WATER_MESH', isStair: false });
        }
      }
      if (theme === 'forest' && Math.random() < 0.05) {
        // Pokok rawak (simpel)
        voxels.push({ x, y: y + 1, z, type: 'WOOD_MESH', isStair: false });
        voxels.push({ x, y: y + 2, z, type: 'WOOD_MESH', isStair: false });
        voxels.push({ x, y: y + 3, z, type: 'LEAF_MESH', isStair: false });
      }
      if (theme === 'desert' && y === fillY(y) && Math.random() < 0.03) {
        // Batu rawak di padang pasir
        voxels.push({ x, y: y + 1, z, type: 'ROCK_MESH', isStair: false });
      }
    }
  }

  // Fungsi utiliti untuk hiasan
  function fillY(h) { return h; }

  // Tapis voksel yang berada di luar sempadan grid
  return voxels.filter(v => v.x >= -10 && v.x <= 10 && v.y >= 0 && v.y < 15 && v.z >= -10 && v.z <= 10);
}
