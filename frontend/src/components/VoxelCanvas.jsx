import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, SSAO, Bloom, Vignette } from '@react-three/postprocessing';
import { Physics, RigidBody, InstancedRigidBodies, CuboidCollider } from '@react-three/rapier';
import { COLOR_PALETTES } from './VoxelBlock';

// Mengembalikan senarai sub-mesh (skala, offset, material) untuk setiap jenis blok
const getSubMeshesForType = (type) => {
  switch (type) {
    case 'FOUNDATION_MESH':
      return [
        { scale: [0.98, 0.98, 0.98], offset: [0, 0, 0], material: 'foundation' }
      ];
    case 'WALL_SOLID_MESH':
      return [
        { scale: [0.98, 0.98, 0.98], offset: [0, 0, 0], material: 'wall' }
      ];
    case 'WALL_INTERMEDIATE_MESH':
      return [
        { scale: [0.22, 0.98, 0.98], offset: [-0.38, 0, 0], material: 'wall' },
        { scale: [0.22, 0.98, 0.98], offset: [0.38, 0, 0], material: 'wall' },
        { scale: [0.54, 0.3, 0.98], offset: [0, -0.34, 0], material: 'wall' },
        { scale: [0.54, 0.3, 0.98], offset: [0, 0.34, 0], material: 'wall' },
        { scale: [0.54, 0.38, 0.15], offset: [0, 0, 0], material: 'glass' }
      ];
    case 'ROOF_MESH':
      return [
        { scale: [0.98, 0.88, 0.98], offset: [0, -0.05, 0], material: 'roofBase' },
        { scale: [0.98, 0.08, 0.98], offset: [0, 0.42, 0], material: 'roofDeck' },
        // Tiang Pagar
        { scale: [0.04, 0.3, 0.04], offset: [-0.45, 0.61, -0.45], material: 'railing' },
        { scale: [0.04, 0.3, 0.04], offset: [0.45, 0.61, -0.45], material: 'railing' },
        { scale: [0.04, 0.3, 0.04], offset: [0.45, 0.61, 0.45], material: 'railing' },
        { scale: [0.04, 0.3, 0.04], offset: [-0.45, 0.61, 0.45], material: 'railing' },
        // Rel Pagar
        { scale: [0.94, 0.03, 0.03], offset: [0, 0.74, -0.45], material: 'railing' },
        { scale: [0.94, 0.03, 0.03], offset: [0, 0.74, 0.45], material: 'railing' },
        { scale: [0.03, 0.03, 0.94], offset: [-0.45, 0.74, 0], material: 'railing' },
        { scale: [0.03, 0.03, 0.94], offset: [0.45, 0.74, 0], material: 'railing' }
      ];
    case 'STAIRS_MESH':
      return [
        { scale: [0.25, 0.25, 0.98], offset: [-0.375, -0.375, 0], material: 'wall' },
        { scale: [0.25, 0.5, 0.98], offset: [-0.125, -0.25, 0], material: 'wall' },
        { scale: [0.25, 0.75, 0.98], offset: [0.125, -0.125, 0], material: 'wall' },
        { scale: [0.25, 1.0, 0.98], offset: [0.375, 0, 0], material: 'wall' }
      ];
    case 'WATER_MESH':
      return [
        { scale: [0.98, 0.90, 0.98], offset: [0, -0.04, 0], material: 'water' }
      ];
    case 'LEAF_MESH':
      return [
        { scale: [0.98, 0.98, 0.98], offset: [0, 0, 0], material: 'leaf' }
      ];
    // ── BLOK BAHARU FASA 7+ ─────────────────────────────────────────
    case 'PILLAR_MESH':
      return [
        // Tiang utama langsing
        { scale: [0.28, 1.0, 0.28], offset: [0, 0, 0], material: 'pillar' },
        // Pangkal tiang (base)
        { scale: [0.70, 0.06, 0.70], offset: [0, -0.46, 0], material: 'pillarCap' },
        // Kepala tiang (capital)
        { scale: [0.70, 0.06, 0.70], offset: [0, 0.46, 0], material: 'pillarCap' },
      ];
    case 'GLASS_FULL_MESH':
      return [
        // Panel kaca penuh (transparent)
        { scale: [0.95, 0.95, 0.07], offset: [0, 0, 0], material: 'glassFull' },
        // Bingkai atas & bawah
        { scale: [0.95, 0.04, 0.15], offset: [0, 0.455, 0], material: 'glassFrame' },
        { scale: [0.95, 0.04, 0.15], offset: [0, -0.455, 0], material: 'glassFrame' },
        // Bingkai kiri & kanan
        { scale: [0.04, 0.87, 0.15], offset: [-0.455, 0, 0], material: 'glassFrame' },
        { scale: [0.04, 0.87, 0.15], offset: [0.455, 0, 0], material: 'glassFrame' },
      ];
    case 'GRASS_MESH':
      return [
        // Lapisan tanah (bawah)
        { scale: [0.98, 0.70, 0.98], offset: [0, -0.14, 0], material: 'dirt' },
        // Lapisan rumput (atas, lebih lebar sedikit)
        { scale: [0.99, 0.32, 0.99], offset: [0, 0.33, 0], material: 'grass' },
        // Tufts rumput — deco kecil
        { scale: [0.08, 0.14, 0.40], offset: [0, 0.54, 0], material: 'grassTuft' },
        { scale: [0.40, 0.14, 0.08], offset: [0, 0.54, 0], material: 'grassTuft' },
      ];
    case 'WOOD_MESH':
      return [
        // Papan kayu utama
        { scale: [0.98, 0.98, 0.98], offset: [0, 0, 0], material: 'wood' },
        // Garisan teks kayu (horizontal, ringan)
        { scale: [0.99, 0.04, 0.99], offset: [0, 0.30, 0], material: 'woodGrain' },
        { scale: [0.99, 0.04, 0.99], offset: [0, 0.05, 0], material: 'woodGrain' },
        { scale: [0.99, 0.04, 0.99], offset: [0, -0.20, 0], material: 'woodGrain' },
      ];
    case 'SAND_MESH':
      return [
        // Lapisan pasir utama
        { scale: [0.98, 0.72, 0.98], offset: [0, -0.13, 0], material: 'sand' },
        // Lapisan permukaan lembut
        { scale: [0.99, 0.26, 0.99], offset: [0, 0.35, 0], material: 'sandSurface' },
      ];
    case 'ROCK_MESH':
      return [
        // Batu utama tak sekata
        { scale: [0.88, 0.82, 0.88], offset: [0.03, 0, -0.02], material: 'rock' },
        // Ketulan kecil di atas
        { scale: [0.38, 0.22, 0.35], offset: [-0.22, 0.50, 0.18], material: 'rockLight' },
        { scale: [0.28, 0.18, 0.30], offset: [0.25, 0.47, -0.15], material: 'rockLight' },
      ];
    case 'FENCE_MESH':
      return [
        // Papan pagar mendatar atas
        { scale: [0.98, 0.06, 0.14], offset: [0, 0.28, 0], material: 'wood' },
        // Papan pagar mendatar bawah
        { scale: [0.98, 0.06, 0.14], offset: [0, -0.10, 0], material: 'wood' },
        // Tiang pagar: kiri, tengah, kanan
        { scale: [0.08, 0.55, 0.14], offset: [-0.42, 0.10, 0], material: 'wood' },
        { scale: [0.08, 0.55, 0.14], offset: [0, 0.10, 0], material: 'wood' },
        { scale: [0.08, 0.55, 0.14], offset: [0.42, 0.10, 0], material: 'wood' },
      ];
    case 'LANTERN_MESH':
      return [
        // Tiang lampu
        { scale: [0.08, 0.80, 0.08], offset: [0, -0.10, 0], material: 'lanternPole' },
        // Badan lampu
        { scale: [0.32, 0.28, 0.32], offset: [0, 0.38, 0], material: 'lanternBody' },
        // Kaca cahaya
        { scale: [0.22, 0.20, 0.22], offset: [0, 0.38, 0], material: 'lanternGlow' },
        // Atap lampu
        { scale: [0.38, 0.08, 0.38], offset: [0, 0.52, 0], material: 'lanternPole' },
      ];
    default:
      return [
        { scale: [0.98, 0.98, 0.98], offset: [0, 0, 0], material: 'generic' }
      ];
  }
};

