'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  Radio, Clock, Zap, TrendingDown, TrendingUp, RefreshCw,
  Filter, Loader2, Globe, Eye, ChevronDown, ChevronUp,
  Heart, Shield, ShieldOff, Skull, Bug, Timer, ExternalLink,
  ArrowUpDown, BarChart3, CircleDot,
} from 'lucide-react';
import { KPICard, EmptyState, FilterSelect } from '@/components/shared/KPICard';
import { fetchWithTimeout } from '@/lib/fetch-utils';

// ─── Types ────────────────────────────────────────────────────

interface HealthResumen {
  total: number;
  sanos: number;
  degradados: number;
  muertos: number;
  conErrores: number;
  porcentajeSalud: number;
  fechaAnalisis: string;
}

interface HealthNivel {
  nivel: number;
  label: string;
  total: number;
  sanos: number;
  problematicos: number;
}

interface HealthMedio {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  nivel: string;
  nivelLabel: string;
  totalMenciones: number;
  menciones7dias: number;
  menciones30dias: number;
  errorRate: number;
  salud: 'sano' | 'degradado' | 'muerto' | 'con_errores';
  alerta: string;
  ultimaCaptura: string | null;
}

interface FuenteEstado {
  id: string;
  medioId: string;
  medio: { id: string; nombre: string; url: string };
  tipoCheck: string;
  frecuenciaBase: string;
  frecuenciaActual: string;
  horariosOptimos: number[];
  ultimoCheck: string | null;
  ultimoCambio: string | null;
  totalChecks: number;
  totalCambios: number;
  checksSinCambio: number;
  responseTime: number;
  activo: boolean;
  error: string;
}

interface HealthData {
  resumen: HealthResumen;
  porNivel: HealthNivel[];
  medios: HealthMedio[];
}

type SaludFilter = 'todos' | 'sano' | 'degradado' | 'muerto' | 'con_errores';
type SortKey = 'nombre' | 'salud' | 'menciones7dias' | 'errorRate' | 'totalChecks' | 'responseTime';
type SortDir = 'asc' | 'desc';

// ─── Health Gauge SVG ────────────────────────────────────────

function HealthGauge({ porcentaje }: { porcentaje: number }) {
  const radius = 40;
  const stroke = 8;
  const circumference = Math.PI * radius; // semicircle
  const filled = (porcentaje / 100) * circumference;
  const color = porcentaje >= 75 ? '#22C55E' : porcentaje >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width="100" height="58" viewBox="0 0 100 58">
        {/* Background arc */}
        <path
          d={`M ${10} 50 A ${radius} ${radius} 0 0 1 90 50`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${10} 50 A ${radius} ${radius} 0 0 1 90 50`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - filled}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute top-5 text-center">
        <span className="text-lg font-bold" style={{ color }}>{porcentaje}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5">Salud Global</span>
    </div>
  );
}

// ─── Mini bar chart by level ─────────────────────────────────

function NivelBars({ niveles }: { niveles: HealthNivel[] }) {
  return (
    <div className="flex items-end gap-2 h-20">
      {niveles.map(n => {
        const pct = n.total > 0 ? Math.round((n.sanos / n.total) * 100) : 0;
        const barH = Math.max(4, (n.total / Math.max(...niveles.map(x => x.total))) * 60);
        return (
          <div key={n.nivel} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-medium text-muted-foreground">{pct}%</span>
            <div className="w-full relative rounded-t overflow-hidden" style={{ height: barH }}>
              {/* Sanos (green) */}
              <div
                className="absolute bottom-0 left-0 bg-emerald-500 rounded-t transition-all duration-700"
                style={{ height: `${pct}%`, width: '100%' }}
              />
              {/* Problematicos (red/amber overlay) */}
              <div
                className="absolute bottom-0 left-0 rounded-t transition-all duration-700"
                style={{
                  height: `${100 - pct}%`,
                  width: '100%',
                  marginTop: `${pct}%`,
                  backgroundColor: pct >= 50 ? '#F59E0B' : '#EF4444',
                  opacity: 0.7,
                }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">N{n.nivel}</span>
            <span className="text-[8px] text-muted-foreground/60">{n.total}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Salud Badge ─────────────────────────────────────────────

function SaludBadge({ salud }: { salud: HealthMedio['salud'] }) {
  const config = {
    sano: { icon: <CheckCircle2 className="h-3 w-3" />, label: 'Sano', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    degradado: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Degradado', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    muerto: { icon: <Skull className="h-3 w-3" />, label: 'Muerto', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800' },
    con_errores: { icon: <Bug className="h-3 w-3" />, label: 'Errores', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  }[salud];
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 px-2 ${config.cls}`}>
      {config.icon} {config.label}
    </Badge>
  );
}

