import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import VoxelCanvas from './components/VoxelCanvas';
import Minimap from './components/Minimap';
import { useVoxelHistory } from './hooks/useVoxelHistory';
import * as THREE from 'three';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { COLOR_PALETTES } from './components/VoxelBlock';
import { generateTerrain } from './utils/terrainGenerator';
import { evaluateAllVoxels, inBounds } from './utils/voxelLogic';
import { BUILDING_PRESETS } from './data/presets';
import BlockInspector from './components/BlockInspector';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// ─── PROSEDURAL ENGINE ──────────────────────────────────────────────────────

// Logic exported to src/utils/voxelLogic.js

const DEMO_VILLA = [
  { x: -1, y: 0, z: -1, isStair: false }, { x: 0, y: 0, z: -1, isStair: false }, { x: 1, y: 0, z: -1, isStair: false },
  { x: -1, y: 0, z: 0, isStair: false },  { x: 0, y: 0, z: 0, isStair: false },  { x: 1, y: 0, z: 0, isStair: false },
  { x: -1, y: 0, z: 1, isStair: false },  { x: 0, y: 0, z: 1, isStair: false },  { x: 1, y: 0, z: 1, isStair: false },
  { x: -2, y: 0, z: 0, isStair: false },  { x: 2, y: 0, z: 0, isStair: false },
  { x: 2, y: 0, z: 1, isStair: true }, { x: -2, y: 0, z: -1, isStair: true },
  { x: -1, y: 1, z: -1, isStair: false }, { x: 0, y: 1, z: -1, isStair: false }, { x: 1, y: 1, z: -1, isStair: false },
  { x: -1, y: 1, z: 1, isStair: false },  { x: 0, y: 1, z: 1, isStair: false },  { x: 1, y: 1, z: 1, isStair: false },
  { x: -2, y: 1, z: 0, isStair: false },  { x: 2, y: 1, z: 0, isStair: false },
  { x: -1, y: 2, z: -1, isStair: false }, { x: 0, y: 2, z: -1, isStair: false }, { x: 1, y: 2, z: -1, isStair: false },
  { x: -1, y: 2, z: 1, isStair: false },  { x: 0, y: 2, z: 1, isStair: false },  { x: 1, y: 2, z: 1, isStair: false },
];

// ─── ACCORDION COMPONENT ──────────────────────────────────────────────────────
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <h2 style={{ fontSize: '13px', margin: 0, fontWeight: 600, letterSpacing: '0.5px' }}>{title}</h2>
        <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      <div className="accordion-content-wrapper">
        <div className="accordion-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── KOMPONEN HALAMAN UTAMA ──────────────────────────────────────────────────

