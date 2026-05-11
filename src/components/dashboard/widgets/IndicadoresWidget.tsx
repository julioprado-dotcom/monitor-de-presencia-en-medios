'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Loader2, BarChart3, Inbox } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { usePolling } from '../hooks/usePolling';
import { CollapsibleWidget } from '../CollapsibleWidget';
import type { WidgetStatus } from '../CollapsibleWidget';

// ─── Types ────────────────────────────────────────────────────

interface IndicadorRow {
  id: string;
  nombre: string;
  slug: string;
  categoria: string;
  unidad: string;
  activo: boolean;
  ultimoValor: number | null;
  valorTexto: string | null;
  fechaCaptura: string | null;
  tendencia: 'up' | 'down' | 'stable' | null;
  delta: number | null;
  confiable: boolean;
}

interface IndicadoresSummaryData {
  timestamp: string;
  totalActivos: number;
  totalInactivos: number;
  ultimaEvaluacion: string | null;
  indicadores: IndicadorRow[];
}

interface IndicadoresWidgetProps {
  onNavigate: (viewId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function deriveStatus(data: IndicadoresSummaryData | null, loading: boolean): WidgetStatus {
  if (loading || !data) return 'loading';
  if (data.totalActivos === 0) return 'idle';
  if (!data.ultimaEvaluacion) return 'idle';
  const lastEvalMs = Date.now() - new Date(data.ultimaEvaluacion).getTime();
  if (lastEvalMs > 72 * 60 * 60 * 1000) return 'error';
  if (lastEvalMs > 24 * 60 * 60 * 1000) return 'warn';
  return 'ok';
}

function CategoriaColor(categoria: string): string {
  const colors: Record<string, string> = {
    monetario: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    minero: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    climatico: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    economico: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
    hidrocarburos: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    social: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  };
  return colors[categoria] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
}

function TendenciaIcon({ tendencia }: { tendencia: string | null }) {
  if (tendencia === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (tendencia === 'down') return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

// ─── Component ────────────────────────────────────────────────

export function IndicadoresWidget({ onNavigate }: IndicadoresWidgetProps) {
  const [data, setData] = useState<IndicadoresSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIndicadores = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/dashboard/indicadores-summary', { timeoutMs: 12_000 });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLoading(false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIndicadores(); }, [fetchIndicadores]);
  usePolling(fetchIndicadores, 60_000);

  const status = deriveStatus(data, loading);
  const totalActivos = data?.totalActivos ?? 0;
  const indicadores = data?.indicadores ?? [];

  // Summary badges: how many with recent data vs stale
  const conDatos = indicadores.filter(i => i.ultimoValor !== null).length;
  const stale = indicadores.filter(i => i.ultimoValor === null).length;

  return (
    <CollapsibleWidget
      id="widget-indicadores"
      title="Indicadores"
      icon={TrendingUp}
      status={status}
      badge={totalActivos > 0 ? `${totalActivos} activos` : 'sin datos'}
      badgeLabel="indicadores"
      targetView="indicadores"
      onNavigate={onNavigate}
      mode="section"
    >
      <Card className="border">
        <CardContent className="p-4 space-y-3">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center py-2 rounded-lg bg-muted/40 border border-border/50">
              <BarChart3 className="h-4 w-4 text-primary mb-1" />
              <span className="text-lg font-bold text-foreground">{totalActivos}</span>
              <span className="text-[9px] text-muted-foreground">Activos</span>
            </div>
            <div className="flex flex-col items-center py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{conDatos}</span>
              <span className="text-[9px] text-muted-foreground">Con datos</span>
            </div>
            <div className="flex flex-col items-center py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <TrendingDown className="h-4 w-4 text-amber-500 mb-1" />
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stale}</span>
              <span className="text-[9px] text-muted-foreground">Sin datos</span>
            </div>
          </div>

          {/* Indicators table */}
          {indicadores.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Ultimos valores capturados
              </p>
              <div className="space-y-1">
                {indicadores.slice(0, 8).map((ind) => (
                  <div
                    key={ind.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {/* Trend */}
                    <TendenciaIcon tendencia={ind.tendencia} />

                    {/* Name + category */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                        {ind.nombre}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[8px] px-1 py-0 h-3.5 ${CategoriaColor(ind.categoria)}`}
                        >
                          {ind.categoria}
                        </Badge>
                        {!ind.confiable && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 text-amber-600">
                            no confiable
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right shrink-0">
                      {ind.ultimoValor !== null ? (
                        <>
                          <p className="text-xs font-bold text-foreground tabular-nums">
                            {ind.valorTexto || ind.ultimoValor.toFixed(2)}
                          </p>
                          {ind.unidad && (
                            <p className="text-[8px] text-muted-foreground">{ind.unidad}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">--</span>
                      )}
                    </div>

                    {/* Delta */}
                    {ind.delta !== null && ind.delta !== 0 && (
                      <span className={`text-[9px] font-medium tabular-nums shrink-0 ${
                        ind.delta > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {ind.delta > 0 ? '+' : ''}{ind.delta.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="py-6 text-center text-muted-foreground">
              <Inbox className="h-5 w-5 mx-auto mb-1.5 opacity-40" />
              <p className="text-xs">Sin indicadores configurados</p>
              <p className="text-[10px] opacity-60 mt-0.5">
                Los indicadores ONION200 se activan desde la vista de Indicadores
              </p>
            </div>
          ) : (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    </CollapsibleWidget>
  );
}
