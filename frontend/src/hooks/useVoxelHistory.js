import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

/**
 * Custom Hook: useVoxelHistory
 * Mengurus tindanan sejarah Undo/Redo bagi senarai voksel.
 * 
 * Mengembalikan:
 * - voxels: Senarai voksel semasa
 * - setVoxelsWithHistory: Fungsi untuk mengemas kini voksel DAN merekod sejarah
 * - undo: Fungsi untuk membatalkan tindakan terakhir
 * - redo: Fungsi untuk mengulangi tindakan yang dibatalkan
 * - canUndo: Boolean, true jika ada tindakan yang boleh dibatalkan
 * - canRedo: Boolean, true jika ada tindakan yang boleh diulang
 */
export function useVoxelHistory(initialVoxels = []) {
  const [voxels, setVoxels] = useState(initialVoxels);
  const past = useRef([]); // Tindanan tindakan lalu (untuk Undo)
  const future = useRef([]); // Tindanan tindakan hadapan (untuk Redo)

  /**
   * Menetapkan keadaan voksel baru DAN merekodkan keadaan sebelumnya ke tindanan Undo.
   * Gunakan fungsi ini menggantikan setVoxels biasa untuk setiap tindakan bina/padam.
   */
  const setVoxelsWithHistory = useCallback((newVoxelsOrUpdater) => {
    setVoxels(currentVoxels => {
      const newVoxels = typeof newVoxelsOrUpdater === 'function' 
        ? newVoxelsOrUpdater(currentVoxels) 
        : newVoxelsOrUpdater;
      
      // Simpan keadaan semasa ke tindanan Undo
      past.current = [...past.current.slice(-MAX_HISTORY + 1), currentVoxels];
      
      // Padamkan tindanan Redo apabila ada tindakan baru
      future.current = [];
      
      return newVoxels;
    });
  }, []);

  /**
   * Membatalkan tindakan terakhir (Undo).
   */
  const undo = useCallback(() => {
    if (past.current.length === 0) return;

    setVoxels(currentVoxels => {
      const previousVoxels = past.current[past.current.length - 1];
      
      // Pindahkan keadaan semasa ke tindanan Redo
      future.current = [currentVoxels, ...future.current.slice(0, MAX_HISTORY - 1)];
      
      // Keluarkan keadaan terakhir dari tindanan Undo
      past.current = past.current.slice(0, -1);
      
      return previousVoxels;
    });
  }, []);

  /**
   * Mengulangi tindakan yang dibatalkan (Redo).
   */
  const redo = useCallback(() => {
    if (future.current.length === 0) return;

    setVoxels(currentVoxels => {
      const nextVoxels = future.current[0];
      
      // Pindahkan keadaan semasa kembali ke tindanan Undo
      past.current = [...past.current.slice(-MAX_HISTORY + 1), currentVoxels];
      
      // Keluarkan keadaan pertama dari tindanan Redo
      future.current = future.current.slice(1);
      
      return nextVoxels;
    });
  }, []);

  /**
   * Menetapkan keadaan voksel TANPA merekod sejarah (cth: untuk muatkan projek).
   */
  const resetVoxels = useCallback((newVoxels) => {
    past.current = [];
    future.current = [];
    setVoxels(newVoxels);
  }, []);

  return {
    voxels,
    setVoxelsWithHistory,
    resetVoxels,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
