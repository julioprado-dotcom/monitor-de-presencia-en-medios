// POST /api/admin/kick-capture — Forzar captura inmediata
//
// Endpoint de emergencia para reactivar la captura manualmente.
// Encola check_fuente para las N fuentes más activas.
// Útil después de paradas prolongadas o reinicios del servidor.

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { enqueue } from '@/lib/jobs/queue';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const maxSources = Math.min(Number(body.maxSources) || 5, 20);

    // Resetear fuentes stale (cold-start bypass)
    const fuentesStale = await db.fuenteEstado.findMany({
      where: {
        activo: true,
        OR: [
          { ultimoCheckOk: null },
          { ultimoCheckOk: { lt: new Date(Date.now() - 72 * 3600 * 1000) } },
        ],
      },
      select: { id: true },
    });

    if (fuentesStale.length > 0) {
      await db.fuenteEstado.updateMany({
        where: { id: { in: fuentesStale.map(f => f.id) } },
        data: {
          ultimoCheckOk: new Date(),
          fallosConsecutivos: 0,
          checksSinCambio: 0,
        },
      });
    }

    // Encolar checks para las fuentes más productivas
    const fuentes = await db.fuenteEstado.findMany({
      where: { activo: true },
      include: { Medio: { select: { nombre: true } } },
      orderBy: { totalMenciones: 'desc' },
      take: maxSources,
    });

    const enqueued: string[] = [];
    for (const f of fuentes) {
      try {
        const jobId = await enqueue({
          tipo: 'check_fuente',
          prioridad: 1,
          payload: { fuenteId: f.id, medioId: f.medioId },
        });
        enqueued.push(f.Medio?.nombre || f.medioId);
      } catch (err) {
        console.warn(`[kick-capture] No se pudo encolar ${f.medioId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      fuentesReseteadas: fuentesStale.length,
      checksEncolados: enqueued.length,
      fuentes: enqueued,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[kick-capture] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to kick capture' },
      { status: 500 },
    );
  }
}

// GET: retorna estado de la cola (sin encolar nada)
export async function GET() {
  try {
    const [pending, enProgreso, fuentesActivas] = await Promise.all([
      db.job.count({ where: { estado: 'pendiente' } }),
      db.job.count({ where: { estado: 'en_progreso' } }),
      db.fuenteEstado.count({ where: { activo: true } }),
    ]);

    return NextResponse.json({
      queueStatus: { pending, enProgreso, fuentesActivas },
      kickAvailable: pending < 50, // Disponible si la cola no está saturada
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
