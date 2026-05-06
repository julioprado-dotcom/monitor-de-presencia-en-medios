import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { guardedParse, RATE } from '@/lib/rate-guard';
import { analyzeSchema } from '@/lib/validations';
import { analyzeMencion, applyAnalysisToMencion, EJES_TEMATICOS } from '@/lib/analyze';

export async function POST(request: NextRequest) {
  try {
    const parsed = await guardedParse(request, analyzeSchema, RATE.AI);
    if (parsed instanceof NextResponse) return parsed;
    const { mencionId, texto, titulo } = parsed.body;

    let tituloText = titulo || '';
    let textoText = texto || '';

    if (mencionId) {
      const mencion = await db.mencion.findUnique({ where: { id: mencionId } });
      if (!mencion) {
        return NextResponse.json({ error: 'Mención no encontrada' }, { status: 404 });
      }
      tituloText = mencion.titulo;
      textoText = mencion.textoCompleto || mencion.texto;
    }

    if (!tituloText && !textoText) {
      return NextResponse.json(
        { error: 'Se requiere mencionId o texto + titulo' },
        { status: 400 }
      );
    }

    const result = await analyzeMencion(tituloText, textoText);

    // Actualizar la mención en la DB
    if (mencionId) {
      await applyAnalysisToMencion(mencionId, result);
    }

    // Retornar nombres de ejes además de slugs
    const ejesConNombres = result.ejesTematicos.map(slug => {
      const eje = EJES_TEMATICOS.find(e => e.slug === slug);
      return { slug, nombre: eje?.nombre || slug };
    });

    return NextResponse.json({
      tipoMencion: result.tipoMencion,
      sentimiento: result.sentimiento,
      ejesTematicos: ejesConNombres,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error en el análisis', details: message }, { status: 500 });
  }
}
