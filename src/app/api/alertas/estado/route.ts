// ─── Endpoint: Estado del Semaforo de Alertas Tempranas ──────────────────
// GET  /api/alertas/estado         → Semaforo actual basado en indicadores DB
// POST /api/alertas/estado         → Forzar re-evaluación manual (solo admin)
//
// Principio D.8: Las alertas se generan exclusivamente a partir de
// datos cuantitativos almacenados. No se inventan alertas.

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { evaluarIndicadores, type IndicadorEntrada } from '@/lib/alerts/motor-evaluacion';
import { safeError } from '@/lib/rate-guard';

// ─── Mapeo: slug de Indicador en DB → slug de Umbral de Alerta ──────────
// Los indicadores en la DB tienen slugs como "tipo-de-cambio-bcb",
// los umbrales esperan slugs como "brecha_cambiaria_porcentual".
// Este mapa conecta ambos sistemas.

const INDICADOR_TO_UMBRAL: Record<string, string> = {
  'tipo-de-cambio-bcb': 'brecha_cambiaria_porcentual',
  'rin': 'rin_variacion_semanal_mm_usd',
  'lme-zinc': 'volatilidad_minera_pct_semanal',
  'lme-estano': 'volatilidad_minera_pct_semanal',
  'litio': 'litio_precio_variacion_pct',
  'gas-production': 'gas_produccion_mmcmd',
};

// ─── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    // 1. Obtener últimos valores de indicadores desde la DB
    const indicadoresDB = await db.indicador.findMany({
      where: { activo: true },
      select: {
        slug: true,
        IndicadorValor: {
          orderBy: { fecha: 'desc' },
          take: 3, // Últimos 3 puntos para historial
          select: { valor: true, fecha: true },
        },
      },
    });

    if (indicadoresDB.length === 0) {
      return NextResponse.json({
        estado: 'sin_datos',
        mensaje: 'No hay indicadores configurados en la base de datos.',
        fecha: new Date().toISOString().split('T')[0],
      });
    }

    // 2. Mapear a formato de entrada del motor
    const entradas: IndicadorEntrada[] = [];

    for (const ind of indicadoresDB) {
      const vals = ind.IndicadorValor;
      if (vals.length === 0) continue;

      const umbralSlug = INDICADOR_TO_UMBRAL[ind.slug];
      if (!umbralSlug) continue; // No tiene umbral configurado

      const ultimo = vals[0];
      const historial = vals.map(v => ({
        fecha: v.fecha,
        valor: v.valor,
      }));

      // Calcular variación para indicadores que lo necesitan
      let valor = ultimo.valor;

      if (umbralSlug === 'rin_variacion_semanal_mm_usd' && vals.length >= 2) {
        // RIN: calcular variación entre el último y el penúltimo
        valor = vals[0].valor - vals[1].valor;
      } else if (umbralSlug === 'volatilidad_minera_pct_semanal' && vals.length >= 2) {
        // Minerales: calcular variación porcentual semanal
        const anterior = vals[1].valor;
        if (anterior !== 0) {
          valor = Math.abs((ultimo.valor - anterior) / anterior * 100);
        }
      } else if (umbralSlug === 'litio_precio_variacion_pct' && vals.length >= 2) {
        const anterior = vals[1].valor;
        if (anterior !== 0) {
          valor = Math.abs((ultimo.valor - anterior) / anterior * 100);
        }
      }

      entradas.push({
        slug: umbralSlug,
        valor,
        historial,
      });
    }

    // 3. Ejecutar motor de evaluación
    const semaforo = evaluarIndicadores(entradas);

    return NextResponse.json({
      estado: 'ok',
      data: semaforo,
      meta: {
        indicadores_disponibles: entradas.length,
        indicadores_total: indicadoresDB.length,
        umbrales_configurados: Object.keys(INDICADOR_TO_UMBRAL).length,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: safeError(error, 'alertas/estado') },
      { status: 500 }
    );
  }
}

// ─── POST Handler (Solo Admin) ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Verificar permisos de admin via API key
    const apiKey = request.headers.get('x-admin-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere X-Admin-Api-Key.' },
        { status: 403 }
      );
    }

    // Permitir inyectar indicadores manualmente para testing
    const body = await request.json();
    const { indicadores } = body as {
      indicadores?: IndicadorEntrada[];
    };

    if (!indicadores || !Array.isArray(indicadores)) {
      return NextResponse.json(
        { error: 'Se requiere "indicadores" como array de { slug, valor, historial? }' },
        { status: 400 }
      );
    }

    const semaforo = evaluarIndicadores(indicadores);

    return NextResponse.json({
      estado: 'ok',
      modo: 'evaluacion_manual',
      data: semaforo,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: safeError(error, 'alertas/estado') },
      { status: 500 }
    );
  }
}
