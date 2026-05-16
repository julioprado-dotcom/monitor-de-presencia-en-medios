// Instrumentacion del servidor — DECODEX Bolivia
// Se ejecuta UNA VEZ al arrancar Next.js
//
// v2: Job system reactivado en modo ligero.
// - Scheduler + Worker activos sin Health Monitor (causaba OOM).
// - Cold-start bypass: fuerza un check para fuentes activas con Capa 0
//   para evitar el death spiral de 24h sin ultimoCheckOk.

let setupDone = false

export async function register() {
  if (setupDone) return

  try {
    // 1. Verificar DB
    const { db } = await import('@/lib/db')
    const [personas, medios, fuentes, ejes, indicadores] = await Promise.all([
      db.persona.count(), db.medio.count(), db.fuenteEstado.count(),
      db.ejeTematico.count(), db.indicador.count(),
    ])
    const dbPath = (process.env.DATABASE_URL || '').replace(/^file:/, '')
    console.log(
      `[Instrumentation] DB: "${dbPath}" — ` +
      `${personas} personas, ${medios} medios, ${fuentes} fuentes, ` +
      `${ejes} ejes, ${indicadores} indicadores`
    )

    // 2. Job system — MODO LIGERO (sin Health Monitor)
    // El health monitor consumía memoria y causaba OOM.
    // El scheduler + worker productivo son seguros en 1vCPU/1GB.
    const { startScheduler, rescheduleAll } = await import('@/lib/jobs/scheduler')
    const { startWorkerIdle, startWorker, registerDefaultRunners } = await import('@/lib/jobs/worker')
    const { WARMUP_CONFIG } = await import('@/lib/jobs/constants')

    // 2a. Registrar runners
    registerDefaultRunners()
    console.log('[Instrumentation] Runners registrados')

    // 2b. Cold-start bypass: resetear ultimoCheckOk de fuentes activas
    // que lleven >24h sin check para evitar que el scheduler las ignore (Capa 0).
    // Esto NO cambia el estado de la fuente, solo actualiza el timestamp
    // para que determinarCapa() las considere Capa 1+ y las programe.
    try {
      const fuentesStale = await db.fuenteEstado.findMany({
        where: {
          activo: true,
          OR: [
            { ultimoCheckOk: null },
            { ultimoCheckOk: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
          ],
        },
        select: { id: true, medioId: true },
      })

      if (fuentesStale.length > 0) {
        console.log(`[Instrumentation] Cold-start bypass: reseteando ${fuentesStale.length} fuentes stale (capa 0 → fuerza check)`)
        await db.fuenteEstado.updateMany({
          where: { id: { in: fuentesStale.map(f => f.id) } },
          data: {
            ultimoCheckOk: new Date(),
            fallosConsecutivos: 0,
            checksSinCambio: 0,
          },
        })
      }
    } catch (bypassErr) {
      console.error('[Instrumentation] Cold-start bypass falló (no fatal):', bypassErr)
    }

    // 2c. Iniciar scheduler + worker
    await startScheduler()
    console.log('[Instrumentation] Scheduler iniciado')

    startWorkerIdle()
    console.log('[Instrumentation] Worker en modo IDLE (warmup)')

    // 2d. Activar worker productivo después del warmup
    setTimeout(() => {
      startWorker()
      console.log('[Instrumentation] Worker productivo activado')
    }, WARMUP_CONFIG.delayMs)

    // 2e. Forzar checks inmediatos al arrancar (cold-start kick)
    // Encolar check_fuente para las primeras 5 fuentes activas.
    setTimeout(async () => {
      try {
        const { enqueue } = await import('@/lib/jobs/queue')
        const fuentesKick = await db.fuenteEstado.findMany({
          where: { activo: true },
          include: { Medio: { select: { nombre: true } } },
          orderBy: { totalMenciones: 'desc' },
          take: 5,
        })
        for (const f of fuentesKick) {
          await enqueue({
            tipo: 'check_fuente',
            prioridad: 1,
            payload: { fuenteId: f.id, medioId: f.medioId },
          })
          console.log(`[Instrumentation] Cold-start kick: check_fuente encolado para ${f.Medio?.nombre || f.medioId}`)
        }
        console.log(`[Instrumentation] Cold-start kick: ${fuentesKick.length} checks encolados`)
      } catch (kickErr) {
        console.error('[Instrumentation] Cold-start kick falló (no fatal):', kickErr)
      }
    }, WARMUP_CONFIG.delayMs + 2000)

    console.log('[Instrumentation] Sistema listo (scheduler + worker activos)')
    setupDone = true
  } catch (error) {
    console.error('[Instrumentation] Error en inicio:', error)
  }
}
