import React, { useEffect, useRef } from 'react';

// Warna blok di peta mini mengikut jenis
const MINIMAP_COLORS = {
  FOUNDATION_MESH: '#555560',
  WALL_SOLID_MESH: '#8a8a99',
  WALL_INTERMEDIATE_MESH: '#a0a0b0',
  ROOF_MESH: '#e0e0e8',
  STAIRS_MESH: '#ff8c42',
  WATER_MESH: '#2196f3',
  LEAF_MESH: '#4caf50',
  GENERIC_BLOCK: '#9e9e9e',
  DEFAULT: '#6e6e7a',
};

const MINIMAP_SIZE = 160;  // saiz paparan peta mini (piksel)
const GRID_RANGE = 20;     // julat grid kanvas (-10 ke +10)

export default function Minimap({ voxels }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Bersih latar belakang
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    ctx.fillStyle = 'rgba(8, 8, 12, 0.92)';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Lukis grid titik-titik
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const cellSize = MINIMAP_SIZE / GRID_RANGE;
    for (let gx = 0; gx <= GRID_RANGE; gx++) {
      for (let gz = 0; gz <= GRID_RANGE; gz++) {
        ctx.fillRect(gx * cellSize, gz * cellSize, 1, 1);
      }
    }

    // Kira kedudukan tertinggi (Y paling tinggi) bagi setiap sel X/Z untuk bayangan ketinggian
    const heightMap = {};
    voxels.forEach(v => {
      const key = `${v.x},${v.z}`;
      if (!heightMap[key] || v.y > heightMap[key].y) {
        heightMap[key] = v;
      }
    });

    // Lukis blok pada peta mini (pandangan atas)
    const scale = MINIMAP_SIZE / GRID_RANGE;
    const offset = GRID_RANGE / 2; // offset supaya (0,0) jadi tengah peta mini

    Object.values(heightMap).forEach(v => {
      const px = Math.floor((v.x + offset) * scale);
      const pz = Math.floor((v.z + offset) * scale);

      const color = MINIMAP_COLORS[v.type] || MINIMAP_COLORS.DEFAULT;

      // Keamatan berdasarkan ketinggian Y (lebih tinggi = lebih cerah)
      const brightness = Math.min(1.0, 0.6 + v.y * 0.08);

      ctx.globalAlpha = brightness;
      ctx.fillStyle = color;
      ctx.fillRect(px, pz, Math.ceil(scale) + 1, Math.ceil(scale) + 1);
    });

    ctx.globalAlpha = 1.0;

    // Lukis sempadan peta mini
    ctx.strokeStyle = 'rgba(170, 59, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, MINIMAP_SIZE - 1, MINIMAP_SIZE - 1);

    // Lukis tanda tengah (kedudukan pusat kanvas)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(MINIMAP_SIZE / 2, 0);
    ctx.lineTo(MINIMAP_SIZE / 2, MINIMAP_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, MINIMAP_SIZE / 2);
    ctx.lineTo(MINIMAP_SIZE, MINIMAP_SIZE / 2);
    ctx.stroke();

  }, [voxels]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      right: '24px',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(170, 59, 255, 0.4)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(170, 59, 255, 0.2)',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        background: 'rgba(170, 59, 255, 0.12)',
        padding: '4px 8px',
        fontSize: '9px',
        fontFamily: 'ui-monospace, monospace',
        color: '#aa3bff',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(170, 59, 255, 0.2)',
      }}>
        MINIMAP • {Object.keys(
          // kira sel unik XZ
          voxels.reduce((acc, v) => { acc[`${v.x},${v.z}`] = true; return acc; }, {})
        ).length} CEL
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        style={{ display: 'block' }}
      />
    </div>
  );
}
