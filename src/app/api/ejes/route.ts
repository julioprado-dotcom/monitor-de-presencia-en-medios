import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const ejes = await db.ejeTematico.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });

    // Single groupBy query instead of N+1 per eje
    const conteosRaw = await db.mencionTema.groupBy({
      by: ['ejeTematicoId'],
      _count: { id: true },
    });

    const conteoMap = new Map(conteosRaw.map((c) => [c.ejeTematicoId, c._count.id]));

    const ejesConConteo = ejes.map((eje) => ({
      ...eje,
      mencionesCount: conteoMap.get(eje.id) || 0,
    }));

    return NextResponse.json({
      ejes: ejesConConteo,
      totalEjes: ejes.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
