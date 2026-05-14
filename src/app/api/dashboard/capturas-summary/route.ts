/**
 * /api/dashboard/capturas-summary — Capturas / Evidencias dashboard
 * Returns capture stats derived from menciones + capture logs.
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/rate-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Bolivia UTC-4 helpers
function todayStartBolivia(): Date {
  const now = new Date();
  const boliviaOffset = -4 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const boliviaMs = utcMs + boliviaOffset * 60000;
  const boliviaNow = new Date(boliviaMs);
  const start = new Date(boliviaNow.getFullYear(), boliviaNow.getMonth(), boliviaNow.getDate());
  return new Date(start.getTime() - boliviaOffset * 60000);
}

function last24hBolivia(): Date {
  return new Date(Date.now() - 24 * 3600000);
}

function safeNum(n: unknown, fallback = 0): number {
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback;
}

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = todayStartBolivia();
    const last24h = last24hBolivia();

    // Parallel queries: menciones + captureLog
    const [
      // From menciones table (real data)
      mencionesHoy,
      menciones24h,
      totalMenciones,

      // Group menciones by medio (last 24h)
      mencionesPorMedio24h,

      // From captureLog table (capture execution records)
      capturasLogHoy,
      capturasLog24h,
      totalCapturasLog,
      exitosas24h,
      logAggregate24h,
      recentCapturas,
    ] = await Promise.all([
      // Menciones captured today (Bolivia)
      db.mencion.count({ where: { fechaCaptura: { gte: startOfDay } } }),
      db.mencion.count({ where: { fechaCaptura: { gte: last24h } } }),
      db.mencion.count(),

      // Group by medio for recent display
      db.mencion.groupBy({
        by: ['medioId'],
        where: { fechaCaptura: { gte: last24h } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // CaptureLog queries (may be empty)
      db.capturaLog.count({ where: { fecha: { gte: startOfDay } } }).catch(() => 0),
      db.capturaLog.count({ where: { fecha: { gte: last24h } } }).catch(() => 0),
      db.capturaLog.count().catch(() => 0),
      db.capturaLog.count({ where: { fecha: { gte: last24h }, exitosa: true } }).catch(() => 0),
      db.capturaLog.aggregate({
        where: { fecha: { gte: last24h } },
        _sum: { mencionesEncontradas: true, totalArticulos: true },
      }).catch(() => ({ _sum: { mencionesEncontradas: null, totalArticulos: null } })),
      db.capturaLog.findMany({
        orderBy: { fecha: 'desc' },
        take: 10,
        include: { Medio: { select: { id: true, nombre: true, tipo: true } } },
      }).catch(() => []),
    ]);

    // Build "ultimas" from menciones grouped by medio
    const mediosMap = new Map<string, { id: string; nombre: string; tipo: string }>();
    const medios = await db.medio.findMany({ select: { id: true, nombre: true, tipo: true } });
    for (const m of medios) mediosMap.set(m.id, m);

    // Use captureLog entries if available, otherwise build from menciones by medio
    let ultimas;
    if (recentCapturas.length > 0) {
      ultimas = recentCapturas.map((c) => ({
        id: c.id,
        fecha: c.fecha.toISOString(),
        nivel: c.nivel || '1',
        totalArticulos: safeNum(c.totalArticulos),
        mencionesEncontradas: safeNum(c.mencionesEncontradas),
        exitosa: c.exitosa,
        errores: c.errores || '',
        medio: { nombre: c.Medio?.nombre || 'Desconocido', tipo: c.Medio?.tipo || 'web' },
      }));
    } else {
      // Build from menciones grouped by medio
      ultimas = mencionesPorMedio24h.map((g) => {
        const medioInfo = mediosMap.get(g.medioId) || { nombre: 'Desconocido', tipo: 'web' };
        return {
          id: `m-group-${g.medioId}`,
          fecha: now.toISOString(),
          nivel: '1',
          totalArticulos: g._count.id,
          mencionesEncontradas: g._count.id,
          exitosa: true,
          errores: '',
          medio: { nombre: medioInfo.nombre, tipo: medioInfo.tipo },
        };
      });
    }

    // Success rate from captureLog if available
    const successRate = safeNum(
      capturasLog24h > 0 ? Math.round((exitosas24h / capturasLog24h) * 100) : 100,
      100,
    );

    // Debug: verify startOfDay
    const debugStart = startOfDay.toISOString();

    return NextResponse.json({
      timestamp: now.toISOString(),
      _debug: { startOfDay: debugStart, last24h: last24h.toISOString() },
      // Primary stats from menciones (real data)
      capturasHoy: safeNum(mencionesHoy),
      capturas24h: safeNum(menciones24h),
      totalCapturas: safeNum(totalMenciones),
      totalMenciones24h: safeNum(menciones24h),
      // Derived
      exitosas24h: safeNum(exitosas24h, menciones24h),
      fallidas24h: safeNum(capturasLog24h - exitosas24h, 0),
      successRate,
      totalArticulos24h: safeNum(logAggregate24h?._sum?.totalArticulos, menciones24h),
      ultimas,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error, 'capturas-summary') }, { status: 500 });
  }
}
