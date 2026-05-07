// Instrumentación del servidor — DECODEX Bolivia
// Se ejecuta UNA VEZ al arrancar Next.js
// Solo inicia el Job System (worker, scheduler, health monitor)

let setupDone = false

export async function register() {
  if (setupDone) return

  try {
    const { initJobSystem } = await import('@/lib/jobs')
    await initJobSystem()
    setupDone = true
    console.log('[Instrumentation] Job System iniciado')
  } catch (error) {
    console.error('[Instrumentation] Error iniciando Job System:', error)
  }
}
