export const BUILDING_PRESETS = [
  {
    id: 'banglo',
    name: 'Banglo Moden',
    icon: '🏠',
    size: '5×3×5',
    voxels: [
      // Lantai
      ...Array.from({length: 25}).map((_, i) => ({ x: (i%5)-2, y: 0, z: Math.floor(i/5)-2, type: 'WOOD_MESH', isStair: false })),
      // Dinding
      { x: -2, y: 1, z: -2, type: 'WALL_SOLID_MESH' }, { x: -1, y: 1, z: -2, type: 'WALL_SOLID_MESH' }, { x: 1, y: 1, z: -2, type: 'WALL_SOLID_MESH' }, { x: 2, y: 1, z: -2, type: 'WALL_SOLID_MESH' },
      { x: -2, y: 1, z: -1, type: 'WALL_SOLID_MESH' }, { x: 2, y: 1, z: -1, type: 'WALL_SOLID_MESH' },
      { x: -2, y: 1, z: 0, type: 'GLASS_FULL_MESH' }, { x: 2, y: 1, z: 0, type: 'GLASS_FULL_MESH' },
      { x: -2, y: 1, z: 1, type: 'WALL_SOLID_MESH' }, { x: 2, y: 1, z: 1, type: 'WALL_SOLID_MESH' },
      { x: -2, y: 1, z: 2, type: 'WALL_SOLID_MESH' }, { x: -1, y: 1, z: 2, type: 'GLASS_FULL_MESH' }, { x: 0, y: 1, z: 2, type: 'GLASS_FULL_MESH' }, { x: 1, y: 1, z: 2, type: 'GLASS_FULL_MESH' }, { x: 2, y: 1, z: 2, type: 'WALL_SOLID_MESH' },
      // Bumbung
      ...Array.from({length: 25}).map((_, i) => ({ x: (i%5)-2, y: 2, z: Math.floor(i/5)-2, type: 'ROOF_MESH', isStair: false })),
    ]
  },
  {
    id: 'menara',
    name: 'Menara Pejabat',
    icon: '🏢',
    size: '3×8×3',
    voxels: [
      ...Array.from({length: 9}).map((_, i) => ({ x: (i%3)-1, y: 0, z: Math.floor(i/3)-1, type: 'FOUNDATION_MESH', isStair: false })),
      ...[1, 2, 3, 4, 5, 6].flatMap(y => [
        { x: -1, y, z: -1, type: 'WALL_SOLID_MESH' }, { x: 0, y, z: -1, type: 'GLASS_FULL_MESH' }, { x: 1, y, z: -1, type: 'WALL_SOLID_MESH' },
        { x: -1, y, z: 0, type: 'GLASS_FULL_MESH' }, { x: 1, y, z: 0, type: 'GLASS_FULL_MESH' },
        { x: -1, y, z: 1, type: 'WALL_SOLID_MESH' }, { x: 0, y, z: 1, type: 'GLASS_FULL_MESH' }, { x: 1, y, z: 1, type: 'WALL_SOLID_MESH' }
      ]),
      ...Array.from({length: 9}).map((_, i) => ({ x: (i%3)-1, y: 7, z: Math.floor(i/3)-1, type: 'ROOF_MESH', isStair: false })),
    ]
  },
  {
    id: 'jambatan',
    name: 'Jambatan Gantung',
    icon: '🌉',
    size: '7×3×3',
    voxels: [
      // Tiang Utama
      { x: -3, y: 0, z: -1, type: 'PILLAR_MESH' }, { x: -3, y: 0, z: 1, type: 'PILLAR_MESH' },
      { x: -3, y: 1, z: -1, type: 'PILLAR_MESH' }, { x: -3, y: 1, z: 1, type: 'PILLAR_MESH' },
      { x: -3, y: 2, z: -1, type: 'PILLAR_MESH' }, { x: -3, y: 2, z: 1, type: 'PILLAR_MESH' },
      { x: 3, y: 0, z: -1, type: 'PILLAR_MESH' }, { x: 3, y: 0, z: 1, type: 'PILLAR_MESH' },
      { x: 3, y: 1, z: -1, type: 'PILLAR_MESH' }, { x: 3, y: 1, z: 1, type: 'PILLAR_MESH' },
      { x: 3, y: 2, z: -1, type: 'PILLAR_MESH' }, { x: 3, y: 2, z: 1, type: 'PILLAR_MESH' },
      // Laluan
      ...[-3, -2, -1, 0, 1, 2, 3].map(x => ({ x, y: 1, z: 0, type: 'WOOD_MESH' })),
      // Pagar
      ...[-2, -1, 0, 1, 2].map(x => ({ x, y: 2, z: -1, type: 'FENCE_MESH' })),
      ...[-2, -1, 0, 1, 2].map(x => ({ x, y: 2, z: 1, type: 'FENCE_MESH' })),
    ]
  },
  {
    id: 'benteng',
    name: 'Benteng Medieval',
    icon: '🏯',
    size: '5×4×5',
    voxels: [
      // Asas
      ...Array.from({length: 25}).map((_, i) => ({ x: (i%5)-2, y: 0, z: Math.floor(i/5)-2, type: 'ROCK_MESH', isStair: false })),
      // Dinding Tingkat 1 & 2
      ...[1, 2].flatMap(y => [
        { x: -2, y, z: -2, type: 'ROCK_MESH' }, { x: -1, y, z: -2, type: 'ROCK_MESH' }, { x: 0, y, z: -2, type: 'ROCK_MESH' }, { x: 1, y, z: -2, type: 'ROCK_MESH' }, { x: 2, y, z: -2, type: 'ROCK_MESH' },
        { x: -2, y, z: -1, type: 'ROCK_MESH' }, { x: 2, y, z: -1, type: 'ROCK_MESH' },
        { x: -2, y, z: 0, type: 'ROCK_MESH' }, { x: 2, y, z: 0, type: 'ROCK_MESH' },
        { x: -2, y, z: 1, type: 'ROCK_MESH' }, { x: 2, y, z: 1, type: 'ROCK_MESH' },
        { x: -2, y, z: 2, type: 'ROCK_MESH' }, { x: -1, y, z: 2, type: 'ROCK_MESH' }, { x: 0, y, z: 2, type: 'WOOD_MESH' }, { x: 1, y, z: 2, type: 'ROCK_MESH' }, { x: 2, y, z: 2, type: 'ROCK_MESH' },
      ]),
      // Puncak (Battlements)
      { x: -2, y: 3, z: -2, type: 'ROCK_MESH' }, { x: 0, y: 3, z: -2, type: 'ROCK_MESH' }, { x: 2, y: 3, z: -2, type: 'ROCK_MESH' },
      { x: -2, y: 3, z: 0, type: 'ROCK_MESH' }, { x: 2, y: 3, z: 0, type: 'ROCK_MESH' },
      { x: -2, y: 3, z: 2, type: 'ROCK_MESH' }, { x: 0, y: 3, z: 2, type: 'ROCK_MESH' }, { x: 2, y: 3, z: 2, type: 'ROCK_MESH' },
    ]
  },
  {
    id: 'gerbang',
    name: 'Gerbang Taman',
    icon: '⛩️',
    size: '5×4×1',
    voxels: [
      { x: -2, y: 0, z: 0, type: 'PILLAR_MESH' }, { x: 2, y: 0, z: 0, type: 'PILLAR_MESH' },
      { x: -2, y: 1, z: 0, type: 'PILLAR_MESH' }, { x: 2, y: 1, z: 0, type: 'PILLAR_MESH' },
      { x: -2, y: 2, z: 0, type: 'PILLAR_MESH' }, { x: 2, y: 2, z: 0, type: 'PILLAR_MESH' },
      { x: -2, y: 3, z: 0, type: 'WOOD_MESH' }, { x: -1, y: 3, z: 0, type: 'WOOD_MESH' }, { x: 0, y: 3, z: 0, type: 'WOOD_MESH' }, { x: 1, y: 3, z: 0, type: 'WOOD_MESH' }, { x: 2, y: 3, z: 0, type: 'WOOD_MESH' },
    ]
  },
  {
    id: 'kolam',
    name: 'Kolam Renang',
    icon: '🏊',
    size: '5×1×5',
    voxels: [
      ...Array.from({length: 25}).map((_, i) => {
        const x = (i%5)-2;
        const z = Math.floor(i/5)-2;
        const isBorder = x === -2 || x === 2 || z === -2 || z === 2;
        return { x, y: 0, z, type: isBorder ? 'GENERIC_BLOCK' : 'WATER_MESH', isStair: false };
      })
    ]
  },
  {
    id: 'pokok',
    name: 'Pokok Besar',
    icon: '🌳',
    size: '3×6×3',
    voxels: [
      // Batang
      { x: 0, y: 0, z: 0, type: 'WOOD_MESH' }, { x: 0, y: 1, z: 0, type: 'WOOD_MESH' }, { x: 0, y: 2, z: 0, type: 'WOOD_MESH' }, { x: 0, y: 3, z: 0, type: 'WOOD_MESH' },
      // Daun
      ...Array.from({length: 9}).map((_, i) => ({ x: (i%3)-1, y: 4, z: Math.floor(i/3)-1, type: 'LEAF_MESH', isStair: false })),
      { x: 0, y: 5, z: 0, type: 'LEAF_MESH' }, { x: -1, y: 5, z: 0, type: 'LEAF_MESH' }, { x: 1, y: 5, z: 0, type: 'LEAF_MESH' }, { x: 0, y: 5, z: -1, type: 'LEAF_MESH' }, { x: 0, y: 5, z: 1, type: 'LEAF_MESH' },
    ]
  },
  {
    id: 'lampu',
    name: 'Menara Lampu',
    icon: '💡',
    size: '1×4×1',
    voxels: [
      { x: 0, y: 0, z: 0, type: 'PILLAR_MESH' },
      { x: 0, y: 1, z: 0, type: 'PILLAR_MESH' },
      { x: 0, y: 2, z: 0, type: 'PILLAR_MESH' },
      { x: 0, y: 3, z: 0, type: 'LANTERN_MESH' },
    ]
  }
];
