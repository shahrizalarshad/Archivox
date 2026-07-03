import React from 'react';

// Takrifan palet warna mengikut tema
export const COLOR_PALETTES = {
  brutalist_raw: {
    // Asas
    foundation: '#444446', wall: '#7a7a7e', roofBase: '#7a7a7e', roofDeck: '#968075',
    generic: '#b0b0b5', railing: '#1c1c1e', glass: '#88ccff', water: '#006699', leaf: '#2e5a27',
    // Tiang
    pillar: '#8a8a90', pillarCap: '#c0c0c8',
    // Kaca Penuh
    glassFull: '#9ecbff', glassFrame: '#555560',
    // Rumput
    grass: '#4a7c3f', grassTuft: '#5d9e52', dirt: '#7a5c42',
    // Kayu
    wood: '#6b4226', woodGrain: '#7d5230',
    // Pasir
    sand: '#c2a060', sandSurface: '#d4b474',
    // Batu
    rock: '#6b6b70', rockLight: '#8a8a90',
    // Lentera
    lanternPole: '#2a2a2e', lanternBody: '#3a3a40', lanternGlow: '#ffcc44',
  },
  neon_grid: {
    // Asas
    foundation: '#1a0033', wall: '#ff007f', roofBase: '#ff007f', roofDeck: '#00ffff',
    generic: '#9900ff', railing: '#ffffff', glass: '#00ffff', water: '#00e5ff', leaf: '#39ff14',
    // Tiang
    pillar: '#cc00ff', pillarCap: '#ff00ff',
    // Kaca Penuh
    glassFull: '#00ffff', glassFrame: '#ff00ff',
    // Rumput
    grass: '#00ff44', grassTuft: '#44ff88', dirt: '#220066',
    // Kayu
    wood: '#660044', woodGrain: '#880066',
    // Pasir
    sand: '#ffaa00', sandSurface: '#ffcc00',
    // Batu
    rock: '#444466', rockLight: '#6666aa',
    // Lentera
    lanternPole: '#440088', lanternBody: '#6600cc', lanternGlow: '#ff44ff',
  },
  warm_timber: {
    // Asas
    foundation: '#3e2723', wall: '#d7ccc8', roofBase: '#a1887f', roofDeck: '#8d6e63',
    generic: '#efebe9', railing: '#2d1500', glass: '#e0f7fa', water: '#00acc1', leaf: '#1b5e20',
    // Tiang
    pillar: '#c8b89a', pillarCap: '#e8d8b8',
    // Kaca Penuh
    glassFull: '#cce8ff', glassFrame: '#8d6e63',
    // Rumput
    grass: '#558b2f', grassTuft: '#6aa63e', dirt: '#5d4037',
    // Kayu
    wood: '#8d5524', woodGrain: '#a0622a',
    // Pasir
    sand: '#d4a857', sandSurface: '#e8c070',
    // Batu
    rock: '#78716c', rockLight: '#a09a95',
    // Lentera
    lanternPole: '#4e342e', lanternBody: '#6d4c41', lanternGlow: '#ffb300',
  },
  minimalist_white: {
    // Asas
    foundation: '#d1d1d6', wall: '#ffffff', roofBase: '#ffffff', roofDeck: '#e5e5ea',
    generic: '#f2f2f7', railing: '#1c1c1e', glass: '#b3e5fc', water: '#80deea', leaf: '#4caf50',
    // Tiang
    pillar: '#e8e8ee', pillarCap: '#f5f5fa',
    // Kaca Penuh
    glassFull: '#c8ecff', glassFrame: '#d0d0d8',
    // Rumput
    grass: '#81c784', grassTuft: '#a5d6a7', dirt: '#bcaaa4',
    // Kayu
    wood: '#d7ccc8', woodGrain: '#e0d4d0',
    // Pasir
    sand: '#fff9c4', sandSurface: '#fffde7',
    // Batu
    rock: '#b0b0b8', rockLight: '#d0d0d8',
    // Lentera
    lanternPole: '#9e9ea6', lanternBody: '#bdbdc5', lanternGlow: '#fff176',
  }
};


