/**
 * DECODEX v0.8.0 — Generador: El Radar
 * Motor ONION200 — Equipo B — TAREA 1c
 *
 * Radar semanal de los 11 ejes tematicos,
 * ~500 palabras, temperatura 0.3.
 *
 * POST /api/admin/bulletins/generate-radar
 */

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getProductConfig, getDateRange, formatFechaBolivia } from '@/lib/bulletin/product-generator';
import { getIndicadoresParaEjes, formatearIndicadoresMultiplesPrompt } from '@/lib/indicadores/injector';
import { formatearMencionesPorEje, construirPrompt, registrarReporte, generarTituloProducto, getDedicatedResumen, getSemanaAnho } from '@/lib/reportes-utils';

// ============================================
// System Prompt — El Radar
// ============================================

const SYSTEM_PROMPT_RADAR = `Eres un analista de panorama mediatico de DECODEX Bolivia. Tu tarea es generar EL RADAR, el radar semanal de los 11 ejes tematicos.

INSTRUCCIONES DE FORMATO:
- Titulo: "EL RADAR — Semana del [fecha inicio] al [fecha fin]"
- Extension: 500 palabras
- Tono: panoramico, visual, dinamico
- Estructura:
  1. Panorama general de la semana (2-3 oraciones)
  2. Radar por eje tematico (breve por cada uno):
     - Nombre del eje
     - Nivel de actividad: ALTO / MEDIO / BAJO
     - 1 dato clave
  3. Ejes en alerta (los de mayor actividad)
  4. Tendencia general de la semana
  5. Recomendacion de monitoreo

REGLAS:
- Cubrir los 11 ejes tematicos proporcionados
- Indicar nivel de actividad por eje (ALTO/MEDIO/BAJO)
- Solo usar datos proporcionados
- Fechas en formato es-BO (America/La_Paz)
- Resumen conciso por eje, no mas de 2 lineas c/u
- No usar emojis ni caracteres especiales
- Ser objetivo y basado en datos`;

// ============================================
// Los 11 Ejes Tematicos de DECODEX
// ============================================

const EJES_TEOMATICOS = [
  'politica-nacional',
  'economia',
  'seguridad',
  'medio-ambiente',
  'social',
  'internacional',
  'legislativo',
  'justicia',
  'salud',
  'educacion',
  'tecnologia',
];

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const temperaturaOverride = body.temperatura as number | undefined;

    // 1. Obtener configuracion del producto
    const config = getProductConfig('EL_RADAR');
    if (!config) {
      return NextResponse.json(
        { exito: false, error: 'Producto EL_RADAR no encontrado en catalogo' },
        { status: 404 }
      );
    }

    // 2. Calcular rango semanal
    const range = getDateRange('EL_RADAR');
    const semana = getSemanaAnho();

    // 3. Obtener menciones por cada eje tematico
    const mencionesPorEje: Record<string, Array<Record<string, unknown>>> = {};
    const totalMencionesPorEje: Record<string, number> = {};

    for (const slug of EJES_TEOMATICOS) {
      const menciones = await db.mencion.findMany({
        where: {
          fechaCaptura: {
            gte: range.fechaInicio,
            lte: range.fechaFin,
          },
          ejesTematicos: {
            some: {
              ejeTematico: { slug },
            },
          },
        },
        include: {
          medio: { select: { nombre: true } },
          persona: { select: { nombre: true } },
        },
        orderBy: { fechaPublicacion: 'desc' },
        take: 10,
      });

      mencionesPorEje[slug] = menciones.map((m) => ({
        titulo: m.titulo,
        medio: m.medio?.nombre ?? null,
        persona: m.persona?.nombre ?? null,
        sentimiento: m.sentimiento,
      }));

      totalMencionesPorEje[slug] = menciones.length;
    }

    const totalMenciones = Object.values(totalMencionesPorEje).reduce((a, b) => a + b, 0);

    if (totalMenciones === 0) {
      return NextResponse.json({
        exito: false,
        error: 'No se encontraron menciones en la ventana semanal',
        semana,
        fechaInicio: range.fechaInicio.toISOString(),
        fechaFin: range.fechaFin.toISOString(),
      });
    }

    // 4. Obtener indicadores de todos los ejes
    const indicadoresPorEje = await getIndicadoresParaEjes(EJES_TEOMATICOS);
    const indicadoresPrompt = formatearIndicadoresMultiplesPrompt(indicadoresPorEje);

    // 5. Formatear menciones por eje
    const mencionesPrompt = formatearMencionesPorEje(mencionesPorEje);

    // 6. Construir prompt
    const ventanaLabel = `${formatFechaBolivia(range.fechaInicio)} al ${formatFechaBolivia(range.fechaFin)}`;
    const resumenEjes = EJES_TEOMATICOS
      .map((slug) => `- ${slug}: ${totalMencionesPorEje[slug]} menciones`)
      .join('\n');

    const userPrompt = construirPrompt(
      'EL_RADAR',
      mencionesPrompt,
      indicadoresPrompt,
      `Semana ${semana} | Periodo: ${ventanaLabel}\nTotal menciones: ${totalMenciones}\n\nDistribucion por eje:\n${resumenEjes}`
    );

    // 7. Generar con IA
    const zai = await ZAI.create();
    const temperatura = temperaturaOverride ?? 0.3;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_RADAR },
        { role: 'user', content: userPrompt },
      ],
      temperature: temperatura,
    });

    const contenido = completion.choices[0]?.message?.content ?? '';
    const tokensUsados = completion.usage?.total_tokens;
    const modelo = completion.model;

    if (!contenido) {
      return NextResponse.json(
        { exito: false, error: 'La IA no genero contenido' },
        { status: 500 }
      );
    }

    // 8. Registrar en BD
    const titulo = generarTituloProducto('EL_RADAR');
    const resumen = await getDedicatedResumen('EL_RADAR', {
      ejes: totalMencionesPorEje,
      fecha: ventanaLabel,
    });

    const reporteId = await registrarReporte({
      tipoProducto: 'EL_RADAR',
      titulo,
      contenido,
      resumen,
      fechaInicio: range.fechaInicio,
      fechaFin: range.fechaFin,
      temperatura,
      tokensUsados,
      modeloIA: modelo,
      metadata: JSON.stringify({
        semana,
        totalMenciones,
        totalMencionesPorEje,
        ejesCubiertos: EJES_TEOMATICOS.length,
      }),
    });

    // 9. Retornar resultado
    return NextResponse.json({
      exito: true,
      reporteId,
      titulo,
      contenido,
      resumen,
      metadata: {
        tipo: 'EL_RADAR',
        semana,
        temperatura,
        tokensUsados,
        modelo,
        totalMenciones,
        ejesCubiertos: EJES_TEOMATICOS.length,
        distribucionPorEje: totalMencionesPorEje,
      },
    });
  } catch (error) {
    console.error('[generate-radar] Error:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { exito: false, error: `Error al generar El Radar: ${mensaje}` },
      { status: 500 }
    );
  }
}
