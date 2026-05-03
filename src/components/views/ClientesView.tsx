'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserCircle, Users, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/KPICard';
import type { PersonaListItem } from '@/types/dashboard';

export function ClientesView() {
  const [clientes, setClientes] = useState<Record<string, unknown>[]>([]);
  const [clientesTotal, setClientesTotal] = useState(0);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [personaList, setPersonaList] = useState<PersonaListItem[]>([]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClientesLoading(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '50' });
        if (clienteSearch) params.set('search', clienteSearch);
        const res = await fetch(`/api/clientes?${params}`);
        const json = await res.json();
        if (!cancelled) {
          setClientes(json.clientes || []);
          setClientesTotal(json.total || 0);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setClientesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clienteSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/personas?page=1&limit=30');
        const json = await res.json();
        if (!cancelled) setPersonaList(json.personas || []);
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshClientes = useCallback(async () => {
    setClientesLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (clienteSearch) params.set('search', clienteSearch);
      const res = await fetch(`/api/clientes?${params}`);
      const json = await res.json();
      setClientes(json.clientes || []);
      setClientesTotal(json.total || 0);
    } catch {
      // silent
    } finally {
      setClientesLoading(false);
    }
  }, [clienteSearch]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Gestión de Clientes
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {clientesTotal} clientes registrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="sm:max-w-xs text-xs"
              />
              <Button variant="outline" size="sm" onClick={refreshClientes} className="text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {clientesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : clientes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Plan</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Segmento</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="text-xs">Parlam.</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Contratos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c: Record<string, unknown>, i: number) => (
                    <TableRow key={String(c.id || i)}>
                      <TableCell className="py-2.5">
                        <div>
                          <p className="text-sm font-medium text-foreground max-w-[160px] truncate">{String(c.nombre || '—')}</p>
                          <p className="text-[10px] text-muted-foreground">{String(c.organizacion || '')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell">
                        <p className="text-xs text-foreground">{String(c.nombreContacto || String(c.email || '—'))}</p>
                        <p className="text-[10px] text-muted-foreground">{String(c.email || '')}</p>
                      </TableCell>
                      <TableCell className="py-2.5 hidden md:table-cell">
                        <Badge variant="secondary" className="text-[10px]">{String(c.plan || 'basico')}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{String(c.segmento || 'otro')}</TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          String(c.estado) === 'activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          String(c.estado) === 'suspendido' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {String(c.estado || 'activo')}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{Number(c.parlamentariosCount || 0)}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                        {Number(c.contratosActivos || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={<UserCircle className="h-10 w-10" />} text="No hay clientes registrados" subtext="Agrega clientes desde la API o el seed" />
          )}
        </CardContent>
      </Card>

      {/* Lista de Parlamentarios disponibles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Parlamentarios disponibles para asignar
          </CardTitle>
          <CardDescription className="text-xs">
            Lista de legisladores que se pueden asignar a clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
            {personaList.length > 0 ? personaList.slice(0, 30).map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">{p.camara} · {p.partidoSigla} · {p.departamento}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-4">
                <p className="text-xs text-muted-foreground">Carga datos de ejemplo primero (Resumen → Cargar datos)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