function EditorPage() {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams();

  const { voxels, setVoxelsWithHistory, resetVoxels, undo, redo, canUndo, canRedo } = useVoxelHistory([]);
  const [activeTool, setActiveTool] = useState('build');
  const [activeBlockType, setActiveBlockType] = useState('standard');
  const [palette, setPalette] = useState('brutalist_raw');
  const [timeOfDay, setTimeOfDay] = useState(17.00);
  const [walkMode, setWalkMode] = useState(false);
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [terrainSize, setTerrainSize] = useState(15);
  const [inspectedVoxel, setInspectedVoxel] = useState(null);

  // Copy-Paste Region State
  const [selectedVoxels, setSelectedVoxels] = useState([]);
  const [clipboard, setClipboard] = useState(null); // { voxels, minX, minY, minZ }
  
  // Sidebar Tabs
  const [activeSidebarTab, setActiveSidebarTab] = useState('bina'); // 'bina', 'alam', 'sistem'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth State
  const [gallery, setGallery] = useState([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [userOnly, setUserOnly] = useState(false);

  // AI Gen State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const cameraRef = useRef();

  // ─── INISIALISASI ─────────────────────────────────────────────────────────

  useEffect(() => {
    const savedUser = localStorage.getItem('archivox_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (urlSlug) {
      // Muatkan projek dari slug URL
      fetch(`${API_BASE}/api/projects/${urlSlug}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            resetVoxels(evaluateAllVoxels(data.voxel_data));
            if (data.color_palette) setPalette(data.color_palette);
            if (data.time_of_day !== undefined) setTimeOfDay(data.time_of_day);
            setProjectTitle(data.title);
          }
        })
        .catch(console.error);
    } else {
      resetVoxels(evaluateAllVoxels(DEMO_VILLA));
    }
    fetchGallery();
  }, [urlSlug]);

  // ─── WEBSOCKETS REVERB ──────────────────────────────────────────────────
  useEffect(() => {
    if (!urlSlug) return;

    window.Pusher = Pusher;
    const echo = new Echo({
        broadcaster: 'reverb',
        key: '8qpomy22e1be4r1pwmxt',
        wsHost: 'localhost',
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
    });

    const channel = echo.channel(`project.${urlSlug}`);
    
    channel.listen('VoxelUpdated', (e) => {
      console.log('WS Received VoxelUpdated:', e);
      setVoxelsWithHistory(prev => {
        let newVoxels = [...prev];
        if (e.action === 'add' || e.action === 'batch') {
          // Buang voxels lama jika berlanggar dan masukkan yang baharu
          const incoming = e.voxels;
          newVoxels = newVoxels.filter(v => !incoming.some(inc => inc.x === v.x && inc.y === v.y && inc.z === v.z));
          newVoxels = [...newVoxels, ...incoming];
        } else if (e.action === 'remove') {
          const removed = e.voxels;
          newVoxels = newVoxels.filter(v => !removed.some(rm => rm.x === v.x && rm.y === v.y && rm.z === v.z));
        }
        return evaluateAllVoxels(newVoxels);
      });
    });

    return () => {
      echo.leaveChannel(`project.${urlSlug}`);
    };
  }, [urlSlug]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  // ─── GALERI & AUTH ────────────────────────────────────────────────────────

  const fetchGallery = async () => {
    try {
      const headers = {};
      if (user) headers['Authorization'] = `Bearer ${user.token}`;
      const url = userOnly
        ? `${API_BASE}/api/projects?user_only=true`
        : `${API_BASE}/api/projects`;
      const res = await fetch(url, { headers });
      if (res.ok) setGallery(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchGallery(); }, [user, userOnly]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'register' ? 'register' : 'login';
    const payload = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password };
    try {
      const res = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const loggedUser = { name: data.user.name, email: data.user.email, token: data.access_token };
        setUser(loggedUser);
        localStorage.setItem('archivox_user', JSON.stringify(loggedUser));
        toast.success(`Selamat datang, ${loggedUser.name}!`);
        setShowAuthModal(false);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        const err = await res.json();
        toast.error(err.message || 'Ralat autentikasi.');
      }
    } catch (err) { toast.error('Ralat sambungan ke pelayan.'); }
  };

  const handleLogout = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Accept': 'application/json' }
      });
    } catch {}
    setUser(null);
    localStorage.removeItem('archivox_user');
    setUserOnly(false);
  };

  // ─── INTERAKSI VOKSEL ─────────────────────────────────────────────────────

  const syncVoxelsAPI = async (action, voxelsData) => {
    if (!urlSlug) return;
    try {
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${user.token}`;
      await fetch(`${API_BASE}/api/projects/${urlSlug}/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, voxels: voxelsData })
      });
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const handleAddVoxel = (x, y, z) => {
    if (voxels.some(v => v.x === x && v.y === y && v.z === z)) return;

    const BLOCK_TYPE_MAP = {
      stairs: { type: 'STAIRS_MESH', isStair: true },
      water: { type: 'WATER_MESH', isStair: false },
      leaf: { type: 'LEAF_MESH', isStair: false },
      pillar: { type: 'PILLAR_MESH', isStair: false },
      glass: { type: 'GLASS_FULL_MESH', isStair: false },
      grass: { type: 'GRASS_MESH', isStair: false },
      wood: { type: 'WOOD_MESH', isStair: false },
      sand: { type: 'SAND_MESH', isStair: false },
      rock: { type: 'ROCK_MESH', isStair: false },
      fence: { type: 'FENCE_MESH', isStair: false },
      lantern: { type: 'LANTERN_MESH', isStair: false },
    };

    const blockDef = BLOCK_TYPE_MAP[activeBlockType] || { type: 'GENERIC_BLOCK', isStair: false };
    const newVoxel = { x, y, z, isStair: blockDef.isStair, type: blockDef.type };
    setVoxelsWithHistory(prev =>
      evaluateAllVoxels([...prev, newVoxel])
    );
    syncVoxelsAPI('add', [newVoxel]);
  };


  const handleRemoveVoxel = (x, y, z) => {
    setVoxelsWithHistory(prev => evaluateAllVoxels(prev.filter(v => !(v.x === x && v.y === y && v.z === z))));
    syncVoxelsAPI('remove', [{ x, y, z }]);
  };

  const handleGenerateTerrain = (theme) => {
    const terrainVoxels = generateTerrain(theme, parseInt(terrainSize));
    let unique = [];
    setVoxelsWithHistory(prev => {
      unique = terrainVoxels.filter(tv => !prev.some(ev => ev.x === tv.x && ev.y === tv.y && ev.z === tv.z));
      return evaluateAllVoxels([...prev, ...unique]);
    });
    if (unique.length > 0) syncVoxelsAPI('batch', unique);
  };

  const handleAddPreset = (preset) => {
    const minX = Math.min(...preset.voxels.map(v => v.x));
    const minY = Math.min(...preset.voxels.map(v => v.y));
    const minZ = Math.min(...preset.voxels.map(v => v.z));
    setClipboard({ voxels: preset.voxels, minX, minY, minZ });
    setActiveTool('paste');
  };

  const handleInspectChangeType = (voxel, newType) => {
    setVoxelsWithHistory(prev => {
      const newVoxels = prev.map(v => {
        if (v.x === voxel.x && v.y === voxel.y && v.z === voxel.z) {
          return { ...v, type: newType };
        }
        return v;
      });
      return evaluateAllVoxels(newVoxels);
    });
    setInspectedVoxel({ ...voxel, type: newType });
  };

  const handleInspectDelete = (voxel) => {
    handleRemoveVoxel(voxel.x, voxel.y, voxel.z);
    setInspectedVoxel(null);
  };

  const handleClear = () => { resetVoxels([]); setSelectedVoxels([]); setClipboard(null); };
  const handleLoadDemo = () => { resetVoxels(evaluateAllVoxels(DEMO_VILLA)); };
  const handleResetCamera = () => { if (cameraRef.current) cameraRef.current.reset(); };

  // ─── COPY-PASTE REGION ────────────────────────────────────────────────────

  const handleCopySelection = () => {
    if (selectedVoxels.length === 0) { toast.error('Pilih dahulu kawasan blok untuk disalin.'); return; }
    const minX = Math.min(...selectedVoxels.map(v => v.x));
    const minY = Math.min(...selectedVoxels.map(v => v.y));
    const minZ = Math.min(...selectedVoxels.map(v => v.z));
    setClipboard({ voxels: selectedVoxels, minX, minY, minZ });
    toast.success(`${selectedVoxels.length} blok telah disalin ke clipboard.`);
  };

  const handlePasteInit = () => {
    if (!clipboard) { toast.error('Clipboard kosong. Sila salin kawasan terlebih dahulu.'); return; }
    setActiveTool('paste');
  };

  const handlePasteClick = (offsetX, offsetY, offsetZ) => {
    if (!clipboard) return;
    const pastedVoxels = clipboard.voxels.map(v => ({
      ...v,
      x: v.x - clipboard.minX + offsetX,
      y: v.y - clipboard.minY + offsetY,
      z: v.z - clipboard.minZ + offsetZ,
    })).filter(inBounds);
    const unique = pastedVoxels.filter(pv => !voxels.some(ev => ev.x === pv.x && ev.y === pv.y && ev.z === pv.z));
    
    setVoxelsWithHistory(prev => evaluateAllVoxels([...prev, ...unique]));
    if (unique.length > 0) syncVoxelsAPI('batch', unique);
  };

  const handleMirrorX = () => {
    if (selectedVoxels.length === 0 && clipboard === null) { toast.error('Pilih atau salin kawasan terlebih dahulu.'); return; }
    const source = clipboard ? clipboard.voxels : selectedVoxels;
    const refX = Math.round((Math.min(...source.map(v => v.x)) + Math.max(...source.map(v => v.x))) / 2);
    const mirrored = source.map(v => ({ ...v, x: 2 * refX - v.x })).filter(inBounds);
    const unique = mirrored.filter(mv => !voxels.some(ev => ev.x === mv.x && ev.y === mv.y && ev.z === mv.z));
    
    if (unique.length > 0) {
      setVoxelsWithHistory(prev => evaluateAllVoxels([...prev, ...unique]));
      syncVoxelsAPI('batch', unique);
    }
    toast.success(`${unique.length} blok dicerminkan pada paksi-X.`);
  };

  const handleMirrorZ = () => {
    if (selectedVoxels.length === 0 && clipboard === null) { toast.error('Pilih atau salin kawasan terlebih dahulu.'); return; }
    const source = clipboard ? clipboard.voxels : selectedVoxels;
    const refZ = Math.round((Math.min(...source.map(v => v.z)) + Math.max(...source.map(v => v.z))) / 2);
    const mirrored = source.map(v => ({ ...v, z: 2 * refZ - v.z })).filter(inBounds);
    const unique = mirrored.filter(mv => !voxels.some(ev => ev.x === mv.x && ev.y === mv.y && ev.z === mv.z));
    
    if (unique.length > 0) {
      setVoxelsWithHistory(prev => evaluateAllVoxels([...prev, ...unique]));
      syncVoxelsAPI('batch', unique);
    }
    toast.success(`${unique.length} blok dicerminkan pada paksi-Z.`);
  };

  // ─── AI GENERATION ────────────────────────────────────────────────────────

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success && data.voxels) {
        const minX = Math.min(...data.voxels.map(v => v.x));
        const minY = Math.min(...data.voxels.map(v => v.y));
        const minZ = Math.min(...data.voxels.map(v => v.z));
        setClipboard({ voxels: data.voxels, minX, minY, minZ });
        setActiveTool('paste');
        toast.success('Bangunan berjaya dijana! Klik pada kanvas untuk meletakkannya.');
      } else {
        toast.error(data.message || 'Gagal menjana dari AI.');
      }
    } catch (err) {
      toast.error('Ralat rangkaian AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── SAVE / LOAD API ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!projectTitle.trim()) { toast.error('Sila masukkan nama projek!'); return; }
    if (voxels.length === 0) { toast.error('Kanvas kosong!'); return; }
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (user) headers['Authorization'] = `Bearer ${user.token}`;
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: projectTitle,
          voxel_data: voxels.map(v => ({ x: v.x, y: v.y, z: v.z, isStair: v.isStair || false, type: v.type })),
          color_palette: palette,
          time_of_day: timeOfDay,
          is_public: !user
        })
      });
      if (res.ok) {
        const saved = await res.json();
        toast.success(`Projek "${projectTitle}" berjaya disimpan!`);
        setProjectTitle('');
        fetchGallery();
        // Navigasi ke URL slug projek
        navigate(`/project/${saved.slug}`);
      } else {
        const err = await res.json();
        toast.error('Gagal menyimpan: ' + (err.message || res.statusText));
      }
    } catch (err) { toast.error('Ralat sambungan API.'); }
  };

  const handleLoadProject = (project) => {
    if (project.voxel_data) resetVoxels(evaluateAllVoxels(project.voxel_data));
    if (project.color_palette) setPalette(project.color_palette);
    if (project.time_of_day !== undefined) setTimeOfDay(project.time_of_day);
    navigate(`/project/${project.slug}`);
    toast.success(`Projek "${project.title}" dimuatkan.`);
  };

  const handleCopyProjectLink = (proj) => {
    const url = `${window.location.origin}/project/${proj.slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success(`Pautan disalin: ${url}`));
  };

  // ─── GLTF EXPORT ──────────────────────────────────────────────────────────

  const handleExportGLTF = () => {
    if (voxels.length === 0) { toast.error('Kanvas kosong!'); return; }
    const exporter = new GLTFExporter();
    const exportGroup = new THREE.Group();
    const colors = COLOR_PALETTES[palette] || COLOR_PALETTES.brutalist_raw;

    voxels.forEach(voxel => {
      const voxelGroup = new THREE.Group();
      voxelGroup.position.set(voxel.x, voxel.y + 0.5, voxel.z);
      voxelGroup.rotation.set(0, voxel.rotationY || 0, 0);
      const geometry = new THREE.BoxGeometry(0.98, 0.98, 0.98);
      const colorKey = voxel.type === 'FOUNDATION_MESH' ? 'foundation'
        : voxel.type === 'WALL_SOLID_MESH' || voxel.type === 'WALL_INTERMEDIATE_MESH' ? 'wall'
        : voxel.type === 'ROOF_MESH' ? 'roofBase'
        : voxel.type === 'STAIRS_MESH' ? 'wall'
        : voxel.type === 'WATER_MESH' ? 'water'
        : voxel.type === 'LEAF_MESH' ? 'leaf'
        : 'generic';
      const material = new THREE.MeshStandardMaterial({ color: colors[colorKey] || '#888' });
      voxelGroup.add(new THREE.Mesh(geometry, material));
      exportGroup.add(voxelGroup);
    });

    exporter.parse(exportGroup, (gltf) => {
      const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${projectTitle || 'archivox_model'}.gltf`;
      link.click();
    }, (err) => { toast.error('Gagal eksport.'); console.error(err); }, { binary: false });
  };

  // ─── STATISTIK ────────────────────────────────────────────────────────────

  const stats = {
    total: voxels.length,
    foundation: voxels.filter(v => v.type === 'FOUNDATION_MESH').length,
    wall: voxels.filter(v => v.type === 'WALL_INTERMEDIATE_MESH' || v.type === 'WALL_SOLID_MESH').length,
    roof: voxels.filter(v => v.type === 'ROOF_MESH').length,
    stairs: voxels.filter(v => v.type === 'STAIRS_MESH').length,
    water: voxels.filter(v => v.type === 'WATER_MESH').length,
    leaf: voxels.filter(v => v.type === 'LEAF_MESH').length,
  };

  const formatTime = (val) => {
    const hrs = Math.floor(val);
    const mins = Math.floor((val % 1) * 60).toString().padStart(2, '0');
    return `${hrs.toString().padStart(2, '0')}:${mins}`;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="app-container" tabIndex={0}>
      <Toaster position="top-center" toastOptions={{
        style: { background: 'rgba(30, 30, 35, 0.9)', color: '#fff', border: '1px solid rgba(170, 59, 255, 0.4)', backdropFilter: 'blur(10px)' },
      }}/>
      <div id="stars"></div>
      
      {!isSidebarOpen && (
        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          Menu
        </button>
      )}

      {isSidebarOpen && (
        <div 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <header className="brand-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-container">
              <svg className="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 22 22 22" />
              </svg>
            </div>
            <div>
              <h1>ArchiVox</h1>
              <p className="subtitle">Procedural Voxel Game</p>
            </div>
          </div>
          {isSidebarOpen && (
            <button className="btn-close" onClick={() => setIsSidebarOpen(false)} style={{ display: 'block' }}>
              &times;
            </button>
          )}
        </header>

        {/* Sesi Pengguna */}
        <div className="user-profile-section">
          {user ? (
            <div className="user-info-box">
              <div className="user-header">
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>Halo, <strong>{user.name}</strong>!</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button className="btn-auth-action" onClick={handleLogout}>Log Keluar</button>
                <label className="checkbox-container">
                  <input type="checkbox" checked={userOnly} onChange={(e) => setUserOnly(e.target.checked)} />
                  <span>Galeri Sendiri</span>
                </label>
              </div>
            </div>
          ) : (
            <button className="btn-auth-trigger" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
              <svg className="svg-icon" style={{ marginRight: '6px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Log Masuk / Daftar Arkitek
            </button>
          )}
        </div>

        <hr className="divider" />

        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeSidebarTab === 'bina' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('bina')}>Bina</button>
          <button className={`tab-btn ${activeSidebarTab === 'alam' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('alam')}>Alam</button>
          <button className={`tab-btn ${activeSidebarTab === 'sistem' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('sistem')}>Sistem</button>
        </div>

        {/* --- TAB BINA --- */}
        <div style={{ display: activeSidebarTab === 'bina' ? 'block' : 'none' }}>
          {/* Alatan */}
        <section className="menu-section">
          <h2>Kawalan Alatan</h2>
          <div className="tool-buttons">
            {[
              { id: 'build', icon: <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/>, label: 'Bina' },
              { id: 'erase', icon: <><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/></>, label: 'Padam' },
              { id: 'select', icon: <><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>, label: 'Pilih' },
              { id: 'paste', icon: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>, label: 'Tampal' },
              { id: 'inspect', icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, label: 'Periksa' }
            ].map(tool => (
              <button key={tool.id} className={`btn-tool ${activeTool === tool.id ? 'active' : ''}`} onClick={() => setActiveTool(tool.id)}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {tool.icon}
                </svg>
                {tool.label}
              </button>
            ))}
          </div>

          {/* Undo / Redo */}
          <div className="undo-redo-row">
            <button className={`btn-undo-redo ${!canUndo ? 'disabled' : ''}`} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.6 5.6L3 8"/>
              </svg>
              Undo
            </button>
            <button className={`btn-undo-redo ${!canRedo ? 'disabled' : ''}`} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.4 5.6L21 8"/>
              </svg>
              Redo
            </button>
          </div>
        </section>

        {/* Jenis Blok */}
        {activeTool === 'build' && (
          <section className="menu-section">
            <h2>Jenis Blok & Landskap</h2>
            <p className="section-group-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              BINAAN
            </p>
            <div className="palette-grid palette-grid-wide">
              {[
                { id: 'standard',  label: 'Standard' },
                { id: 'stairs',    label: 'Tangga' },
                { id: 'pillar',    label: 'Tiang' },
                { id: 'glass',     label: 'Kaca Penuh' },
                { id: 'fence',     label: 'Pagar' },
                { id: 'lantern',   label: 'Lentera' },
              ].map(b => (
                <button key={b.id} className={`btn-palette ${activeBlockType === b.id ? 'active' : ''}`}
                  onClick={() => setActiveBlockType(b.id)}>
                  {b.label}
                </button>
              ))}
            </div>
            <p className="section-group-label" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              LANDSKAP
            </p>
            <div className="palette-grid palette-grid-wide">
              {[
                { id: 'grass',  label: 'Rumput' },
                { id: 'wood',   label: 'Kayu' },
                { id: 'sand',   label: 'Pasir' },
                { id: 'rock',   label: 'Batu' },
                { id: 'water',  label: 'Kolam Air' },
                { id: 'leaf',   label: 'Dedaun' },
              ].map(b => (
                <button key={b.id} className={`btn-palette ${activeBlockType === b.id ? 'active' : ''}`}
                  onClick={() => setActiveBlockType(b.id)}>
                  {b.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Dipindahkan ke TAB ALAM */}

        {/* Copy-Paste (hanya dalam mod Pilih) */}
        {activeTool === 'select' && (
          <section className="menu-section">
            <h2>Salin & Tampal Rantau</h2>
            <div className="copy-paste-info">
              {selectedVoxels.length > 0 ? (
                <p className="selection-count">{selectedVoxels.length} blok dipilih</p>
              ) : (
                <p className="selection-hint">Klik blok di kanvas untuk pilih rantau</p>
              )}
            </div>
            <div className="action-buttons" style={{ marginTop: '8px' }}>
              <button className="btn-action" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleCopySelection}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Salin Kawasan
              </button>
              <button className="btn-action btn-load" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handlePasteInit}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
                </svg>
                Mod Tampal
              </button>
              <button className="btn-action" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleMirrorX}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18"/><path d="m9 7-3 3 3 3"/><path d="m15 7 3 3-3 3"/>
                </svg>
                Cermin X
              </button>
              <button className="btn-action" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleMirrorZ}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18"/><path d="m7 9-3 3 3 3"/><path d="m17 9 3 3-3 3"/>
                </svg>
                Cermin Z
              </button>
            </div>
          </section>
        )}
        </div>

        {/* --- TAB ALAM --- */}
        <div style={{ display: activeSidebarTab === 'alam' ? 'block' : 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <Accordion 
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Penjana Muka Bumi
            </span>
          } 
          defaultOpen={true}
        >
          <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Saiz (Grid):</span>
            <input type="number" min="5" max="30" value={terrainSize} onChange={e => setTerrainSize(e.target.value)} style={{ width: '50px', background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '4px', padding: '2px 4px', fontSize: '12px' }} />
          </div>
          <div className="palette-grid">
            {[
              { id: 'mountain', label: <span style={{display:'flex', gap:'4px', alignItems:'center'}}><svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'14px', height:'14px'}}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>Gunung</span> },
              { id: 'beach', label: <span style={{display:'flex', gap:'4px', alignItems:'center'}}><svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'14px', height:'14px'}}><path d="M22 12c-2.3 0-4.4-1-6-2.5C14.4 11 12.3 12 10 12s-4.4-1-6-2.5C2.4 11 .3 12-2 12"/></svg>Pantai</span> },
              { id: 'forest', label: <span style={{display:'flex', gap:'4px', alignItems:'center'}}><svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'14px', height:'14px'}}><path d="M12 22v-6"/><path d="m5 16 7-6 7 6"/><path d="m5 12 7-6 7 6"/><path d="m5 8 7-6 7 6"/></svg>Hutan</span> },
              { id: 'desert', label: <span style={{display:'flex', gap:'4px', alignItems:'center'}}><svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'14px', height:'14px'}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Gurun</span> }
            ].map(t => (
              <button key={t.id} className="btn-palette" onClick={() => handleGenerateTerrain(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </Accordion>

        <Accordion 
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              Penjana AI (Teks-ke-Bongkah)
            </span>
          } 
          defaultOpen={false}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea 
              placeholder="Contoh: Bina sebuah pondok kayu yang kecil..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="input-save"
              style={{ minHeight: '60px', resize: 'vertical' }}
            />
            <button className="btn-action" style={{ background: isGenerating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent-purple), #ff007f)', border: 'none', fontWeight: 'bold' }} onClick={handleGenerateAI} disabled={isGenerating}>
              {isGenerating ? '⏳ Menjana...' : 'Jana Bangunan AI'}
            </button>
          </div>
        </Accordion>

        <Accordion 
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
              Templat Bangunan
            </span>
          } 
          defaultOpen={false}
        >
          <div className="preset-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {BUILDING_PRESETS.map(p => (
              <button key={p.id} className="btn-action" onClick={() => handleAddPreset(p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', padding: '6px 8px' }}>
                <span style={{ fontSize: '16px' }}>{p.icon}</span>
                <span style={{ fontSize: '10px', textAlign: 'left', lineHeight: '1.2' }}>{p.name}<br/><span style={{ opacity: 0.5, fontSize: '9px' }}>{p.size}</span></span>
              </button>
            ))}
          </div>
        </Accordion>

        <Accordion 
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
              Persekitaran
            </span>
          } 
          defaultOpen={false}
        >
          <div className="slider-container" style={{ marginBottom: '16px' }}>
            <div className="slider-header">
              <span>Masa Simulasi</span>
              <span className="time-display">{formatTime(timeOfDay)}</span>
            </div>
            <input type="range" min="0.00" max="23.90" step="0.10" value={timeOfDay}
              onChange={(e) => setTimeOfDay(parseFloat(e.target.value))} className="time-slider" />
          </div>
          <div className="palette-grid">
            {['brutalist_raw', 'warm_timber', 'neon_grid', 'minimalist_white'].map(p => (
              <button key={p} className={`btn-palette ${palette === p ? 'active' : ''}`} onClick={() => setPalette(p)}>
                <span className={`color-preview ${p === 'brutalist_raw' ? 'brutalist' : p === 'warm_timber' ? 'timber' : p === 'neon_grid' ? 'neon' : 'minimalist'}`}></span>
                {p === 'brutalist_raw' ? 'Brutalist' : p === 'warm_timber' ? 'Timber' : p === 'neon_grid' ? 'Neon' : 'Minimalist'}
              </button>
            ))}
          </div>
        </Accordion>
        </div>
        {/* Kesemua ini telah dialihkan ke Accordion Persekitaran */}

        {/* --- TAB SISTEM --- */}
        <div style={{ display: activeSidebarTab === 'sistem' ? 'block' : 'none' }}>
        {/* Simpan */}
        <section className="menu-section">
          <h2>Simpan Projek</h2>
          <div className="save-container">
            <input type="text" placeholder="Nama binaan..." value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)} className="input-save" />
            <button className="btn-action btn-save-project" onClick={handleSave} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/>
              </svg>
              Simpan Projek
            </button>
          </div>
        </section>

        {/* Galeri */}
        <section className="menu-section">
          <h2>Galeri Projek {userOnly ? 'Peribadi' : 'Awam'}</h2>
          <div className="gallery-list">
            {gallery.length === 0 ? (
              <p className="no-projects">Tiada projek ditemui.</p>
            ) : (
              gallery.map(proj => (
                <div key={proj.id} className="gallery-item-wrapper">
                  <button className="btn-gallery-item" onClick={() => handleLoadProject(proj)}>
                    <span className="gallery-title">{proj.title}</span>
                    <span className="gallery-meta">{proj.voxel_data.length} blok | {proj.color_palette.replace('_', ' ')}</span>
                  </button>
                  <button className="btn-share-link" onClick={() => handleCopyProjectLink(proj)} title="Salin pautan projek">
                    <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Statistik */}
        <section className="menu-section stats-section">
          <h2>Statistik Seni Bina</h2>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-val">{stats.total}</span><span className="stat-lbl">Jumlah</span></div>
            <div className="stat-card"><span className="stat-val">{stats.foundation}</span><span className="stat-lbl">Asas</span></div>
            <div className="stat-card"><span className="stat-val">{stats.wall}</span><span className="stat-lbl">Dinding</span></div>
            <div className="stat-card"><span className="stat-val">{stats.roof}</span><span className="stat-lbl">Bumbung</span></div>
            <div className="stat-card"><span className="stat-val">{stats.stairs}</span><span className="stat-lbl">Tangga</span></div>
            <div className="stat-card"><span className="stat-val">{stats.water}</span><span className="stat-lbl">Air</span></div>
          </div>
        </section>
        </div>

        {/* Aksi Global (Sentiasa Kelihatan) */}
        <hr className="divider" />
        <section className="menu-section actions-section">
          <h2>Aksi Pantas & Eksport</h2>
          <div className="action-buttons">
            <button className={`btn-action ${walkMode ? 'active-walk-mode' : ''}`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}
              onClick={() => setWalkMode(prev => !prev)}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/>
              </svg>
              {walkMode ? 'Keluar Mod Berjalan' : 'Mod Berjalan (WASD)'}
            </button>
            <button className={`btn-action ${blueprintMode ? 'active' : ''}`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', background: blueprintMode ? 'rgba(0,191,255,0.1)' : '', borderColor: blueprintMode ? '#00bfff' : '', color: blueprintMode ? '#00bfff' : '' }}
              onClick={() => setBlueprintMode(prev => !prev)}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
              </svg>
              {blueprintMode ? 'Mod Normal' : 'Mod Blueprint'}
            </button>
            <button className="btn-action btn-load" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', background:'rgba(0,240,255,0.08)', borderColor:'rgba(0,240,255,0.3)' }} onClick={handleExportGLTF}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Eksport Model (GLTF)
            </button>
            <button className="btn-action" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleResetCamera}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
              </svg>
              Reset Pandangan
            </button>
            <button className="btn-action" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleLoadDemo}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Muat Demo Villa
            </button>
            <button className="btn-action btn-danger" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={handleClear}>
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
              Padam Semua
            </button>
          </div>
        </section>
      </aside>

      {/* KANVAS 3D */}
      <main className="canvas-wrapper">
        <div className="minimap-overlay">
            <Minimap voxels={voxels} paletteName={palette} />
        </div>

        {/* Block Inspector Overlay */}
        {inspectedVoxel && (
          <BlockInspector
            voxel={inspectedVoxel}
            onClose={() => setInspectedVoxel(null)}
            onChangeType={handleInspectChangeType}
            onDelete={handleInspectDelete}
          />
        )}

        <VoxelCanvas
          voxels={voxels}
          onAddVoxel={handleAddVoxel}
          onRemoveVoxel={handleRemoveVoxel}
          onInspectVoxel={setInspectedVoxel}
          onPasteVoxel={handlePasteClick}
          clipboard={clipboard}
          activeTool={activeTool}
          paletteName={palette}
          cameraRef={cameraRef}
          timeOfDay={timeOfDay}
          walkMode={walkMode}
          blueprintMode={blueprintMode}
          onSelectVoxel={(v) => {
            setSelectedVoxels(prev => {
              if (prev.length === 1) {
                const p1 = prev[0];
                const minX = Math.min(p1.x, v.x); const maxX = Math.max(p1.x, v.x);
                const minY = Math.min(p1.y, v.y); const maxY = Math.max(p1.y, v.y);
                const minZ = Math.min(p1.z, v.z); const maxZ = Math.max(p1.z, v.z);
                
                const regionVoxels = voxels.filter(block => 
                  block.x >= minX && block.x <= maxX &&
                  block.y >= minY && block.y <= maxY &&
                  block.z >= minZ && block.z <= maxZ
                );
                return regionVoxels.length > 0 ? regionVoxels : [v];
              }
              const isSelected = prev.some(s => s.x === v.x && s.y === v.y && s.z === v.z);
              if (isSelected) return prev.filter(s => !(s.x === v.x && s.y === v.y && s.z === v.z));
              return prev.length > 1 ? [v] : [...prev, v];
            });
          }}
        />

        {/* Peta Mini 2D */}
        <Minimap voxels={voxels} />

        {/* Overlay Arahan */}
        <div className="overlay-instructions">
          <h3>Panduan Navigasi</h3>
          {walkMode ? (
            <>
              <p className="neon-instruction" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                MOD BERJALAN AKTIF
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>
                W, A, S, D: Bergerak | Space: Lompat | ESC: Keluar
              </p>
            </>
          ) : activeTool === 'select' ? (
            <>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 4"/></svg>
                Klik 2 blok berlainan untuk pilih rantau (Bounding Box)
              </p>
              <p style={{color: '#ffea00'}}>Status: {selectedVoxels.length} blok dipilih</p>
            </>
          ) : activeTool === 'paste' ? (
            <>
              <p className="neon-instruction" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                MOD TAMPAL AKTIF
              </p>
              <p>Klik di mana-mana petak untuk meletakkan templat/salinan</p>
            </>
          ) : (
            <>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><rect x="5" y="2" width="14" height="20" rx="7" ry="7"/><path d="M12 6v4"/></svg>
                Klik Kiri + Seret: Pusing | Scroll: Zoom
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>
                Ctrl+Z: Undo | Ctrl+Shift+Z: Redo
              </p>
            </>
          )}
        </div>
      </main>

      {/* MODAL AUTENTIKASI */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-header">
              <h2>{authMode === 'login' ? 'Log Masuk Arkitek' : 'Daftar Akaun Arkitek'}</h2>
              <button className="btn-close" onClick={() => setShowAuthModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="form-group">
                  <label>Nama Penuh</label>
                  <input type="text" required value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Masukkan nama penuh..." />
                </div>
              )}
              <div className="form-group">
                <label>E-mel</label>
                <input type="email" required value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))} placeholder="name@company.com" />
              </div>
              <div className="form-group">
                <label>Kata Laluan</label>
                <input type="password" required value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Min 6 aksara..." />
              </div>
              <button type="submit" className="btn-auth-submit">
                {authMode === 'login' ? 'Masuk Sesi' : 'Daftar Akaun'}
              </button>
            </form>
            <div className="auth-footer">
              {authMode === 'login' ? (
                <p>Belum ada akaun? <button className="btn-auth-switch" onClick={() => setAuthMode('register')}>Daftar Sekarang</button></p>
              ) : (
                <p>Sudah ada akaun? <button className="btn-auth-switch" onClick={() => setAuthMode('login')}>Log Masuk</button></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KOMPONEN UTAMA APP (dengan routing) ──────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/project/:slug" element={<EditorPage />} />
    </Routes>
  );
}
