'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileCheck, RefreshCw, Radio } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/KPICard';
import { NIVEL_COLORS } from '@/constants/ui';
import type { MedioItem } from '@/types/dashboard';

export function ContratosView() {
  const [contratos, setContratos] = useState<Record<string, unknown>[]>([]);
  const [contratosTotal, setContratosTotal] = useState(0);
  const [contratosLoading, setContratosLoading] = useState(false);
  const [medios, setMedios] = useState<MedioItem[]>([]);
  const [mediosLoading, setMediosLoading] = useState(false);
  const [toggleMedioId, setToggleMedioId] = useState<string | null>(null);

  // Load contratos on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setContratosLoading(true);
      try {
        const res = await fetch('/api/contratos?page=1&limit=50');
        const json = await res.json();
        if (!cancelled) {
          setContratos(json.contratos || []);
          setContratosTotal(json.total || 0);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setContratosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load medios on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMediosLoading(true);
      try {
        const res = await fetch('/api/medios');
        const json = await res.json();
        if (!cancelled) setMedios(json.medios || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setMediosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshContratos = useCallback(async () => {
    setContratosLoading(true);
    try {
      const res = await fetch('/api/contratos?page=1&limit=50');
      const json = await res.json();
      setContratos(json.contratos || []);
      setContratosTotal(json.total || 0);
    } catch {
      // silent
    } finally {
      setContratosLoading(false);
    }
  }, []);

  const loadMedios = useCallback(async () => {
    setMediosLoading(true);
    try {
      const res = await fetch('/api/medios');
      const json = await res.json();
      setMedios(json.medios || []);
    } catch {
      // silent
    } finally {
      setMediosLoading(false);
    }
  }, []);

  const toggleMedioActivo = async (medioId: string, activo: boolean) => {
    setToggleMedioId(medioId);
    try {
      const res = await fetch(`/api/medios/${medioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      const json = await res.json();
      if (json.medio) {
        setMedios((prev) => prev.map((m) => m.id === medioId ? { ...m, activo: !activo } : m));
      }
    } catch {
      // silent
    } finally {
      setToggleMedioId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                Gestión de Contratos
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {contratosTotal} contratos registrados
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshContratos} className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {contratosLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : contratos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Producto</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Frecuencia</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Entrega</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Monto</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Medios</TableHead>
                    <TableHead className="text-xs">Parlam.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((c: Record<string, unknown>, i: number) => {
                    const cl = c.cliente as Record<string, unknown> | null;
                    return (
                      <TableRow key={String(c.id || i)}>
                        <TableCell className="py-2.5">
                          <Badge variant="secondary" className="text-[10px]">{String(c.tipoProducto || '—').replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="py-2.5 hidden sm:table-cell">
                          <p className="text-xs font-medium text-foreground">{cl ? String(cl.nombre || '—') : '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{cl ? String(cl.email || '') : ''}</p>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground hidden md:table-cell">{String(c.frecuencia || 'diario')}</TableCell>
                        <TableCell className="py-2.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            String(c.estado) === 'activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            String(c.estado) === 'pausado' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {String(c.estado || 'activo')}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{String(c.formatoEntrega || 'whatsapp')}</TableCell>
                        <TableCell className="py-2.5 text-xs text-foreground hidden lg:table-cell font-medium">
                          {Number(c.montoMensual || 0) > 0 ? `${Number(c.montoMensual).toFixed(0)} ${String(c.moneda || 'Bs')}` : '—'}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{Number(c.mediosCount || 0)}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="secondary" className="text-[10px]">{Number(c.parlamentariosCount || 0)}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={<FileCheck className="h-10 w-10" />} text="No hay contratos registrados" subtext="Crea contratos desde la API de /api/contratos" />
          )}
        </CardContent>
      </Card>

      {/* Panel de Medios con Toggle ON/OFF */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" />
                Medios — Panel de Control
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Enciende o apaga medios para monitoreo por contrato
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadMedios} className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Recargar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {mediosLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : medios.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {medios.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg border transition-all ${m.activo ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{m.nombre}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{m.tipo}</p>
                      {m.departamento && <p className="text-[10px] text-muted-foreground">{m.departamento}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] ${NIVEL_COLORS[m.nivel]}`}>N{m.nivel}</Badge>
                      <button
                        onClick={() => toggleMedioActivo(m.id, m.activo)}
                        disabled={toggleMedioId === m.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                          m.activo ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                        } ${toggleMedioId === m.id ? 'opacity-50' : ''}`}
                        title={m.activo ? 'Desactivar medio' : 'Activar medio'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          m.activo ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">{m.mencionesCount} menciones</span>
                    <span className={`text-[10px] font-medium ${m.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
                      {m.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Radio className="h-10 w-10" />} text="No hay medios registrados" subtext="Carga datos de ejemplo primero (Resumen → Cargar datos)" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
