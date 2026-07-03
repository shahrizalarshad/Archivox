import React from 'react';

const BLOCK_TYPES = [
  { id: 'GENERIC_BLOCK', label: 'Standard' },
  { id: 'FOUNDATION_MESH', label: 'Asas (Foundation)' },
  { id: 'WALL_SOLID_MESH', label: 'Dinding Penuh' },
  { id: 'WALL_INTERMEDIATE_MESH', label: 'Dinding Bertingkap' },
  { id: 'ROOF_MESH', label: 'Bumbung' },
  { id: 'STAIRS_MESH', label: 'Tangga' },
  { id: 'PILLAR_MESH', label: 'Tiang' },
  { id: 'GLASS_FULL_MESH', label: 'Kaca Penuh' },
  { id: 'FENCE_MESH', label: 'Pagar' },
  { id: 'LANTERN_MESH', label: 'Lentera' },
  { id: 'GRASS_MESH', label: 'Rumput' },
  { id: 'WOOD_MESH', label: 'Kayu' },
  { id: 'SAND_MESH', label: 'Pasir' },
  { id: 'ROCK_MESH', label: 'Batu' },
  { id: 'WATER_MESH', label: 'Kolam Air' },
  { id: 'LEAF_MESH', label: 'Dedaun' },
];

export default function BlockInspector({ voxel, onClose, onChangeType, onDelete }) {
  if (!voxel) return null;

  return (
    <div className="inspector-panel">
      <div className="inspector-header">
        <h3>🔍 Block Inspector</h3>
        <button className="btn-close" onClick={onClose}>&times;</button>
      </div>
      
      <div className="inspector-body">
        <div className="inspector-coord">
          <span>Koordinat:</span>
          <strong>X: {voxel.x} | Y: {voxel.y} | Z: {voxel.z}</strong>
        </div>
        
        <div className="inspector-type">
          <label>Ubah Jenis Blok:</label>
          <div className="inspector-grid">
            {BLOCK_TYPES.map(b => (
              <button 
                key={b.id} 
                className={`btn-inspector-type ${voxel.type === b.id ? 'active' : ''}`}
                onClick={() => onChangeType(voxel, b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="inspector-actions">
          <button className="btn-action btn-danger" onClick={() => onDelete(voxel)}>
            🗑️ Padam Blok Ini
          </button>
        </div>
      </div>
    </div>
  );
}
