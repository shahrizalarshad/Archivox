import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BlockInspector from '../../src/components/BlockInspector';

describe('BlockInspector Component', () => {
  const mockVoxel = { x: 1, y: 2, z: 3, type: 'GRASS_MESH' };
  
  it('renders the voxel coordinates correctly', () => {
    const handleClose = vi.fn();
    const handleChangeType = vi.fn();
    const handleDelete = vi.fn();

    render(
      <BlockInspector 
        voxel={mockVoxel} 
        onClose={handleClose}
        onChangeType={handleChangeType}
        onDelete={handleDelete}
      />
    );

    // Expect the title to show the coordinates
    // Expect the title to show the coordinates
    expect(screen.getByText(/Block Inspector/i)).toBeDefined();
    expect(screen.getByText(/X:\s*1/i)).toBeDefined();
    expect(screen.getByText(/Y:\s*2/i)).toBeDefined();
    expect(screen.getByText(/Z:\s*3/i)).toBeDefined();
  });
});