// ─── Menciones sparkline (mini dots) ────────────────────────

function MencionesIndicator({ m7, m30 }: { m7: number; m30: number }) {
  const ratio = m30 > 0 ? m7 / m30 : 0;
  const color = m7 > 0 ? 'text-emerald-500' : m30 > 0 ? 'text-amber-500' : 'text-red-400';
  const dots = 7;
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i < m7 ? 'bg-emerald-500' : i < m30 ? 'bg-amber-400/50' : 'bg-muted-foreground/20'}`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-medium ${color}`}>{m7}</span>
    </div>
  );
}

// ─── Error Rate bar ──────────────────────────────────────────

function ErrorRateBar({ rate }: { rate: number }) {
  const color = rate === 0 ? 'bg-emerald-500' : rate <= 25 ? 'bg-amber-500' : rate <= 50 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground">{rate}%</span>
    </div>
  );
}

// ─── Fila de Medio (card individual) ────────────────────────

function MedioCard({
  medio,
  fuente,
  onCheck,
}: {
  medio: HealthMedio;
  fuente: FuenteEstado | undefined;
  onCheck: (medioId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const borderColor =
    medio.salud === 'muerto' ? 'border-l-red-500' :
    medio.salud === 'con_errores' ? 'border-l-orange-500' :
    medio.salud === 'degradado' ? 'border-l-amber-500' :
    'border-l-emerald-500';

  const bgColor =
    medio.salud === 'muerto' ? 'bg-red-500/5' :
    medio.salud === 'con_errores' ? 'bg-orange-500/5' :
    medio.salud === 'degradado' ? 'bg-amber-500/5' :
    'bg-emerald-500/5';

  const hace = (iso: string | null) => {
    if (!iso) return 'nunca';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hs = Math.floor(mins / 60);
    if (hs < 24) return `${hs}h`;
    return `${Math.floor(hs / 24)}d`;
  };

  return (
    <div className={`border border-border/50 rounded-lg border-l-4 ${borderColor} ${bgColor} overflow-hidden transition-all`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Nombre + nivel */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground truncate">{medio.nombre}</span>
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-muted/50">
              N{medio.nivel}
            </Badge>
            {fuente && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800">
                {fuente.tipoCheck}
              </Badge>
            )}
          </div>
          {medio.alerta && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{medio.alerta}</p>
          )}
        </div>

        {/* Menciones */}
        <div className="flex flex-col items-end gap-0.5">
          <MencionesIndicator m7={medio.menciones7dias} m30={medio.menciones30dias} />
          <span className="text-[8px] text-muted-foreground">7d / {medio.menciones30dias} 30d</span>
        </div>

        {/* Error rate */}
        <ErrorRateBar rate={medio.errorRate} />

        {/* Status */}
        <SaludBadge salud={medio.salud} />

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => { e.stopPropagation(); onCheck(medio.id); }}
            title="Forzar check"
          >
            <Zap className="h-3 w-3 text-sky-500" />
          </Button>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {/* FuenteEstado details */}
            {fuente && (
              <>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Ultimo Check</p>
                  <p className="text-[11px] font-medium">{hace(fuente.ultimoCheck)}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Ultimo Cambio</p>
                  <p className="text-[11px] font-medium">{hace(fuente.ultimoCambio)}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Checks / Cambios</p>
                  <p className="text-[11px] font-medium">{fuente.totalChecks} / {fuente.totalCambios}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Response Time</p>
                  <p className="text-[11px] font-medium">{fuente.responseTime > 0 ? `${fuente.responseTime}ms` : '—'}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Frecuencia</p>
                  <p className="text-[11px] font-medium">{fuente.frecuenciaBase} → {fuente.frecuenciaActual}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Checks sin cambio</p>
                  <p className="text-[11px] font-medium">{fuente.checksSinCambio}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Horarios Optimos</p>
                  <p className="text-[11px] font-medium">{fuente.horariosOptimos.length > 0 ? fuente.horariosOptimos.join(', ') + 'h' : '—'}</p>
                </div>
                <div className="p-2 rounded bg-background/80">
                  <p className="text-[9px] text-muted-foreground uppercase">Estado</p>
                  <p className="text-[11px] font-medium">
                    {fuente.activo ? (
                      <span className="text-emerald-600">Activo</span>
                    ) : (
                      <span className="text-red-500">Inactivo</span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Error */}
          {fuente?.error && (
            <div className="flex items-start gap-1.5 mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
              <span className="text-[10px] text-red-600 dark:text-red-400 break-all">{fuente.error}</span>
            </div>
          )}
          {/* URL */}
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{medio.url}</span>
            <a href={medio.url} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:text-foreground">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main View
// ═══════════════════════════════════════════════════════════

export function AuditoriaFuentesView() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [fuentes, setFuentes] = useState<FuenteEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroSalud, setFiltroSalud] = useState<SaludFilter>('todos');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [sortKey, setSortKey] = useState<SortKey>('salud');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [hRes, fRes] = await Promise.all([
        fetchWithTimeout('/api/medios/health', { timeoutMs: 15_000 }),
        fetchWithTimeout('/api/jobs/fuentes', { timeoutMs: 10_000 }),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (fRes.ok) setFuentes(await fRes.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const forceCheck = useCallback(async (medioId: string) => {
    const fuente = fuentes.find(f => f.medioId === medioId);
    if (!fuente) return;
    setActionLoading(medioId);
    try {
      await fetchWithTimeout('/api/scraping/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'forzar_check', fuenteId: fuente.id }),
        timeoutMs: 10_000,
      });
      setTimeout(fetchData, 2000);
    } catch { /* silent */ }
    setActionLoading(null);
  }, [fuentes, fetchData]);

  // Build fuentes map by medioId
  const fuentesMap = new Map(fuentes.map(f => [f.medioId, f]));

  // Filter + sort medios
  const mediosFiltered = (health?.medios || [])
    .filter(m => {
      if (filtroSalud !== 'todos' && m.salud !== filtroSalud) return false;
      if (filtroNivel !== 'todos' && m.nivel !== filtroNivel) return false;
      if (search && !m.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const saludOrder = { muerto: 0, con_errores: 1, degradado: 2, sano: 3 };
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'salud': return (saludOrder[a.salud] - saludOrder[b.salud]) * dir;
        case 'nombre': return a.nombre.localeCompare(b.nombre) * dir;
        case 'menciones7dias': return (a.menciones7dias - b.menciones7dias) * dir;
        case 'errorRate': return (a.errorRate - b.errorRate) * dir;
        case 'totalChecks': return ((fuentesMap.get(a.id)?.totalChecks || 0) - (fuentesMap.get(b.id)?.totalChecks || 0)) * dir;
        case 'responseTime': return ((fuentesMap.get(a.id)?.responseTime || 0) - (fuentesMap.get(b.id)?.responseTime || 0)) * dir;
        default: return 0;
      }
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const r = health?.resumen;
  const niveles = health?.porNivel || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auditoria de Fuentes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitoreo de salud, rendimiento y estado operativo de todas las fuentes
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </Button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          icon={<Radio className="h-5 w-5" />}
          value={r?.total ?? 0}
          label="Total Fuentes"
          colorClass="text-sky-500"
        />
        <KPICard
          icon={<Heart className="h-5 w-5" />}
          value={r?.sanos ?? 0}
          label="Sanas"
          subtext={r ? `${r.porcentajeSalud}% del total` : undefined}
          colorClass="text-emerald-500"
        />
        <KPICard
          icon={<TrendingDown className="h-5 w-5" />}
          value={r?.degradados ?? 0}
          label="Degradadas"
          subtext="Sin menciones en 7d"
          colorClass="text-amber-500"
        />
        <KPICard
          icon={<Skull className="h-5 w-5" />}
          value={r?.muertos ?? 0}
          label="Muertas"
          subtext="Sin menciones en 30d+"
          colorClass="text-red-500"
        />
        <KPICard
          icon={<Bug className="h-5 w-5" />}
          value={r?.conErrores ?? 0}
          label="Con Errores"
          subtext=">50% fallo captura"
          colorClass="text-orange-500"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5" />}
          value={r ? Math.round(fuentes.reduce((s, f) => s + f.totalCambios, 0)) : 0}
          label="Cambios Totales"
          subtext="Todos los tiempos"
          colorClass="text-violet-500"
        />
      </div>

      {/* ── Health Gauge + Nivel Bars ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <HealthGauge porcentaje={r?.porcentajeSalud ?? 0} />
              </div>
              <div className="space-y-2 flex-1 ml-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">Sanas</span>
                  <span className="text-[10px] font-semibold text-emerald-600 ml-auto">{r?.sanos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground">Degradadas</span>
                  <span className="text-[10px] font-semibold text-amber-600 ml-auto">{r?.degradados}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] text-muted-foreground">Con errores</span>
                  <span className="text-[10px] font-semibold text-orange-600 ml-auto">{r?.conErrores}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-[10px] text-muted-foreground">Muertas</span>
                  <span className="text-[10px] font-semibold text-red-600 ml-auto">{r?.muertos}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              <BarChart3 className="h-3 w-3 inline mr-1" />
              Salud por Nivel
            </p>
            {niveles.length > 0 ? (
              <NivelBars niveles={niveles} />
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos por nivel</p>
            )}
            <div className="mt-3 space-y-1">
              {niveles.map(n => (
                <div key={n.nivel} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{n.label}</span>
                  <span className="font-medium">
                    <span className="text-emerald-600">{n.sanos}</span>
                    <span className="text-muted-foreground/50">/{n.total}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters + Search ── */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter icon={<Filter className="h-3.5 w-3.5" />} />
            <FilterSelect
              value={filtroSalud}
              onChange={setFiltroSalud}
              options={['todos', 'sano', 'degradado', 'muerto', 'con_errores']}
            />
            <FilterSelect
              value={filtroNivel}
              onChange={setFiltroNivel}
              options={['todos', '1', '2', '3', '4', '5'].map(n => n === 'todos' ? 'todos' : `Nivel ${n}`)}
            />
            <div className="flex-1 min-w-[150px]">
              <input
                type="text"
                placeholder="Buscar fuente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {mediosFiltered.length} de {health?.medios.length ?? 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Sort bar ── */}
      <div className="flex items-center gap-1 flex-wrap">
        {([
          ['salud', 'Salud'],
          ['nombre', 'Nombre'],
          ['menciones7dias', 'Menciones 7d'],
          ['errorRate', 'Error Rate'],
          ['totalChecks', 'Total Checks'],
          ['responseTime', 'Respuesta'],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              sortKey === key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <ArrowUpDown className="h-2.5 w-2.5" />
            {label}
            {sortKey === key && <span className="text-[8px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </div>

      {/* ── Medios list ── */}
      {mediosFiltered.length > 0 ? (
        <div className="space-y-2">
          {mediosFiltered.map(m => (
            <MedioCard
              key={m.id}
              medio={m}
              fuente={fuentesMap.get(m.id)}
              onCheck={forceCheck}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShieldOff className="h-8 w-8" />}
          text="No se encontraron fuentes"
          subtext={filtroSalud !== 'todos' || filtroNivel !== 'todos' || search ? 'Prueba cambiar los filtros' : 'No hay fuentes registradas'}
        />
      )}
    </div>
  );
}
