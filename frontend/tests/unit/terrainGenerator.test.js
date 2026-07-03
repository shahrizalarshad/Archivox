import { describe, it, expect } from 'vitest';
import { generateTerrain } from '../../src/utils/terrainGenerator';

describe('Terrain Generator', () => {
  it('should generate valid voxels', () => {
    const terrain = generateTerrain('forest', 15);
    expect(terrain).toBeInstanceOf(Array);
    
    // Check if the generated array has elements
    expect(terrain.length).toBeGreaterThan(0);
    
    // Check structure of a voxel
    const firstVoxel = terrain[0];
    expect(firstVoxel).toHaveProperty('x');
    expect(firstVoxel).toHaveProperty('y');
    expect(firstVoxel).toHaveProperty('z');
    expect(firstVoxel).toHaveProperty('type');
  });

  it('should not contain duplicate coordinates', () => {
    const terrain = generateTerrain('mountain', 10, 10);
    const coordSet = new Set();
    
    let hasDuplicates = false;
    terrain.forEach(v => {
      const key = `${v.x},${v.y},${v.z}`;
      if (coordSet.has(key)) hasDuplicates = true;
      coordSet.add(key);
    });
    
    expect(hasDuplicates).toBe(false);
  });
});
