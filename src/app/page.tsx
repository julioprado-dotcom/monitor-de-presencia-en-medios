'use client';

import { useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/stores/useDashboardStore';
import { DashboardShell, LoadingScreen } from '@/components/dashboard/DashboardShell';

/* Lazy-loaded views - code splitting via next/dynamic */
const loading = () => <ViewSkeleton />;

const ResumenView = dynamic(() => import('@/components/views/ResumenView').then(m => ({ default: m.ResumenView })), { ssr: false, loading });
const MencionesView = dynamic(() => import('@/components/views/MencionesView').then(m => ({ default: m.MencionesView })), { ssr: false, loading });
const ClientesView = dynamic(() => import('@/components/views/ClientesView').then(m => ({ default: m.ClientesView })), { ssr: false, loading });
const ContratosView = dynamic(() => import('@/components/views/ContratosView').then(m => ({ default: m.ContratosView })), { ssr: false, loading });
const PersonasView = dynamic(() => import('@/components/views/PersonasView').then(m => ({ default: m.PersonasView })), { ssr: false, loading });
const MediosView = dynamic(() => import('@/components/views/MediosView').then(m => ({ default: m.MediosView })), { ssr: false, loading });
const ClasificadoresView = dynamic(() => import('@/components/views/ClasificadoresView').then(m => ({ default: m.ClasificadoresView })), { ssr: false, loading });
const GeneradoresView = dynamic(() => import('@/components/views/GeneradoresView').then(m => ({ default: m.GeneradoresView })), { ssr: false, loading });
const ReportesView = dynamic(() => import('@/components/views/ReportesView').then(m => ({ default: m.ReportesView })), { ssr: false, loading });
const CapturaView = dynamic(() => import('@/components/views/CapturaView').then(m => ({ default: m.CapturaView })), { ssr: false, loading });
const BoletinesView = dynamic(() => import('@/components/views/BoletinesView').then(m => ({ default: m.BoletinesView })), { ssr: false, loading });
const AlertasView = dynamic(() => import('@/components/views/AlertasView').then(m => ({ default: m.AlertasView })), { ssr: false, loading });
const EstrategiaView = dynamic(() => import('@/components/views/EstrategiaView').then(m => ({ default: m.EstrategiaView })), { ssr: false, loading });
const IndicadoresView = dynamic(() => import('@/components/views/IndicadoresView').then(m => ({ default: m.IndicadoresView })), { ssr: false, loading });
const ProductosView = dynamic(() => import('@/components/views/ProductosView').then(m => ({ default: m.ProductosView })), { ssr: false, loading });
const ConfiguracionView = dynamic(() => import('@/components/views/ConfiguracionView').then(m => ({ default: m.ConfiguracionView })), { ssr: false, loading });
const JobsView = dynamic(() => import('@/components/views/JobsView').then(m => ({ default: m.JobsView })), { ssr: false, loading });
const SuscriptoresView = dynamic(() => import('@/components/views/SuscriptoresView').then(m => ({ default: m.SuscriptoresView })), { ssr: false, loading });
const PreviewView = dynamic(() => import('@/components/views/PreviewView').then(m => ({ default: m.PreviewView })), { ssr: false, loading });

// Nuevas sub-vistas bajo Menciones
const PersonasSeguimientoView = dynamic(() => import('@/components/views/PersonasSeguimientoView').then(m => ({ default: m.PersonasSeguimientoView })), { ssr: false, loading });
const TemasSeguimientoView = dynamic(() => import('@/components/views/TemasSeguimientoView').then(m => ({ default: m.TemasSeguimientoView })), { ssr: false, loading });

/* View skeleton - shown during lazy loading of views */
function ViewSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      <span className="text-sm text-muted-foreground animate-pulse">Cargando...</span>
    </div>
  );
}

/* Main page - slim orchestrator */
export default function Dashboard() {
  const { loading, activeView, initialize } = useDashboardStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) return <LoadingScreen />;

  const views: Record<string, ReactNode> = {
    // Analisis
    resumen: <ResumenView />,
    menciones: <MencionesView />,
    'personas-seguimiento': <PersonasSeguimientoView />,
    'temas-seguimiento': <TemasSeguimientoView />,
    alertas: <AlertasView />,
    indicadores: <IndicadoresView />,

    // ONION200 (Productos)
    boletines: <BoletinesView />,
    reportes: <ReportesView />,
    productos: <ProductosView />,
    estrategia: <EstrategiaView />,

    // Gestion Comercial
    clientes: <ClientesView />,
    contratos: <ContratosView />,
    suscriptores: <SuscriptoresView />,

    // Configuracion
    medios: <MediosView />,
    clasificadores: <ClasificadoresView />,
    generadores: <GeneradoresView />,
    captura: <CapturaView />,
    jobs: <JobsView />,
    configuracion: <ConfiguracionView />,

    // Extras (acceso desde footer)
    preview: <PreviewView />,
    personas: <PersonasView />,
  };

  return (
    <DashboardShell>
      {views[activeView] || <ResumenView />}
    </DashboardShell>
  );
}
