/**
 * Zustand Store — DECODEX Bolivia Dashboard
 * Contiene solo estado TRUE global (accedido por ≥2 vistas o el shell).
 * Cada vista maneja su propio estado local (fetch, loading, paginación).
 */
import { create } from 'zustand';
import type { DashboardData, MediosHealthData } from '@/types/dashboard';

interface DashboardStore {
  // Shell state
  activeView: string;
  sidebarOpen: boolean;
  setActiveView: (viewId: string) => void;
  setSidebarOpen: (open: boolean) => void;

  // Global data (loaded once at init)
  data: DashboardData | null;
  loading: boolean;
  error: string;
  setData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  setError: (msg: string) => void;
  clearError: () => void;

  // Medios health (loaded at init, used by ResumenView + CapturaView)
  mediosHealth: MediosHealthData | null;
  setMediosHealth: (data: MediosHealthData) => void;

  // Initialization
  initialize: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Shell
  activeView: 'resumen',
  sidebarOpen: false,
  setActiveView: (viewId) => set({ activeView: viewId, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Global data
  data: null,
  loading: true,
  error: '',
  setData: (data) => set({ data, loading: false, error: '' }),
  setLoading: (loading) => set({ loading }),
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: '' }),

  // Medios health
  mediosHealth: null,
  setMediosHealth: (data) => set({ mediosHealth: data }),

  // Initialize — load global data once
  initialize: async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Error al cargar datos');
      const json = await res.json();
      set({ data: json, loading: false, error: '' });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error desconocido',
        loading: false,
      });
    }

    // Load medios health in parallel
    try {
      const res = await fetch('/api/medios/health');
      if (res.ok) {
        const json = await res.json();
        set({ mediosHealth: json });
      }
    } catch {
      // silent — health check is non-critical
    }
  },
}));
