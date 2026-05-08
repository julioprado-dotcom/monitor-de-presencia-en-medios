'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play, Square, ChevronRight, RotateCcw, CheckCircle2,
  XCircle, Loader2, AlertTriangle, Zap, Eye, SkipForward,
  Globe, Clock, BarChart3,
} from 'lucide-react'
import { fetchWithTimeout } from '@/lib/fetch-utils'

// ── Types ──────────────────────────────────────────────────────────

interface FaseConfig {
  id: number
  nombre: string
  descripcion: string
  maxFuentes: number
  criterioExito: string
}

interface ScrapeResultado {
  fuenteId: string
  nombre: string
  estado: 'pendiente' | 'scrapeando' | 'completado' | 'error'
  menciones: number
  error?: string
  duracionMs?: number
}

interface FaseFuente {
  id: string
  nombre: string
  nivel: string
  tipoCheck: string
  ultimoCheck: string | null
  totalCambios: number
}

interface ScrapingPhaseState {
  faseActual: number
  faseConfig: FaseConfig | null
  fasesDisponibles: FaseConfig[]
  fuentesActivas: number
  fuentesTotales: number
  scrapeEnProgreso: boolean
  scrapeProgreso: { actual: number; total: number } | null
  scrapeResultados: ScrapeResultado[]
  ultimoScrapeInicio: string | null
  fuentesIncluidas: FaseFuente[]
}

// ── Component ──────────────────────────────────────────────────────

