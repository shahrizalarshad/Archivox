import { describe, it, expect } from 'vitest';
import { evaluateAllVoxels, inBounds, MANUAL_BLOCK_TYPES } from '../../src/utils/voxelLogic';

describe('Voxel Logic Rules (evaluateAllVoxels)', () => {
  
  it('Use Case 1: Generic blocks at y=0 become FOUNDATION_MESH', () => {
    const voxels = [{ x: 0, y: 0, z: 0, isStair: false, type: 'GENERIC_BLOCK' }];
    const result = evaluateAllVoxels(voxels);
    expect(result[0].type).toBe('FOUNDATION_MESH');
  });

  it('Use Case 1: Generic blocks without top neighbor become ROOF_MESH', () => {
    const voxels = [{ x: 0, y: 1, z: 0, isStair: false, type: 'GENERIC_BLOCK' }];
    const result = evaluateAllVoxels(voxels);
    expect(result[0].type).toBe('ROOF_MESH');
  });

  it('Use Case 1: Generic blocks with top and bottom become WALL_SOLID_MESH or WALL_INTERMEDIATE_MESH', () => {
    const voxels = [
      { x: 0, y: 0, z: 0, isStair: false, type: 'GENERIC_BLOCK' }, // bottom
      { x: 0, y: 1, z: 0, isStair: false, type: 'GENERIC_BLOCK' }, // middle
      { x: 0, y: 2, z: 0, isStair: false, type: 'GENERIC_BLOCK' }, // top
      { x: -1, y: 1, z: 0, isStair: false, type: 'GENERIC_BLOCK' }, // left
      { x: 1, y: 1, z: 0, isStair: false, type: 'GENERIC_BLOCK' }  // right
    ];
    const result = evaluateAllVoxels(voxels);
    // middle block is at index 1
    expect(result[1].type).toBe('WALL_SOLID_MESH');
  });

  it('Use Case 2: Manual Blocks should remain unchanged', () => {
    const voxels = [
      { x: 0, y: 0, z: 0, isStair: false, type: 'WATER_MESH' },
      { x: 0, y: 1, z: 0, isStair: false, type: 'WOOD_MESH' }
    ];
    const result = evaluateAllVoxels(voxels);
    expect(result[0].type).toBe('WATER_MESH');
    expect(result[1].type).toBe('WOOD_MESH');
  });
});

describe('Boundary Rules (inBounds)', () => {
  it('Use Case 3: Reject coordinates outside strict grid boundaries', () => {
    expect(inBounds({ x: 0, y: 0, z: 0 })).toBe(true);
    expect(inBounds({ x: 10, y: 14, z: 10 })).toBe(true);
    
    // Out of bounds
    expect(inBounds({ x: 11, y: 0, z: 0 })).toBe(false);
    expect(inBounds({ x: -11, y: 0, z: 0 })).toBe(false);
    expect(inBounds({ x: 0, y: 15, z: 0 })).toBe(false); // Max y is 14
    expect(inBounds({ x: 0, y: -1, z: 0 })).toBe(false); // Min y is 0
  });
});
