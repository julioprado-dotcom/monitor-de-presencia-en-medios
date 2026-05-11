/**
 * /api/dashboard/ejes-summary — Ejes temáticos dashboard
 * Returns active root ejes with today's mention activity counts.
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/rate-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Start of today (local)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Root-level active ejes
    const ejes = await db.ejeTematico.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: { menciones: true },
        },
        children: {
          select: { id: true, _count: { select: { menciones: true } } },
        },
      },
      orderBy: { orden: 'asc' },
    });

    const totalActivos = ejes.length;

    const ejesMapped = await Promise.all(
      ejes.map(async (eje) => {
        // Collect root + children IDs
        const allEjeIds = [eje.id, ...eje.children.map((c) => c.id)];

        // Today mentions via MencionTema → Mencion join
        const mencionesHoy = await db.mencionTema.count({
          where: {
            ejeTematicoId: { in: allEjeIds },
            mencion: { fechaCaptura: { gte: todayStart } },
          },
        });

        // Total mentions (all time, root + children)
        const totalMenciones =
          eje._count.menciones +
          eje.children.reduce((s, c) => s + c._count.menciones, 0);

        return {
          id: eje.id,
          nombre: eje.nombre,
          slug: eje.slug,
          color: eje.color,
          icono: eje.icono,
          mencionesHoy,
          totalMenciones,
          temasCount: eje.children.length,
        };
      }),
    );

    const conActividadHoy = ejesMapped.filter((e) => e.mencionesHoy > 0).length;

    // Top eje by today mentions (first with highest count)
    const topEje =
      ejesMapped.length > 0
        ? ejesMapped.reduce((top, current) =>
            current.mencionesHoy > top.mencionesHoy ? current : top,
          )
        : null;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalActivos,
      conActividadHoy,
      topEje,
      ejes: ejesMapped,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error, 'ejes-summary') }, { status: 500 });
  }
}