export default function VoxelBlock({ 
  type, 
  paletteName = 'brutalist_raw', 
  position, 
  rotationY = 0,
  ...props 
}) {
  const colors = COLOR_PALETTES[paletteName] || COLOR_PALETTES.brutalist_raw;

  const [gridX, gridY, gridZ] = position;
  const threePosition = [gridX, gridY + 0.5, gridZ];

  if (type === 'FOUNDATION_MESH') {
    return (
      <mesh position={threePosition} castShadow receiveShadow {...props}>
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshStandardMaterial 
          color={colors.foundation} 
          roughness={0.9} 
          metalness={0.1} 
        />
      </mesh>
    );
  }

  if (type === 'WALL_SOLID_MESH') {
    return (
      <mesh position={threePosition} castShadow receiveShadow {...props}>
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshStandardMaterial 
          color={colors.wall} 
          roughness={0.8} 
          metalness={0.05} 
        />
      </mesh>
    );
  }

  if (type === 'WALL_INTERMEDIATE_MESH') {
    return (
      <group position={threePosition} {...props}>
        <mesh position={[-0.38, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.98, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0.38, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.98, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.3, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.54, 0.3, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.54, 0.38, 0.15]} />
          <meshStandardMaterial 
            color={colors.glass} 
            transparent 
            opacity={0.4} 
            roughness={0.1} 
            metalness={0.9} 
          />
        </mesh>
      </group>
    );
  }

  if (type === 'ROOF_MESH') {
    return (
      <group position={threePosition} {...props}>
        <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.88, 0.98]} />
          <meshStandardMaterial color={colors.roofBase} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.08, 0.98]} />
          <meshStandardMaterial color={colors.roofDeck} roughness={0.8} />
        </mesh>
        <group position={[0, 0.46, 0]}>
          <mesh position={[-0.45, 0.15, -0.45]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[0.45, 0.15, -0.45]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[0.45, 0.15, 0.45]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[-0.45, 0.15, 0.45]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.28, -0.45]} castShadow>
            <boxGeometry args={[0.94, 0.03, 0.03]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.28, 0.45]} castShadow>
            <boxGeometry args={[0.94, 0.03, 0.03]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[-0.45, 0.28, 0]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.94]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
          <mesh position={[0.45, 0.28, 0]} castShadow>
            <boxGeometry args={[0.03, 0.03, 0.94]} />
            <meshStandardMaterial color={colors.railing} roughness={0.5} />
          </mesh>
        </group>
      </group>
    );
  }

  if (type === 'STAIRS_MESH') {
    return (
      <group position={threePosition} rotation={[0, rotationY, 0]} {...props}>
        <mesh position={[-0.375, -0.375, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.25, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[-0.125, -0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.5, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0.125, -0.125, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.75, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
        <mesh position={[0.375, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 1.0, 0.98]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (type === 'WATER_MESH') {
    return (
      <mesh position={[threePosition[0], threePosition[1] - 0.04, threePosition[2]]} {...props}>
        <boxGeometry args={[0.98, 0.90, 0.98]} />
        <meshStandardMaterial 
          color={colors.water} 
          transparent 
          opacity={0.6} 
          roughness={0.1} 
          metalness={0.5} 
        />
      </mesh>
    );
  }

  if (type === 'LEAF_MESH') {
    return (
      <mesh position={threePosition} castShadow receiveShadow {...props}>
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshStandardMaterial 
          color={colors.leaf} 
          roughness={0.9} 
          metalness={0.0} 
        />
      </mesh>
    );
  }

  return (
    <mesh position={threePosition} castShadow receiveShadow {...props}>
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      <meshStandardMaterial color={colors.generic} roughness={0.6} />
    </mesh>
  );
}