// Komponen Pembantu Pergerakan Fizik Orang Pertama
function PlayerController({ walkMode }) {
  const { camera } = useThree();
  const playerRef = useRef();
  const keys = useRef({ w: false, a: false, s: false, d: false, space: false });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = true;
      if (key === 's' || key === 'arrowdown') keys.current.s = true;
      if (key === 'a' || key === 'arrowleft') keys.current.a = true;
      if (key === 'd' || key === 'arrowright') keys.current.d = true;
      if (key === ' ') keys.current.space = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = false;
      if (key === 's' || key === 'arrowdown') keys.current.s = false;
      if (key === 'a' || key === 'arrowleft') keys.current.a = false;
      if (key === 'd' || key === 'arrowright') keys.current.d = false;
      if (key === ' ') keys.current.space = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!walkMode || !playerRef.current) return;

    // Gerakkan kamera mengikut kedudukan kapsul fizikal
    const translation = playerRef.current.translation();
    camera.position.copy(translation);
    camera.position.y += 0.8; // Ketinggian mata dari tengah kapsul

    // Kira pergerakan
    const speed = 5.0;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const side = new THREE.Vector3(-direction.z, 0, direction.x);

    const velocity = new THREE.Vector3(0, 0, 0);
    if (keys.current.w) velocity.addScaledVector(direction, speed);
    if (keys.current.s) velocity.addScaledVector(direction, -speed);
    if (keys.current.a) velocity.addScaledVector(side, -speed);
    if (keys.current.d) velocity.addScaledVector(side, speed);

    // Dapatkan halaju semasa untuk kekalkan graviti Y
    const currentLinVel = playerRef.current.linvel();
    
    // Lompatan
    if (keys.current.space && Math.abs(currentLinVel.y) < 0.1) {
      currentLinVel.y = 6.0; // Kuasa lompat
      keys.current.space = false;
    }

    playerRef.current.setLinvel({ x: velocity.x, y: currentLinVel.y, z: velocity.z }, true);
  });

  if (!walkMode) return null;

  return (
    <RigidBody ref={playerRef} colliders="capsule" mass={1} position={[0, 5, 8]} enabledRotations={[false, false, false]}>
      <mesh visible={false}>
        <capsuleGeometry args={[0.3, 1.0, 4, 8]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    </RigidBody>
  );
}

