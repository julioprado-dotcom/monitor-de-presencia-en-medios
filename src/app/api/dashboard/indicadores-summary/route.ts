/**
 * /api/dashboard/indicadores-summary — Indicadores dashboard
 * Returns active indicators with their latest values and trends.
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/rate-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [totalActivos, totalInactivos, ultimaEvaluacion] = await Promise.all([
      db.indicador.count({ where: { activo: true } }),
      db.indicador.count({ where: { activo: false } }),
      db.indicadorEvaluacion.findFirst({ orderBy: { fechaCreacion: 'desc' }, select: { fechaCreacion: true } }),
    ]);

    // Get all active indicators with their latest 2 values (for trend)
    const indicadores = await db.indicador.findMany({
      where: { activo: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        categoria: true,
        unidad: true,
        activo: true,
        formatoNumero: true,
        tipo: true,
        valores: {
          orderBy: { fecha: 'desc' },
          take: 2,
          select: { valor: true, valorTexto: true, confiable: true, fechaCaptura: true, fecha: true },
        },
      },
    });

    const indicadoresConValor = indicadores.map((ind) => {
      const valores = ind.valores;
      const ultimo = valores[0] || null;
      const anterior = valores[1] || null;

      let tendencia: 'up' | 'down' | 'stable' | null = null;
      let delta: number | null = null;

      if (ultimo && anterior) {
        const diff = ultimo.valor - anterior.valor;
        if (Math.abs(diff) < 0.001) {
          tendencia = 'stable';
        } else {
          tendencia = diff > 0 ? 'up' : 'down';
          // Calculate % delta
          if (anterior.valor !== 0) {
            delta = (diff / Math.abs(anterior.valor)) * 100;
          } else {
            delta = diff;
          }
        }
      }

      return {
        id: ind.id,
        nombre: ind.nombre,
        slug: ind.slug,
        categoria: ind.categoria,
        unidad: ind.unidad,
        activo: ind.activo,
        ultimoValor: ultimo?.valor ?? null,
        valorTexto: ultimo?.valorTexto || null,
        fechaCaptura: ultimo?.fechaCaptura?.toISOString() ?? null,
        tendencia,
        delta,
        confiable: ultimo?.confiable ?? true,
      };
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalActivos,
      totalInactivos,
      ultimaEvaluacion: ultimaEvaluacion?.fechaCreacion?.toISOString() ?? null,
      indicadores: indicadoresConValor,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error, 'indicadores-summary') }, { status: 500 });
  }
}
