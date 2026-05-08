// /api/scraping/phase — Control de fases de scraping
// GET  → estado actual de la fase + fuentes incluidas + progreso
// POST → acciones: iniciar_fase, detener, avanzar_fase, reiniciar, ejecutar_uno

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { enqueue } from '@/lib/jobs/queue'
import { ensureWorkerRunning } from '@/lib/jobs'

// ── Configuración de fases ─────────────────────────────────────────

interface FaseConfig {
  id: number
  nombre: string
  descripcion: string
  maxFuentes: number // 0 = todas
  filtros: { nivel?: string[]; activo?: boolean }
  criterioExito: string
}

const FASES: FaseConfig[] = [
  {
    id: 1,
    nombre: 'Prueba Mínima',
    descripcion: '4 fuentes principales — verificación de scraping',
    maxFuentes: 4,
    filtros: { nivel: ['1'] },
    criterioExito: 'Scrape responde + IA extrae menciones con sentido',
  },
  {
    id: 2,
    nombre: 'Ciclo Completo',
    descripcion: '10 fuentes — scrape → IA → mención → producto preview',
    maxFuentes: 10,
    filtros: { nivel: ['1'] },
    criterioExito: 'Producto preview generado correctamente con datos reales',
  },
  {
    id: 3,
    nombre: 'Producción Total',
    descripcion: 'Todas las fuentes, ejes, temas e indicadores',
    maxFuentes: 0,
    filtros: {},
    criterioExito: 'Sistema operativo en producción completa',
  },
]

// Estado en memoria (persiste mientras el servidor esté vivo)
let faseActual: number = 0 // 0 = sin fase activa
let scrapeEnProgreso: boolean = false
let scrapeActualIndex: number = 0
let scrapeTotalFuentes: number = 0
let scrapeFuentes: Array<{ id: string; medioId: string; nombre: string }> = []
let scrapeResultados: Array<{
  fuenteId: string
  nombre: string
  estado: 'pendiente' | 'scrapeando' | 'completado' | 'error'
  menciones: number
  error?: string
  duracionMs?: number
}> = []
let ultimoScrapeInicio: string | null = null

// ── GET: Estado actual ─────────────────────────────────────────────

