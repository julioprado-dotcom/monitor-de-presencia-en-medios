/**
 * /api/dashboard/menciones-summary — Menciones dashboard
 * Returns mention counts (today, yesterday, week), trend, and latest 10 menciones.
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/rate-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1); // Monday

    const [hoyCount, ayerCount, semanaCount, total, ultimas] = await Promise.all([
      db.mencion.count({ where: { fechaCaptura: { gte: hoy, lt: manana } } }),
      db.mencion.count({ where: { fechaCaptura: { gte: ayer, lt: hoy } } }),
      db.mencion.count({ where: { fechaCaptura: { gte: inicioSemana } } }),
      db.mencion.count(),
      db.mencion.findMany({
        include: {
          persona: { select: { nombre: true } },
          medio: { select: { nombre: true } },
        },
        orderBy: { fechaCaptura: 'desc' },
        take: 10,
      }),
    ]);

    let tendencia: 'up' | 'down' | 'stable' = 'stable';
    if (ayerCount === 0 && hoyCount > 0) {
      tendencia = 'up';
    } else if (ayerCount > 0 && hoyCount > ayerCount) {
      tendencia = 'up';
    } else if (hoyCount < ayerCount) {
      tendencia = 'down';
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      hoy: hoyCount,
      ayer: ayerCount,
      semana: semanaCount,
      total,
      tendencia,
      ultimas: ultimas.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        fechaCaptura: m.fechaCaptura,
        tratamientoPeriodistico: m.tratamientoPeriodistico ?? null,
        persona: m.persona ? { nombre: m.persona.nombre } : null,
        medio: { nombre: m.medio.nombre },
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error, 'menciones-summary') }, { status: 500 });
  }
}
