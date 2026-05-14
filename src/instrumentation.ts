// Instrumentacion del servidor — DECODEX Bolivia
// Se ejecuta UNA VEZ al arrancar Next.js
//
// NOTA: Job system desactivado temporalmente para estabilidad del servidor.
// El health monitor y worker IDLE consumen memoria y causan OOM kills.
// Las APIs del dashboard siguen funcionando sin el job system.

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

    // 2. Job system — DESACTIVADO temporalmente
    // El worker IDLE + health monitor causan OOM en este entorno.
    // Reactivar cuando el entorno tenga más memoria disponible.
    console.log('[Instrumentation] Job system desactivado (modo API-only)')
    console.log('[Instrumentation] Sistema listo para servir APIs')

    setupDone = true
  } catch (error) {
    console.error('[Instrumentation] Error en inicio:', error)
  }
}