export async function GET() {
  try {
    const fuentesActivas = await db.fuenteEstado.count({
      where: { activo: true },
    })

    const fuentesTotales = await db.fuenteEstado.count()

    // Obtener resultados del scrape en curso
    const resultadosActuales = scrapeResultados.length > 0
      ? scrapeResultados
      : []

    // Si hay fase activa, mostrar fuentes incluidas
    let fuentesIncluidas: Array<{
      id: string
      nombre: string
      nivel: string
      tipoCheck: string
      ultimoCheck: string | null
      totalCambios: number
    }> = []

    if (faseActual > 0) {
      const faseConfig = FASES[faseActual - 1]
      const whereClause: Record<string, unknown> = {}
      if (faseConfig.filtros.nivel?.length) {
        whereClause.medio = { nivel: { in: faseConfig.filtros.nivel } }
      }

      const fuentesRaw = await db.fuenteEstado.findMany({
        where: whereClause,
        orderBy: { medio: { nombre: 'asc' } },
        take: faseConfig.maxFuentes || 999,
        select: {
          id: true,
          medio: { select: { nombre: true, nivel: true } },
          tipoCheck: true,
          ultimoCheck: true,
          totalCambios: true,
        },
      })

      fuentesIncluidas = fuentesRaw.map(f => ({
        id: f.id,
        nombre: f.medio.nombre,
        nivel: f.medio.nivel,
        tipoCheck: f.tipoCheck,
        ultimoCheck: f.ultimoCheck ? String(f.ultimoCheck) : null,
        totalCambios: f.totalCambios,
      }))
    }

    return NextResponse.json({
      faseActual,
      faseConfig: faseActual > 0 ? FASES[faseActual - 1] : null,
      fasesDisponibles: FASES,
      fuentesActivas,
      fuentesTotales,
      scrapeEnProgreso,
      scrapeProgreso: scrapeTotalFuentes > 0
        ? { actual: scrapeActualIndex, total: scrapeTotalFuentes }
        : null,
      scrapeResultados: resultadosActuales,
      ultimoScrapeInicio,
      fuentesIncluidas,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[API /scraping/phase GET]', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ── POST: Acciones de fase ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, faseId } = body as { accion: string; faseId?: number }

    switch (accion) {
      // ── Iniciar una fase ──────────────────────────
      case 'iniciar_fase': {
        const targetFase = faseId || 1
        if (targetFase < 1 || targetFase > FASES.length) {
          return NextResponse.json(
            { error: `Fase inválida. Debe ser 1-${FASES.length}` },
            { status: 400 },
          )
        }

        if (scrapeEnProgreso) {
          return NextResponse.json(
            { error: 'Ya hay un scrape en progreso. Detenlo primero.' },
            { status: 409 },
          )
        }

        const faseConfig = FASES[targetFase - 1]

        // Desactivar todas las fuentes primero (limpieza)
        await db.fuenteEstado.updateMany({
          data: { activo: false },
        })

        // Activar solo las fuentes de esta fase
        const whereClause: Record<string, unknown> = {}
        if (faseConfig.filtros.nivel?.length) {
          whereClause.medio = { nivel: { in: faseConfig.filtros.nivel } }
        }

        const fuentes = await db.fuenteEstado.findMany({
          where: whereClause,
          include: { medio: { select: { nombre: true, nivel: true } } },
          orderBy: { medio: { nombre: 'asc' } },
          take: faseConfig.maxFuentes || 999,
        })

        if (fuentes.length === 0) {
          return NextResponse.json(
            { error: 'No hay fuentes disponibles para esta fase. Ejecuta /api/seed-fuentes primero.' },
            { status: 400 },
          )
        }

        // Activar las fuentes seleccionadas
        for (const fuente of fuentes) {
          await db.fuenteEstado.update({
            where: { id: fuente.id },
            data: { activo: true },
          })
        }

        faseActual = targetFase
        scrapeFuentes = fuentes.map(f => ({
          id: f.id,
          medioId: f.medioId,
          nombre: f.medio.nombre,
        }))
        scrapeResultados = fuentes.map(f => ({
          fuenteId: f.id,
          nombre: f.medio.nombre,
          estado: 'pendiente',
          menciones: 0,
        }))

        console.log(
          `[ScrapingPhase] Fase ${targetFase} iniciada: ${fuentes.length} fuentes activadas`,
        )
        console.log(
          `[ScrapingPhase] Fuentes: ${fuentes.map(f => f.medio.nombre).join(', ')}`,
        )

        return NextResponse.json({
          exito: true,
          mensaje: `Fase ${targetFase} "${faseConfig.nombre}" activada`,
          fuentesActivadas: fuentes.length,
          fuentes: fuentes.map(f => f.medio.nombre),
        })
      }

      // ── Detener scrape en progreso ────────────────
      case 'detener': {
        if (!scrapeEnProgreso) {
          return NextResponse.json(
            { error: 'No hay scrape en progreso' },
            { status: 400 },
          )
        }

        scrapeEnProgreso = false
        console.log('[ScrapingPhase] Scrape detenido por el administrador')

        return NextResponse.json({
          exito: true,
          mensaje: 'Scrape detenido',
          progreso: { actual: scrapeActualIndex, total: scrapeTotalFuentes },
        })
      }

      // ── Ejecutar scrape secuencial (un medio a la vez) ──
      case 'ejecutar': {
        // Asegurar que el worker esté corriendo antes de encolar
        ensureWorkerRunning()

        if (scrapeEnProgreso) {
          return NextResponse.json(
            { error: 'Ya hay un scrape en progreso' },
            { status: 409 },
          )
        }

        if (faseActual === 0) {
          return NextResponse.json(
            { error: 'No hay fase activa. Inicia una fase primero.' },
            { status: 400 },
          )
        }

        if (scrapeFuentes.length === 0) {
          return NextResponse.json(
            { error: 'No hay fuentes en la fase actual' },
            { status: 400 },
          )
        }

        // Iniciar scrape secuencial en background
        scrapeEnProgreso = true
        scrapeActualIndex = 0
        scrapeTotalFuentes = scrapeFuentes.length
        ultimoScrapeInicio = new Date().toISOString()

        // Resetear resultados
        scrapeResultados = scrapeFuentes.map(f => ({
          fuenteId: f.id,
          nombre: f.nombre,
          estado: 'pendiente',
          menciones: 0,
        }))

        // Ejecutar en background (no bloquear la respuesta)
        ejecutarScrapeSecuencial()

        return NextResponse.json({
          exito: true,
          mensaje: `Scrape secuencial iniciado para ${scrapeTotalFuentes} fuentes`,
          totalFuentes: scrapeTotalFuentes,
        })
      }

      // ── Ejecutar UN solo medio ────────────────────
      case 'ejecutar_uno': {
        const { fuenteId } = body as { fuenteId?: string }
        if (!fuenteId) {
          return NextResponse.json(
            { error: 'fuenteId requerido' },
            { status: 400 },
          )
        }

        // Verificar que la fuente existe
        const fuente = await db.fuenteEstado.findUnique({
          where: { id: fuenteId },
          include: { medio: true },
        })

        if (!fuente) {
          return NextResponse.json(
            { error: 'Fuente no encontrada' },
            { status: 404 },
          )
        }

        // Encolar check_fuente para esta fuente específica
        await enqueue({
          tipo: 'check_fuente',
          prioridad: 0, // Prioridad máxima para manual
          payload: {
            fuenteId: fuente.id,
            medioId: fuente.medioId,
          },
        })

        return NextResponse.json({
          exito: true,
          mensaje: `Check encolado para "${fuente.medio.nombre}" (prioridad P0)`,
          fuente: { id: fuente.id, nombre: fuente.medio.nombre },
        })
      }

      // ── Avanzar a la siguiente fase ───────────────
      case 'avanzar_fase': {
        if (faseActual >= FASES.length) {
          return NextResponse.json(
            { error: 'Ya estás en la última fase' },
            { status: 400 },
          )
        }

        const siguienteFase = faseActual + 1
        return NextResponse.json({
          exito: true,
          mensaje: `Listo para avanzar a Fase ${siguienteFase}: "${FASES[siguienteFase - 1].nombre}"`,
          siguienteFase,
          siguienteConfig: FASES[siguienteFase - 1],
        })
      }

      // ── Reiniciar (volver a fase 0) ───────────────
      case 'reiniciar': {
        // Detener scrape si está en progreso
        scrapeEnProgreso = false

        // Desactivar todas las fuentes
        await db.fuenteEstado.updateMany({
          data: { activo: false },
        })

        faseActual = 0
        scrapeActualIndex = 0
        scrapeTotalFuentes = 0
        scrapeFuentes = []
        scrapeResultados = []
        ultimoScrapeInicio = null

        console.log('[ScrapingPhase] Sistema reiniciado — todas las fuentes desactivadas')

        return NextResponse.json({
          exito: true,
          mensaje: 'Sistema reiniciado — todas las fuentes desactivadas',
        })
      }

      // ── Forzar check de una fuente (sin fases) ────
      case 'forzar_check': {
        const { fuenteId } = body as { fuenteId?: string }
        if (!fuenteId) {
          return NextResponse.json({ error: 'fuenteId requerido' }, { status: 400 })
        }

        const fuente = await db.fuenteEstado.findUnique({
          where: { id: fuenteId },
          include: { medio: true },
        })

        if (!fuente) {
          return NextResponse.json({ error: 'Fuente no encontrada' }, { status: 404 })
        }

        await enqueue({
          tipo: 'check_fuente',
          prioridad: 0,
          payload: { fuenteId: fuente.id, medioId: fuente.medioId },
        })

        return NextResponse.json({
          exito: true,
          mensaje: `Forzado check para "${fuente.medio.nombre}"`,
        })
      }

      default:
        return NextResponse.json(
          {
            error: `Acción no reconocida: ${accion}`,
            accionesValidas: [
              'iniciar_fase',
              'detener',
              'ejecutar',
              'ejecutar_uno',
              'avanzar_fase',
              'reiniciar',
              'forzar_check',
            ],
          },
          { status: 400 },
        )
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[API /scraping/phase POST]', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ── Scrape secuencial en background ────────────────────────────────

async function ejecutarScrapeSecuencial(): Promise<void> {
  const DELAY_ENTRE_FUENTES = 30_000 // 30 segundos entre fuentes (conservador)

  console.log(
    `[ScrapingPhase] Iniciando scrape secuencial: ${scrapeFuentes.length} fuentes, ${DELAY_ENTRE_FUENTES / 1000}s entre cada una`,
  )

  for (let i = 0; i < scrapeFuentes.length; i++) {
    // Verificar si fue detenido
    if (!scrapeEnProgreso) {
      console.log(`[ScrapingPhase] Detenido en fuente ${i + 1}/${scrapeFuentes.length}`)
      break
    }

    const fuente = scrapeFuentes[i]
    scrapeActualIndex = i + 1

    // Marcar como scrapeando
    const resultIdx = scrapeResultados.findIndex(r => r.fuenteId === fuente.id)
    if (resultIdx >= 0) {
      scrapeResultados[resultIdx].estado = 'scrapeando'
    }

    const startTime = Date.now()

    try {
      console.log(
        `[ScrapingPhase] (${i + 1}/${scrapeFuentes.length}) Encolando check para "${fuente.nombre}"...`,
      )

      // Encolar check_fuente (prioridad alta para que el worker lo tome ya)
      await enqueue({
        tipo: 'check_fuente',
        prioridad: 0 as const, // P0 — inmediato
        payload: {
          fuenteId: fuente.id,
          medioId: fuente.medioId,
        },
      })

      // Esperar a que el worker lo procese (polling cada 3s, timeout 120s)
      const procesado = await esperarProcesamiento(fuente.id, 120_000)

      if (resultIdx >= 0) {
        scrapeResultados[resultIdx].estado = procesado ? 'completado' : 'error'
        scrapeResultados[resultIdx].duracionMs = Date.now() - startTime
        if (!procesado) {
          scrapeResultados[resultIdx].error = 'Timeout esperando procesamiento'
        }
      }

      // Contar menciones creadas recientemente para esta fuente
      try {
        const medioId = fuente.medioId
        const mencionesRecientes = await db.mencion.count({
          where: {
            medioId,
            fechaCreacion: { gte: new Date(startTime) },
          },
        })
        if (resultIdx >= 0) {
          scrapeResultados[resultIdx].menciones = mencionesRecientes
        }
      } catch {
        // No crashear si falla el conteo
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[ScrapingPhase] Error en "${fuente.nombre}": ${msg}`)
      if (resultIdx >= 0) {
        scrapeResultados[resultIdx].estado = 'error'
        scrapeResultados[resultIdx].error = msg
        scrapeResultados[resultIdx].duracionMs = Date.now() - startTime
      }
    }

    // Delay entre fuentes (excepto la última)
    if (i < scrapeFuentes.length - 1 && scrapeEnProgreso) {
      console.log(
        `[ScrapingPhase] Esperando ${DELAY_ENTRE_FUENTES / 1000}s antes de la siguiente fuente...`,
      )
      await sleep(DELAY_ENTRE_FUENTES)
    }
  }

  scrapeEnProgreso = false
  console.log(
    `[ScrapingPhase] Scrape secuencial finalizado. ${scrapeResultados.filter(r => r.estado === 'completado').length}/${scrapeTotalFuentes} exitosos`,
  )
}

// Esperar a que un job check_fuente para esta fuente se complete
function esperarProcesamiento(
  fuenteId: string,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now()
    const interval = setInterval(async () => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        resolve(false)
        return
      }

      try {
        const pendingJob = await db.job.findFirst({
          where: {
            tipo: 'check_fuente',
            estado: { in: ['pendiente', 'en_progreso'] },
            payload: { contains: fuenteId },
          },
        })

        if (!pendingJob) {
          clearInterval(interval)
          resolve(true)
        }
      } catch {
        // Ignorar errores de polling, seguir esperando
      }
    }, 3000) // Polling cada 3 segundos

    // Cleanup por si algo sale mal
    setTimeout(() => {
      clearInterval(interval)
      resolve(false)
    }, timeoutMs + 5000)
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
