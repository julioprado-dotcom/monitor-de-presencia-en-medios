'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag } from 'lucide-react';
import { EmptyState } from '@/components/shared/KPICard';
import type { EjeItem } from '@/types/dashboard';

export function ClasificadoresView() {
  const [ejes, setEjes] = useState<EjeItem[]>([]);
  const [ejesLoading, setEjesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEjesLoading(true);
      try {
        const res = await fetch('/api/ejes');
        const json = await res.json();
        if (!cancelled) setEjes(json.ejes || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setEjesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Ejes temáticos
          </CardTitle>
          <CardDescription className="text-xs">
            {ejes.length} clasificadores activos para análisis de menciones
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {ejesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : ejes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ejes.map((eje) => (
                <div key={eje.id} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {eje.color && (
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: eje.color }} />
                        )}
                        <p className="text-sm font-semibold text-foreground truncate">{eje.nombre}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{eje.descripcion || eje.slug}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 bg-primary/10 text-primary">
                      {eje.mencionesCount}
                    </Badge>
                  </div>
                  {eje.keywords && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {eje.keywords.split(',').slice(0, 4).map((kw, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {kw.trim()}
                        </span>
                      ))}
                      {eje.keywords.split(',').length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          +{eje.keywords.split(',').length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Tag className="h-10 w-10" />} text="No hay clasificadores registrados" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
