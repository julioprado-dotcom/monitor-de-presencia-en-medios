'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, ShieldAlert, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { TopVariations } from '@/components/dashboard/TopVariations';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { usePolling } from './hooks/usePolling';
import type { SystemMetrics } from '@/types/dashboard';
import type { AiHealthData } from './sections/SystemStatusOrbs';
import type { EntregasHoyData } from './sections/EntregasHoy';

// ─── Types ────────────────────────────────────────────────────

interface AlertasComercialesData {
  topVariaciones: {
    personas: { id: string; nombre: string; slug?: string; color?: string; icono?: string; partidoSigla?: string; camara?: string; mencionesActuales: number; mencionesAnteriores: number; variacion: number }[];
    ejes: { id: string; nombre: string; slug?: string; color?: string; icono?: string; partidoSigla?: string; camara?: string; mencionesActuales: number; mencionesAnteriores: number; variacion: number }[];
  };
  contratosPorVencer: { id: string; clienteId: string; clienteNombre: string; tipoProducto: string; frecuencia: string; fechaFin: string; diasRestantes: number; montoMensual: number; moneda: string }[];
  solicitudesPendientes: { contratoId: string; tipo: string; descripcion: string; clienteNombre: string }[];
  entregasPendientes: number;
}

// ─── Lazy-loaded sections (code-split) ───────────────────────

const SystemStatusOrbs = dynamic(
  () => import('./sections/SystemStatusOrbs').then(m => ({ default: m.SystemStatusOrbs })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const EntregasHoy = dynamic(
  () => import('./sections/EntregasHoy').then(m => ({ default: m.EntregasHoy })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const CategoryCardsGrid = dynamic(
  () => import('./sections/CategoryCardsGrid').then(m => ({ default: m.CategoryCardsGrid })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const ActivityFeed = dynamic(
  () => import('./sections/ActivityFeed').then(m => ({ default: m.ActivityFeed })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const QuickActions = dynamic(
  () => import('./sections/QuickActions').then(m => ({ default: m.QuickActions })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);

// ─── Already-dynamic heavy sub-components ─────────────────────

const PipelineMonitor = dynamic(
  () => import('@/components/dashboard/PipelineMonitor').then(m => ({ default: m.PipelineMonitor })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const ScrapingPhaseControl = dynamic(
  () => import('@/components/dashboard/ScrapingPhaseControl').then(m => ({ default: m.ScrapingPhaseControl })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);
const AlarmasComerciales = dynamic(
  () => import('@/components/dashboard/AlarmasComerciales').then(m => ({ default: m.AlarmasComerciales })),
  { ssr: false, loading: () => <Card className="border"><CardContent className="p-4 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card> }
);

// ─── Animation variants ──────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

// ═══════════════════════════════════════════════════════════
// Main Orchestrator
// ═══════════════════════════════════════════════════════════

export function DashboardCommandCenter() {
  const data = useDashboardStore((s) => s.data);
  const mediosHealth = useDashboardStore((s) => s.mediosHealth);
  const setActiveView = useDashboardStore((s) => s.setActiveView);

  // State
  const [sysMetrics, setSysMetrics] = useState<SystemMetrics | null>(null);
  const [alertasCom, setAlertasCom] = useState<AlertasComercialesData | null>(null);
  const [entregasHoy, setEntregasHoy] = useState<EntregasHoyData | null>(null);
  const [aiHealth, setAiHealth] = useState<AiHealthData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [mcResumen, setMcResumen] = useState<{
    inicializado: boolean;
    version: number | null;
    vacios: string[];
  } | null>(null);

  // Fetch functions
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/system', { timeoutMs: 12_000 });
      if (res.ok) setSysMetrics(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchAlertasComerciales = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/alertas-comerciales', { timeoutMs: 12_000 });
      if (res.ok) setAlertasCom(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchEntregasHoy = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/entregas-hoy', { timeoutMs: 12_000 });
      if (res.ok) setEntregasHoy(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchAiHealth = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/ai-health', { timeoutMs: 12_000 });
      if (res.ok) setAiHealth(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchPipelineStats = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/pipeline', { timeoutMs: 12_000 });
      if (res.ok) setPipelineData(await res.json());
    } catch { /* silent */ }
  }, []);

  const fetchMC = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/marco-conceptual/resumen', { timeoutMs: 12_000 });
      if (res.ok) setMcResumen(await res.json());
    } catch { /* silent */ }
  }, []);

  // Polling
  usePolling(fetchSystemMetrics, 30_000);
  usePolling(fetchAlertasComerciales, 30_000);
  usePolling(fetchEntregasHoy, 30_000);
  usePolling(fetchAiHealth, 30_000);
  usePolling(fetchPipelineStats, 15_000);
  usePolling(fetchMC, 60_000);

  // Loading skeleton
  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <BarChart3 className="h-8 w-8 opacity-40" />
          <span className="text-sm">Cargando Centro de Comando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ═══ Section 1: Diagnostico del Sistema + StatusOrbs ═══ */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 gap-3 sm:gap-4">
        <motion.div custom={0} variants={fadeInUp}>
          <SystemStatusOrbs
            sysMetrics={sysMetrics}
            entregasHoy={entregasHoy}
            aiHealth={aiHealth}
            mcResumen={mcResumen}
            setActiveView={setActiveView}
          />
        </motion.div>
        <motion.div custom={1} variants={fadeInUp}>
          <EntregasHoy entregasHoy={entregasHoy} setActiveView={setActiveView} />
        </motion.div>
        <motion.div custom={2} variants={fadeInUp}>
          <PipelineMonitor data={pipelineData} onRefresh={fetchPipelineStats} />
        </motion.div>
        <motion.div custom={3} variants={fadeInUp}>
          <ScrapingPhaseControl />
        </motion.div>
      </motion.div>

      {/* ═══ Section 2: Category Cards ═══ */}
      <CategoryCardsGrid data={data} mediosHealth={mediosHealth} setActiveView={setActiveView} />

      {/* ═══ Section 3: Activity Feed ═══ */}
      <ActivityFeed data={data} mediosHealth={mediosHealth} setActiveView={setActiveView} />

      {/* ═══ Section 4: Top Variaciones + Alarmas Comerciales ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={8}>
          {alertasCom ? (
            <TopVariations data={alertasCom.topVariaciones} onNavigate={setActiveView} />
          ) : (
            <Card className="hover:shadow-md transition-all">
              <CardContent className="py-10 text-center">
                <div className="animate-pulse flex flex-col items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-5 w-5 opacity-40" />
                  <span className="text-xs">Calculando variaciones...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={9}>
          {alertasCom ? (
            <AlarmasComerciales
              contratosPorVencer={alertasCom.contratosPorVencer}
              solicitudesPendientes={alertasCom.solicitudesPendientes}
              entregasPendientes={alertasCom.entregasPendientes}
              onNavigate={setActiveView}
            />
          ) : (
            <Card className="hover:shadow-md transition-all">
              <CardContent className="py-10 text-center">
                <div className="animate-pulse flex flex-col items-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-5 w-5 opacity-40" />
                  <span className="text-xs">Cargando alarmas comerciales...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* ═══ Section 5: Quick Actions ═══ */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={10}>
        <QuickActions sysMetrics={sysMetrics} setActiveView={setActiveView} />
      </motion.div>
    </div>
  );
}
