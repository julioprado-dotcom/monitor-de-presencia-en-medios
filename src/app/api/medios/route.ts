import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivel = searchParams.get('nivel');
    const tipo = searchParams.get('tipo');
    const departamento = searchParams.get('departamento');
    const activo = searchParams.get('activo');

    const where: Record<string, unknown> = {};
    if (nivel) where.nivel = nivel;
    if (tipo) where.tipo = tipo;
    if (departamento) where.departamento = departamento;
    if (activo !== null && activo !== undefined) where.activo = activo === 'true';

    // Fetch medios and mention counts in a single groupBy — no N+1
    const [medios, conteosRaw] = await Promise.all([
      db.medio.findMany({
        where,
        orderBy: [{ nivel: 'asc' }, { nombre: 'asc' }],
      }),
      db.mencion.groupBy({
        by: ['medioId'],
        _count: { id: true },
      }),
    ]);

    // Build O(1) lookup map for mention counts
    const conteoMap = new Map(conteosRaw.map((c) => [c.medioId, c._count.id]));

    const mediosConConteo = medios.map((medio) => ({
      ...medio,
      mencionesCount: conteoMap.get(medio.id) || 0,
    }));

    // Resumen por nivel — batched: 1 count + 1 groupBy instead of 15 queries
    const nivelLabels: Record<string, string> = {
      '1': 'Corporativos',
      '2': 'Regionales',
      '3': 'Alternativos',
      '4': 'Redes',
      '5': 'Extendidos',
    };

    const [mediosActivos, mencionesPorMedio] = await Promise.all([
      db.medio.groupBy({
        by: ['nivel'],
        where: { activo: true },
        _count: { id: true },
      }),
      // Get all medios activos IDs and count their mentions in one query
      db.medio.findMany({
        where: { activo: true },
        select: { id: true, nivel: true },
      }),
    ]);

    const activosMap = new Map(mediosActivos.map((m) => [m.nivel, m._count.id]));
    const activosIds = new Set(mencionesPorMedio.map((m) => m.id));

    // Count menciones for all active medios in a single groupBy
    const mencionesActivasRaw = activosIds.size > 0
      ? await db.mencion.groupBy({
          by: ['medioId'],
          where: { medioId: { in: [...activosIds] } },
          _count: { id: true },
        })
      : [];

    const mencionesActivasMap = new Map(mencionesPorMedio.map((m) => [m.id, m.nivel]));
    const conteoActivasMap = new Map(mencionesActivasRaw.map((c) => [c.medioId, c._count.id]));

    // Aggregate by level
    const conteosPorNivel = new Map<string, number>();
    for (const [medioId, nivel] of mencionesActivasMap) {
      const count = conteoActivasMap.get(medioId) || 0;
      conteosPorNivel.set(nivel, (conteosPorNivel.get(nivel) || 0) + count);
    }

    const resumenPorNivel = ['1', '2', '3', '4', '5'].map((n) => ({
      nivel: n,
      etiqueta: nivelLabels[n] || `Nivel ${n}`,
      totalMedios: activosMap.get(n) || 0,
      mencionesCount: conteosPorNivel.get(n) || 0,
    }));

    return NextResponse.json({
      medios: mediosConConteo,
      totalMedios: medios.length,
      resumenPorNivel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
