/**
 * DECODEX v0.8.0 — Generador Generico de Productos
 * Motor ONION200 — Equipo B — TAREA 2d
 *
 * Endpoint generico con registry de system prompts por tipo.
 * Permite generar cualquier producto del catalogo sin
 * necesidad de un endpoint dedicado.
 *
 * POST /api/admin/bulletins/generate-generic
 */

import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { PRODUCTOS } from '@/constants/products';
import { getProductConfig, getMencionesForBulletin, getDateRange } from '@/lib/bulletin/product-generator';
import { getIndicadoresParaEjes, formatearIndicadoresMultiplesPrompt } from '@/lib/indicadores/injector';
import { formatearMencionesPrompt, construirPrompt, registrarReporte, generarTituloProducto, getDedicatedResumen, formatFechaBolivia } from '@/lib/reportes-utils';
import { type TipoBoletin } from '@/types/bulletin';

// ============================================
// Mapa de ejes tematicos sugeridos por tipo de producto.
// ============================================

const DEFAULT_EJES_BY_TYPE: Partial<Record<TipoBoletin, string[]>> = {
  EL_TERMOMETRO: ['politica-nacional', 'economia', 'seguridad', 'social', 'medio-ambiente'],
  SALDO_DEL_DIA: ['politica-nacional', 'economia', 'seguridad', 'social'],
  EL_RADAR: [
    'politica-nacional', 'economia', 'seguridad', 'medio-ambiente',
    'social', 'internacional', 'legislativo', 'justicia',
    'salud', 'educacion', 'tecnologia',
  ],
  VOZ_Y_VOTO: ['legislativo', 'politica-nacional', 'justicia'],
  EL_HILO: ['politica-nacional', 'economia', 'seguridad', 'social'],
  EL_INFORME_CERRADO: [
    'politica-nacional', 'economia', 'seguridad', 'medio-ambiente',
    'social', 'internacional', 'legislativo',
  ],
};

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tipo,
      ejeSlug,
      personaId,
      temperatura: temperaturaOverride,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
      clienteId,
    } = body as {
      tipo: TipoBoletin;
      ejeSlug?: string;
      personaId?: string;
      temperatura?: number;
      fechaInicio?: string;
      fechaFin?: string;
      clienteId?: string;
    };

    // 1. Validar tipo de producto
    if (!tipo || !(tipo in PRODUCTOS)) {
      return NextResponse.json(
        {
          exito: false,
          error: `Tipo de producto invalido: "${tipo}". Tipos validos: ${Object.keys(PRODUCTOS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 2. Obtener configuracion
    const config = getProductConfig(tipo);
    if (!config || !config.activo) {
      return NextResponse.json(
        { exito: false, error: `Producto "${tipo}" no esta activo` },
        { status: 400 }
      );
    }

    // 3. Calcular rango de fechas
    const range = getDateRange(tipo);
    const inicio = fechaInicioStr ? new Date(fechaInicioStr) : range.fechaInicio;
    const fin = fechaFinStr ? new Date(fechaFinStr) : range.fechaFin;

    // 4. Obtener menciones
    const options: { ejesTematicos?: string[]; personaId?: string; customDays?: number } = {};
    if (ejeSlug) options.ejesTematicos = [ejeSlug];
    if (personaId) options.personaId = personaId;

    const resultado = await getMencionesForBulletin(tipo, options);

    if (resultado.totalMenciones === 0) {
      return NextResponse.json({
        exito: false,
        error: `No se encontraron menciones para "${tipo}" en el periodo consultado`,
        tipo,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      });
    }

    // 5. Obtener indicadores segun tipo
    const ejesParaIndicadores = ejeSlug
      ? [ejeSlug]
      : (DEFAULT_EJES_BY_TYPE[tipo] ?? []);
    const indicadoresPorEje = await getIndicadoresParaEjes(ejesParaIndicadores);
    const indicadoresPrompt = formatearIndicadoresMultiplesPrompt(indicadoresPorEje);

    // 6. Construir prompt
    const mencionesPrompt = formatearMencionesPrompt(resultado.menciones);
    const ventanaLabel = `${formatFechaBolivia(range.fechaInicio)} — ${formatFechaBolivia(range.fechaFin)}`;

    let datosExtra = [
      `Tipo de producto: ${config.nombre}`,
      `Periodo: ${ventanaLabel}`,
      `Total menciones: ${resultado.totalMenciones}`,
    ].join('\n');

    if (ejeSlug) datosExtra += `\nEje tematico: ${ejeSlug}`;
    if (personaId) datosExtra += `\nPersona ID: ${personaId}`;

    const userPrompt = construirPrompt(tipo, mencionesPrompt, indicadoresPrompt, datosExtra);

    // 7. Generar con IA
    const zai = await ZAI.create();
    const temperatura = temperaturaOverride ?? 0.3;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: `Genera el producto "${config.nombre}" de DECODEX Bolivia. Sigue las instrucciones proporcionadas en el prompt del usuario.` },
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
    const titulo = generarTituloProducto(tipo, undefined, ejeSlug);
    const resumen = await getDedicatedResumen(tipo, {
      menciones: resultado.menciones,
      fecha: ventanaLabel,
      ejeSlug,
    });

    const reporteId = await registrarReporte({
      tipoProducto: tipo,
      titulo,
      contenido,
      resumen,
      fechaInicio: inicio,
      fechaFin: fin,
      temperatura,
      tokensUsados,
      modeloIA: modelo,
      metadata: JSON.stringify({
        generico: true,
        ejeSlug,
        personaId,
        totalMenciones: resultado.totalMenciones,
      }),
      clienteId,
    });

    // 9. Retornar resultado
    return NextResponse.json({
      exito: true,
      reporteId,
      titulo,
      contenido,
      resumen,
      metadata: {
        tipo,
        temperatura,
        tokensUsados,
        modelo,
        totalMenciones: resultado.totalMenciones,
      },
    });
  } catch (error) {
    console.error('[generate-generic] Error:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { exito: false, error: `Error en generador generico: ${mensaje}` },
      { status: 500 }
    );
  }
}
