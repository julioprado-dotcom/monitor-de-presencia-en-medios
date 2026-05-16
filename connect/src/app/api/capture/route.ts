// /api/capture — DECODEX Bolivia
// Pipeline A: Scraper directo de homepages (CERO Bing, CERO APIs de búsqueda externas)
//
// Flujo:
// 1. Obtener medios activos con URL
// 2. Para cada medio: fetch(medio.url) → extraer links → triaje por keywords → LLM
// 3. Crear menciones en la DB
//
// Eliminado: zai.functions.invoke('web_search') — causaba 0 resultados por CAPTCHA de Bing
// Reemplazado por: scrape-homepage.ts — scraper directo con fetch() + regex

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/safe-error';
import { withAuth } from '@/lib/auth-helpers';
import { FLOW_CONTROL } from '@/lib/jobs/constants';
import { scrapeMedio, type ScrapeMedioResult } from '@/lib/scrape-homepage';

// ─── Flow Control: Cooldown global ─────────────────────────────
let lastCaptureTime = 0;

// ─── POST: Ejecutar captura directa desde homepages ───────────

export async function POST(request: NextRequest) {
  const { error: authError } = await withAuth();
  if (authError) return authError;

  // ─── Flow Control: Rate limiting ───
  const now = Date.now();
  const elapsed = now - lastCaptureTime;
  if (elapsed < FLOW_CONTROL.captureEndpointCooldownMs && lastCaptureTime > 0) {
    const waitSec = Math.ceil((FLOW_CONTROL.captureEndpointCooldownMs - elapsed) / 1000);
    return NextResponse.json({
      error: `Flow control: Cooldown activo. Espera ${waitSec}s entre capturas.`,
      cooldownRemaining: waitSec,
    }, { status: 429 });
  }
  lastCaptureTime = now;

  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(20, Math.max(1, parseInt(searchParams.get('count') || '5')));
    const medioIdParam = searchParams.get('medioId'); // Opcional: capturar solo un medio

    // Obtener medios activos con URL válida
    const whereClause = medioIdParam
      ? { id: medioIdParam, activo: true, url: { not: '' } }
      : { activo: true, url: { not: '' } };

    const medios = await db.medio.findMany({
      where: whereClause,
      take: medioIdParam ? undefined : count,
      orderBy: medioIdParam ? undefined : { fechaCreacion: 'asc' },
    });

    if (medios.length === 0) {
      return NextResponse.json({
        error: medioIdParam ? `Medio ${medioIdParam} no encontrado o sin URL` : 'No hay medios activos con URL configurada',
        mediosDisponibles: 0,
      }, { status: 400 });
    }

    console.log(`[capture] Iniciando captura directa de ${medios.length} medios (scraper homepage, CERO Bing)`);

    // ─── Scraper directo de cada medio ───
    let totalMencionesNuevas = 0;
    let totalClasificadas = 0;
    let totalErrores = 0;
    const resultados: ScrapeMedioResult[] = [];
    const detalles: string[] = [];

    for (const medio of medios) {
      console.log(`[capture] Procesando: ${medio.nombre} (${medio.url})`);

      try {
        const result = await scrapeMedio(medio.url, medio.id, medio.nombre);
        resultados.push(result);
        totalMencionesNuevas += result.mencionesCreadas;
        totalClasificadas += result.fase3_clasificadas;

        if (!result.exito) {
          totalErrores++;
        }

        // Agregar detalles resumidos
        detalles.push(
          result.exito
            ? `${result.medioNombre}: ${result.fase1_links} links → ${result.fase2_seleccionadas} seleccionadas → ${result.mencionesCreadas} menciones (${result.htmlSizeKb}KB)`
            : `${result.medioNombre}: ERROR — ${result.error}`,
        );
      } catch (err) {
        totalErrores++;
        const errMsg = err instanceof Error ? err.message : String(err);
        detalles.push(`${medio.nombre}: ERROR INESPERADO — ${errMsg}`);
        console.error(`[capture] Error inesperado con ${medio.nombre}:`, err);
        resultados.push({
          medioNombre: medio.nombre,
          medioId: medio.id,
          exito: false,
          error: errMsg,
          fase1_links: 0,
          fase2_seleccionadas: 0,
          fase3_clasificadas: 0,
          mencionesCreadas: 0,
          detalles: [`ERROR INESPERADO: ${errMsg}`],
        });
      }
    }

    console.log(`[capture] Completado: ${medios.length} medios, ${totalMencionesNuevas} menciones, ${totalErrores} errores`);

    return NextResponse.json({
      modo: 'scraper_directo', // Indicador: NO usa Bing ni web_search
      mediosProcesados: medios.length,
      mencionesNuevas: totalMencionesNuevas,
      clasificadas: totalClasificadas,
      errores: totalErrores,
      resultados,
      detalles,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}

// ─── GET: Último log de captura ────────────────────────────────

export async function GET() {
  try {
    const lastLog = await db.capturaLog.findFirst({
      orderBy: { fecha: 'desc' },
      include: { Medio: { select: { nombre: true } } },
    });

    if (!lastLog) {
      return NextResponse.json({ message: 'No hay capturas registradas' });
    }

    return NextResponse.json(lastLog);
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}