export default function VoxelCanvas({ 
  voxels, 
  onAddVoxel, 
  onRemoveVoxel, 
  activeTool, 
  paletteName,
  cameraRef,
  timeOfDay = 17.00,
  walkMode = false,
  selectedVoxels = [],
  onSelectVoxel = () => {},
  onPasteVoxel = () => {},
  clipboard = null,
  blueprintMode = false,
  onInspectVoxel = () => {}
}) {
  const [preview, setPreview] = useState({ x: 0, y: 0, z: 0, active: false });
  const orbitRef = useRef();

  // Kira posisi collision (seluruh voxel) untuk fizikal
  const colliderPositions = React.useMemo(() => {
    return voxels.map(v => new THREE.Vector3(v.x, v.y + 0.5, v.z));
  }, [voxels]);
  
  // Rujukan kepada instanced meshes untuk material berbeza
  const refs = {
    foundation: useRef(),
    wall: useRef(),
    roofBase: useRef(),
    roofDeck: useRef(),
    railing: useRef(),
    glass: useRef(),
    water: useRef(),
    leaf: useRef(),
    generic: useRef(),
    // Blok Baharu
    pillar: useRef(),
    pillarCap: useRef(),
    glassFull: useRef(),
    glassFrame: useRef(),
    grass: useRef(),
    grassTuft: useRef(),
    dirt: useRef(),
    wood: useRef(),
    woodGrain: useRef(),
    sand: useRef(),
    sandSurface: useRef(),
    rock: useRef(),
    rockLight: useRef(),
    lanternPole: useRef(),
    lanternBody: useRef(),
    lanternGlow: useRef(),
  };

  const currentListsRef = useRef({
    foundation: [],
    wall: [],
    roofBase: [],
    roofDeck: [],
    railing: [],
    glass: [],
    water: [],
    leaf: [],
    generic: [],
    // Blok Baharu
    pillar: [],
    pillarCap: [],
    glassFull: [],
    glassFrame: [],
    grass: [],
    grassTuft: [],
    dirt: [],
    wood: [],
    woodGrain: [],
    sand: [],
    sandSurface: [],
    rock: [],
    rockLight: [],
    lanternPole: [],
    lanternBody: [],
    lanternGlow: [],
  });

  const colors = COLOR_PALETTES[paletteName] || COLOR_PALETTES.brutalist_raw;

  // --- LOGIK INSTANCED MESHES UPDATE ---
  useEffect(() => {
    const subMeshesByMaterial = {
      foundation: [],
      wall: [],
      roofBase: [],
      roofDeck: [],
      railing: [],
      glass: [],
      water: [],
      leaf: [],
      generic: [],
      // Blok Baharu
      pillar: [],
      pillarCap: [],
      glassFull: [],
      glassFrame: [],
      grass: [],
      grassTuft: [],
      dirt: [],
      wood: [],
      woodGrain: [],
      sand: [],
      sandSurface: [],
      rock: [],
      rockLight: [],
      lanternPole: [],
      lanternBody: [],
      lanternGlow: [],
    };

    voxels.forEach((voxel) => {
      const subList = getSubMeshesForType(voxel.type);
      subList.forEach(sub => {
        subMeshesByMaterial[sub.material].push({
          position: [voxel.x, voxel.y + 0.5, voxel.z],
          rotationY: voxel.rotationY || 0,
          offset: sub.offset,
          scale: sub.scale,
          voxel
        });
      });
    });

    currentListsRef.current = subMeshesByMaterial;

    Object.keys(refs).forEach(matKey => {
      const mesh = refs[matKey].current;
      if (!mesh) return;

      const list = subMeshesByMaterial[matKey];
      mesh.count = list.length;

      const matrix = new THREE.Matrix4();
      list.forEach((item, index) => {
        const position = new THREE.Vector3(...item.position);
        const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), item.rotationY);
        
        matrix.compose(position, rotation, new THREE.Vector3(1, 1, 1));

        const localPos = new THREE.Vector3(...item.offset);
        const localScale = new THREE.Vector3(...item.scale);
        const localMatrix = new THREE.Matrix4().compose(localPos, new THREE.Quaternion(), localScale);

        matrix.multiply(localMatrix);
        mesh.setMatrixAt(index, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [voxels, paletteName]);

  // --- LOGIK BLUEPRINT MODE ---
  useEffect(() => {
    Object.keys(refs).forEach(matKey => {
      const mesh = refs[matKey].current;
      if (!mesh || !mesh.material) return;
      
      if (blueprintMode) {
        mesh.material.wireframe = true;
        mesh.material.color.set('#00bfff');
        if (mesh.material.emissive) mesh.material.emissive.set('#000000');
        mesh.material.transparent = true;
        mesh.material.opacity = 0.8;
      } else {
        mesh.material.wireframe = false;
        mesh.material.color.set(colors[matKey] || colors.generic);
        
        // Kembalikan sifat khusus material
        if (matKey === 'glass' || matKey === 'glassFull') {
          mesh.material.transparent = true;
          mesh.material.opacity = matKey === 'glassFull' ? 0.25 : 0.4;
        } else if (matKey === 'water') {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.6;
        } else if (matKey === 'lanternGlow') {
          mesh.material.emissive.set(colors.lanternGlow);
          mesh.material.transparent = true;
          mesh.material.opacity = 0.9;
        } else {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
        }
      }
      mesh.material.needsUpdate = true;
    });
  }, [blueprintMode, colors]);

  // --- LOGIK INTERAKSI TETIKUS & SNAP ---
  const handlePointerMove = (e) => {
    if (walkMode) return; // Nyahaktifkan letakan dalam mod berjalan
    e.stopPropagation();
    const normal = e.face.normal;
    const point = e.point;

    const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.5));
    const x = Math.round(offsetPoint.x);
    const y = Math.round(offsetPoint.y - 0.5);
    const z = Math.round(offsetPoint.z);

    if (x >= -10 && x <= 10 && y >= 0 && y < 15 && z >= -10 && z <= 10) {
      setPreview({ x, y, z, active: true });
    } else {
      setPreview(prev => ({ ...prev, active: false }));
    }
  };

  const handlePointerOut = (e) => {
    setPreview(prev => ({ ...prev, active: false }));
  };

  const handleInstanceClick = (e, matKey) => {
    if (walkMode) return; 
    e.stopPropagation();
    const instanceId = e.instanceId;
    const list = currentListsRef.current[matKey];

    if (list && list[instanceId]) {
      const clickedVoxel = list[instanceId].voxel;
      if (activeTool === 'erase') {
        onRemoveVoxel(clickedVoxel.x, clickedVoxel.y, clickedVoxel.z);
        setPreview(prev => ({ ...prev, active: false }));
      } else if (activeTool === 'build') {
        const normal = e.face.normal;
        const point = e.point;
        const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.5));
        const x = Math.round(offsetPoint.x);
        const y = Math.round(offsetPoint.y - 0.5);
        const z = Math.round(offsetPoint.z);

        if (x >= -10 && x <= 10 && y >= 0 && y < 15 && z >= -10 && z <= 10) {
          onAddVoxel(x, y, z);
        }
      } else if (activeTool === 'paste') {
        const normal = e.face.normal;
        const point = e.point;
        const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.5));
        const x = Math.round(offsetPoint.x);
        const y = Math.round(offsetPoint.y - 0.5);
        const z = Math.round(offsetPoint.z);
        if (onPasteVoxel) onPasteVoxel(x, y, z);
      } else if (activeTool === 'select') {
        onSelectVoxel(clickedVoxel);
      } else if (activeTool === 'inspect') {
        onInspectVoxel(clickedVoxel);
      }
    }
  };

  // --- LOGIK SIMULASI WAKTU (TIME OF DAY) ---
  const timeVal = parseFloat(timeOfDay) || 12;
  const angle = (timeVal / 24) * Math.PI * 2 - Math.PI / 2;
  const radius = 15;
  const sunX = Math.cos(angle) * radius;
  const sunY = Math.sin(angle) * radius;
  const sunZ = 5;
  const sunPos = [sunX, sunY, sunZ];

  let skyColor = '#0e0f14';
  let sunColor = '#ffffff';
  let sunIntensity = 1.0;
  let ambientIntensity = 0.3;

  if (timeVal >= 5.0 && timeVal < 7.0) {
    const t = (timeVal - 5.0) / 2.0; 
    const colorSky = new THREE.Color('#0b0c10').lerp(new THREE.Color('#3a1b40'), t);
    skyColor = '#' + colorSky.getHexString();
    sunColor = '#ff6a00';
    sunIntensity = 0.2 + t * 0.8;
    ambientIntensity = 0.2 + t * 0.2;
  } else if (timeVal >= 7.0 && timeVal < 17.0) {
    let t = 0;
    if (timeVal < 12.0) {
      t = (timeVal - 7.0) / 5.0;
    } else {
      t = 1 - (timeVal - 12.0) / 5.0;
    }
    const colorSky = new THREE.Color('#3a1b40').lerp(new THREE.Color('#101525'), t);
    skyColor = '#' + colorSky.getHexString();
    sunColor = '#fffdf2';
    sunIntensity = 1.0 + t * 0.4;
    ambientIntensity = 0.4 + t * 0.2;
  } else if (timeVal >= 17.0 && timeVal < 19.0) {
    const t = (timeVal - 17.0) / 2.0;
    const colorSky = new THREE.Color('#101525').lerp(new THREE.Color('#502040'), t);
    skyColor = '#' + colorSky.getHexString();
    sunColor = '#ff5500';
    sunIntensity = 1.4 - t * 1.0;
    ambientIntensity = 0.6 - t * 0.3;
  } else {
    let t = 0;
    if (timeVal >= 19.0 && timeVal < 22.0) {
      t = (timeVal - 19.0) / 3.0;
    } else if (timeVal >= 3.0 && timeVal < 5.0) {
      t = 1 - (timeVal - 3.0) / 2.0;
    } else {
      t = 1.0;
    }
    const colorSky = new THREE.Color('#502040').lerp(new THREE.Color('#050508'), t);
    skyColor = '#' + colorSky.getHexString();
    sunColor = '#8ba1ff';
    sunIntensity = 0.15 * (1.0 - t * 0.4);
    ambientIntensity = 0.15;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [8, 8, 8], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[skyColor]} />
        <ambientLight intensity={ambientIntensity} />
        
        {sunY > -2 && (
          <directionalLight
            castShadow
            position={sunPos}
            color={sunColor}
            intensity={sunIntensity}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
            shadow-bias={-0.0005}
          />
        )}
        
        <pointLight position={[-10, 10, -10]} intensity={0.2} />

        {/* Pemilihan Kontrol Kamera Dinamik */}
        {walkMode ? (
          <PointerLockControls />
        ) : (
          <OrbitControls 
            ref={orbitRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        )}

        <Physics gravity={[0, -15, 0]}>
          {/* Sempadan Tanah Supaya Tidak Jatuh Ke Bawah Terus */}
          <RigidBody type="fixed" position={[0, -0.5, 0]}>
            <CuboidCollider args={[1000, 0.5, 1000]} />
          </RigidBody>

          {/* Voxel Colliders Dinamik */}
          <InstancedRigidBodies key={colliderPositions.length} positions={colliderPositions} colliders="cuboid" type="fixed">
            <instancedMesh args={[null, null, colliderPositions.length]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial visible={false} />
            </instancedMesh>
          </InstancedRigidBodies>

          {/* Pemain Fizikal */}
          <PlayerController walkMode={walkMode} />

          <gridHelper args={[20, 20, '#aa3bff', '#2e303a']} position={[0, 0.01, 0]} />

        {/* Permukaan Grid Halimunan */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
          onPointerMove={handlePointerMove}
          onClick={(e) => {
            if (walkMode) return;
            e.stopPropagation();
            if (activeTool === 'build') {
              const point = e.point;
              const x = Math.round(point.x);
              const z = Math.round(point.z);
              if (x >= -10 && x <= 10 && z >= -10 && z <= 10) {
                onAddVoxel(x, 0, z);
              }
            } else if (activeTool === 'paste') {
              const point = e.point;
              const x = Math.round(point.x);
              const z = Math.round(point.z);
              if (onPasteVoxel) onPasteVoxel(x, 0, z);
            }
          }}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* --- RENDER INSTANCED MESHES --- */}
        
        {/* Asas */}
        <instancedMesh
          ref={refs.foundation}
          args={[null, null, 3000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'foundation')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.foundation} roughness={0.9} metalness={0.1} />
        </instancedMesh>

        {/* Dinding */}
        <instancedMesh
          ref={refs.wall}
          args={[null, null, 3000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'wall')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.wall} roughness={0.7} />
        </instancedMesh>

        {/* Tapak Bumbung */}
        <instancedMesh
          ref={refs.roofBase}
          args={[null, null, 3000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'roofBase')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.roofBase} roughness={0.7} />
        </instancedMesh>

        {/* Dek Kayu Bumbung */}
        <instancedMesh
          ref={refs.roofDeck}
          args={[null, null, 3000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'roofDeck')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.roofDeck} roughness={0.8} />
        </instancedMesh>

        {/* Railing */}
        <instancedMesh
          ref={refs.railing}
          args={[null, null, 3000]}
          castShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'railing')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.railing} roughness={0.5} />
        </instancedMesh>

        {/* Kaca */}
        <instancedMesh
          ref={refs.glass}
          args={[null, null, 3000]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'glass')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={colors.glass} 
            transparent 
            opacity={0.4} 
            roughness={0.1} 
            metalness={0.9} 
          />
        </instancedMesh>

        {/* Air (Water) */}
        <instancedMesh
          ref={refs.water}
          args={[null, null, 1000]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'water')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={colors.water} 
            transparent 
            opacity={0.6} 
            roughness={0.1} 
            metalness={0.5} 
          />
        </instancedMesh>

        {/* Daun (Leaves) */}
        <instancedMesh
          ref={refs.leaf}
          args={[null, null, 1000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'leaf')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.leaf} roughness={0.9} metalness={0.0} />
        </instancedMesh>

        {/* Blok Standard (Generic) */}
        <instancedMesh
          ref={refs.generic}
          args={[null, null, 3000]}
          castShadow
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'generic')}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.generic} roughness={0.6} />
        </instancedMesh>

        {/* ── Blok Baharu ─────────────────────────────────────────── */}

        {/* Tiang (Pillar) */}
        <instancedMesh ref={refs.pillar} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'pillar')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.pillar} roughness={0.4} metalness={0.1} />
        </instancedMesh>

        <instancedMesh ref={refs.pillarCap} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'pillarCap')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.pillarCap} roughness={0.3} metalness={0.2} />
        </instancedMesh>

        {/* Kaca Penuh (Full Glass) */}
        <instancedMesh ref={refs.glassFull} args={[null, null, 2000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'glassFull')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.glassFull} transparent opacity={0.25} roughness={0.0} metalness={1.0} />
        </instancedMesh>

        <instancedMesh ref={refs.glassFrame} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'glassFrame')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.glassFrame} roughness={0.3} metalness={0.6} />
        </instancedMesh>

        {/* Rumput (Grass) */}
        <instancedMesh ref={refs.grass} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'grass')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.grass} roughness={0.9} />
        </instancedMesh>

        <instancedMesh ref={refs.grassTuft} args={[null, null, 2000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'grassTuft')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.grassTuft} roughness={1.0} />
        </instancedMesh>

        <instancedMesh ref={refs.dirt} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'dirt')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.dirt} roughness={1.0} />
        </instancedMesh>

        {/* Kayu (Wood) */}
        <instancedMesh ref={refs.wood} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'wood')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.wood} roughness={0.8} />
        </instancedMesh>

        <instancedMesh ref={refs.woodGrain} args={[null, null, 2000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'woodGrain')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.woodGrain} roughness={0.9} />
        </instancedMesh>

        {/* Pasir (Sand) */}
        <instancedMesh ref={refs.sand} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'sand')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.sand} roughness={1.0} />
        </instancedMesh>

        <instancedMesh ref={refs.sandSurface} args={[null, null, 2000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'sandSurface')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.sandSurface} roughness={0.95} />
        </instancedMesh>

        {/* Batu (Rock) */}
        <instancedMesh ref={refs.rock} args={[null, null, 2000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'rock')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.rock} roughness={0.85} metalness={0.05} />
        </instancedMesh>

        <instancedMesh ref={refs.rockLight} args={[null, null, 2000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'rockLight')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.rockLight} roughness={0.7} />
        </instancedMesh>

        {/* Lentera (Lantern) */}
        <instancedMesh ref={refs.lanternPole} args={[null, null, 1000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'lanternPole')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.lanternPole} roughness={0.3} metalness={0.8} />
        </instancedMesh>

        <instancedMesh ref={refs.lanternBody} args={[null, null, 1000]} castShadow receiveShadow
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'lanternBody')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.lanternBody} roughness={0.4} metalness={0.6} />
        </instancedMesh>

        <instancedMesh ref={refs.lanternGlow} args={[null, null, 1000]}
          onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}
          onClick={(e) => handleInstanceClick(e, 'lanternGlow')}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={colors.lanternGlow} emissive={colors.lanternGlow} emissiveIntensity={2.0} transparent opacity={0.9} roughness={0.0} />
        </instancedMesh>

        {/* Pratinjau Letakan Biasa (Bina) */}
        {preview.active && activeTool === 'build' && !walkMode && (
          <mesh position={[preview.x, preview.y + 0.5, preview.z]}>
            <boxGeometry args={[1.01, 1.01, 1.01]} />
            <meshStandardMaterial color="#aa3bff" transparent opacity={0.3} />
          </mesh>
        )}

        {/* Pratinjau Letakan Mod Tampal (Paste) */}
        {preview.active && activeTool === 'paste' && !walkMode && clipboard && clipboard.voxels.map((cv, i) => (
          <mesh key={`preview-paste-${i}`} position={[cv.x - clipboard.minX + preview.x, cv.y - clipboard.minY + preview.y + 0.5, cv.z - clipboard.minZ + preview.z]} raycast={() => null}>
            <boxGeometry args={[1.01, 1.01, 1.01]} />
            <meshStandardMaterial color="#00ffff" transparent opacity={0.4} emissive="#00ffff" emissiveIntensity={0.5} wireframe={true} />
          </mesh>
        ))}

        {/* Serlahan Pilihan (Selection Highlight) */}
        {activeTool === 'select' && selectedVoxels.map((sv, i) => (
          <mesh key={`sel-${i}`} position={[sv.x, sv.y + 0.5, sv.z]} raycast={() => null}>
            <boxGeometry args={[1.02, 1.02, 1.02]} />
            <meshStandardMaterial color="#ffea00" emissive="#ffea00" emissiveIntensity={0.5} wireframe={true} />
          </mesh>
        ))}

        <EffectComposer disableNormalPass>
          <SSAO radius={0.4} intensity={50} luminanceInfluence={0.5} color="black" />
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>

        </Physics>
      </Canvas>
      
      {/* Petunjuk Koordinat */}
      {preview.active && activeTool === 'build' && !walkMode && !blueprintMode && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(14, 15, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 14px',
          borderRadius: '8px',
          color: '#e5e4e7',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '13px',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          X: {preview.x} | Y: {preview.y} | Z: {preview.z}
        </div>
      )}
    </div>
  );
}