export function ScrapingPhaseControl() {
  const [state, setState] = useState<ScrapingPhaseState | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showFuentes, setShowFuentes] = useState(false)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/scraping/phase')
      if (!res.ok) throw new Error('Error fetching phase state')
      const data = await res.json()
      setState(data)
      setError(null)
    } catch {
      // Silencioso — no romper el dashboard
    }
  }, [])

  useEffect(() => {
    fetchState()
    const interval = setInterval(fetchState, 5000) // Polling cada 5s
    return () => clearInterval(interval)
  }, [fetchState])

  const accion = useCallback(async (accion: string, body: Record<string, unknown> = {}) => {
    setLoading(accion)
    setError(null)
    try {
      const res = await fetchWithTimeout('/api/scraping/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, ...body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error desconocido')
      } else {
        await fetchState()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }, [fetchState])

  if (!state) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Cargando control de scraping...</span>
        </CardContent>
      </Card>
    )
  }

  const completados = state.scrapeResultados.filter(r => r.estado === 'completado').length
  const errores = state.scrapeResultados.filter(r => r.estado === 'error').length
  const totalMenciones = state.scrapeResultados.reduce((sum, r) => sum + r.menciones, 0)
  const progresoPct = state.scrapeProgreso
    ? Math.round((state.scrapeProgreso.actual / state.scrapeProgreso.total) * 100)
    : 0

  return (
    <Card className={`border-2 transition-colors ${
      state.faseActual === 0
        ? 'border-slate-200 dark:border-slate-700'
        : state.scrapeEnProgreso
          ? 'border-blue-400 dark:border-blue-500'
          : 'border-emerald-400 dark:border-emerald-500'
    }`}>
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-semibold">Control de Scraping por Fases</CardTitle>
            {state.faseActual > 0 && (
              <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                Fase {state.faseActual}
              </Badge>
            )}
            {state.scrapeEnProgreso && (
              <Badge variant="outline" className="text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Ejecutando
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2 text-xs"
            >
              {expanded ? 'Compactar' : 'Expandir'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFuentes(!showFuentes)}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Fuentes
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* ── Error ──────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Vista compacta (por defecto) ──── */}
        {!expanded && (
          <div className="space-y-2">
            {/* Indicador de fase actual */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {state.faseActual === 0
                  ? 'Sin fase activa'
                  : `${state.faseConfig?.nombre} — ${state.faseConfig?.descripcion}`}
              </span>
              <span className="text-xs text-slate-400">
                {state.fuentesActivas}/{state.fuentesTotales} fuentes activas
              </span>
            </div>

            {/* Barra de progreso si hay scrape en curso */}
            {state.scrapeEnProgreso && state.scrapeProgreso && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">
                    {state.scrapeProgreso.actual}/{state.scrapeProgreso.total} fuentes
                  </span>
                  <span className="font-medium">{progresoPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mini-resumen de resultados */}
            {state.scrapeResultados.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> {completados}
                </span>
                {errores > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" /> {errores}
                  </span>
                )}
                {totalMenciones > 0 && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <BarChart3 className="h-3 w-3" /> {totalMenciones} menciones
                  </span>
                )}
              </div>
            )}

            {/* Botones de acción principales */}
            <div className="flex items-center gap-2 pt-1">
              {state.faseActual === 0 ? (
                <Button
                  size="sm"
                  onClick={() => accion('iniciar_fase', { faseId: 1 })}
                  disabled={loading === 'iniciar_fase'}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading === 'iniciar_fase' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Iniciar Fase 1
                </Button>
              ) : (
                <>
                  {!state.scrapeEnProgreso ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => accion('ejecutar')}
                        disabled={loading === 'ejecutar'}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {loading === 'ejecutar' ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 mr-1" />
                        )}
                        Ejecutar Scrape
                      </Button>
                      {state.faseActual < 3 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => accion('avanzar_fase')}
                          disabled={loading === 'avanzar_fase'}
                          className="h-8 text-xs"
                        >
                          <SkipForward className="h-3 w-3 mr-1" />
                          Avanzar
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => accion('detener')}
                      disabled={loading === 'detener'}
                      className="h-8 text-xs"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Detener
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => accion('reiniciar')}
                    disabled={loading === 'reiniciar'}
                    className="h-8 text-xs text-slate-500"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Vista expandida ────────────────── */}
        {expanded && (
          <div className="space-y-3">
            {/* Timeline de fases */}
            <div className="space-y-1.5">
              {state.fasesDisponibles.map((fase) => {
                const isActive = state.faseActual === fase.id
                const isPast = state.faseActual > fase.id
                return (
                  <div
                    key={fase.id}
                    className={`flex items-start gap-2.5 p-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : isPast
                          ? 'bg-emerald-50 dark:bg-emerald-900/10'
                          : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isActive ? (
                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          Fase {fase.id}: {fase.nombre}
                        </span>
                        {isActive && state.faseActual > 0 && !state.scrapeEnProgreso && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => accion('ejecutar')}
                            disabled={loading === 'ejecutar'}
                            className="h-6 px-2 text-[10px]"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Ejecutar
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {fase.descripcion}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 italic">
                        Criterio: {fase.criterioExito}
                      </p>
                    </div>
                    {isActive && !state.scrapeEnProgreso && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => accion('iniciar_fase', { faseId: fase.id })}
                        disabled={loading === 'iniciar_fase'}
                        className="h-6 px-2 text-[10px] text-blue-600 shrink-0"
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Barra de progreso */}
            {state.scrapeEnProgreso && state.scrapeProgreso && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    Scrape en progreso: {state.scrapeProgreso.actual}/{state.scrapeProgreso.total}
                  </span>
                  <span className="text-blue-600">{progresoPct}%</span>
                </div>
                <div className="h-2 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-700 rounded-full"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => accion('detener')}
                  className="h-6 text-[10px] mt-1"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Detener scrape
                </Button>
              </div>
            )}

            {/* Resultados detallados */}
            {state.scrapeResultados.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Resultados
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-emerald-600">{completados} OK</span>
                    {errores > 0 && <span className="text-red-600">{errores} err</span>}
                    {totalMenciones > 0 && <span className="text-blue-600">{totalMenciones} menc.</span>}
                  </div>
                </div>
                {state.scrapeResultados.map((r) => (
                  <div
                    key={r.fuenteId}
                    className="flex items-center justify-between py-1 px-2 rounded text-xs bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      {r.estado === 'pendiente' && (
                        <div className="h-2.5 w-2.5 rounded-full border border-slate-300" />
                      )}
                      {r.estado === 'scrapeando' && (
                        <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                      )}
                      {r.estado === 'completado' && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      )}
                      {r.estado === 'error' && (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className={r.estado === 'scrapeando' ? 'font-medium' : ''}>
                        {r.nombre}
                      </span>
                      {r.duracionMs && (
                        <span className="text-[10px] text-slate-400">
                          {(r.duracionMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.menciones > 0 && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                          {r.menciones} menc.
                        </Badge>
                      )}
                      {r.error && (
                        <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={r.error}>
                          {r.error}
                        </span>
                      )}
                      {!state.scrapeEnProgreso && r.estado !== 'scrapeando' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => accion('ejecutar_uno', { fuenteId: r.fuenteId })}
                          className="h-5 w-5 p-0"
                          title="Re-ejecutar"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              {state.faseActual === 0 ? (
                <Button
                  size="sm"
                  onClick={() => accion('iniciar_fase', { faseId: 1 })}
                  disabled={loading === 'iniciar_fase'}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading === 'iniciar_fase' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Iniciar Fase 1: Prueba Mínima
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => accion('reiniciar')}
                  disabled={loading === 'reiniciar'}
                  className="h-8 text-xs text-red-500"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reiniciar todo
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ── Panel de fuentes ───────────────── */}
        {showFuentes && (
          <div className="border-t border-slate-100 dark:border-slate-700 pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                Fuentes ({state.fuentesIncluidas.length})
              </span>
              <span className="text-[10px] text-slate-400">
                {state.fuentesActivas} activas / {state.fuentesTotales} total
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {state.fuentesIncluidas.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">
                  Activa una fase para ver las fuentes incluidas
                </p>
              ) : (
                state.fuentesIncluidas.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between py-0.5 px-2 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded"
                  >
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[9px] bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      >
                        N{f.nivel}
                      </Badge>
                      <span className="text-slate-700 dark:text-slate-300">{f.nombre}</span>
                      <span className="text-slate-400">({f.tipoCheck})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.totalCambios > 0 && (
                        <span className="text-emerald-500">{f.totalCambios} cambios</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => accion('ejecutar_uno', { fuenteId: f.id })}
                        disabled={state.scrapeEnProgreso || loading === 'ejecutar_uno'}
                        className="h-5 px-1.5 text-[10px] text-blue-600"
                      >
                        <Play className="h-2.5 w-2.5 mr-0.5" />
                        Check
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
