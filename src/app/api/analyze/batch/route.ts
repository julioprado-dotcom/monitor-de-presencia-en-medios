import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { guardedParse, RATE } from '@/lib/rate-guard';
import { analyzeBatchSchema } from '@/lib/validations';
import { analyzeMencion, applyAnalysisToMencion, EJES_TEMATICOS } from '@/lib/analyze';

export async function POST(request: NextRequest) {
  try {
    const parsed = await guardedParse(request, analyzeBatchSchema, RATE.AI);
    if (parsed instanceof NextResponse) return parsed;
    const { limit } = parsed.body;

    // Obtener menciones sin clasificar
    const menciones = await db.mencion.findMany({
      where: { sentimiento: 'no_clasificado' },
      take: limit,
      include: { persona: { select: { nombre: true } }, medio: { select: { nombre: true } } },
    });

    if (menciones.length === 0) {
      return NextResponse.json({
        analizadas: 0,
        mensaje: 'No hay menciones pendientes de análisis',
        ejesDisponibles: EJES_TEMATICOS.length,
      });
    }

    let analizadas = 0;
    let errores = 0;
    const detalles: string[] = [];

    for (const mencion of menciones) {
      try {
        const result = await analyzeMencion(
          mencion.titulo || '',
          mencion.textoCompleto || mencion.texto || ''
        );

        await applyAnalysisToMencion(mencion.id, result);

        analizadas++;
        detalles.push(`${mencion.persona.nombre}: ${result.tipoMencion} / ${result.sentimiento} / [${result.ejesTematicos.join(',')}]`);
      } catch {
        errores++;
        detalles.push(`${mencion.persona.nombre}: ERROR`);
      }
    }

    return NextResponse.json({
      analizadas,
      errores,
      totalProcesadas: menciones.length,
      detalles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error en el análisis batch', details: message }, { status: 500 });
  }
}
