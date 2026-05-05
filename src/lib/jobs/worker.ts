// Worker - loop de ejecucion con backpressure - DECODEX Bolivia
// Un solo worker que procesa jobs de uno en uno

import { dequeue, complete, fail } from './queue'
import { WORKER_CONFIG } from './constants'
import type { JobPayload, JobTipo, RunnerResult, RunnerFn } from './types'
import { run as runCheckFuente } from './runners/check-fuente'
import { run as runCheckIndicador } from './runners/check-indicador'
import { run as runScrapeFuente } from './runners/scrape-fuente'
import { run as runCaptureIndicador } from './runners/capture-indicador'
import { run as runGenerarBoletin } from './runners/generar-boletin'
import { run as runEnviarEntrega } from './runners/enviar-entrega'
import { run as runVerificarEnlaces } from './runners/verificar-enlaces'
import { run as runMantenimiento } from './runners/mantenimiento'

// Registro de runners por tipo de job
const runners = new Map<string, RunnerFn>()

// Registrar un runner
export function registerRunner(tipo: JobTipo, fn: RunnerFn): void {
  runners.set(tipo, fn)
}

// Obtener un runner
export function getRunner(tipo: JobTipo): RunnerFn | undefined {
  return runners.get(tipo)
}

// Estado del worker
let running = false
let startTime: Date | null = null
let jobsCompleted = 0
let jobsFailed = 0
let lastJobTime: Date | null = null

// Estadisticas del worker
export function getWorkerStats() {
  const uptime = startTime
    ? Math.floor((Date.now() - startTime.getTime()) / 1000)
    : 0
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = uptime % 60

  const jobsPerHour = uptime > 0
    ? Math.round(((jobsCompleted + jobsFailed) / uptime) * 3600)
    : 0

  return {
    running,
    uptime: uptime > 0 ? `${hours}h ${minutes}m ${seconds}s` : '0s',
    jobsCompleted,
    jobsFailed,
    jobsPerHour,
    startTime,
    lastJobTime,
  }
}

// Iniciar el worker (background, no bloquea el hilo principal)
export function startWorker(): void {
  if (running) {
    console.log('[Worker] Ya esta corriendo')
    return
  }
  running = true
  startTime = new Date()
  console.log('[Worker] Iniciado')

  // Ejecutar en background
  workerLoop().catch(err => {
    console.error('[Worker] Error fatal:', err)
    running = false
  })
}

// Detener el worker
export function stopWorker(): void {
  running = false
  console.log('[Worker] Detenido')
}

// Loop principal
async function workerLoop(): Promise<void> {
  while (running) {
    try {
      const job = await dequeue()

      if (!job) {
        // No hay jobs pendientes - esperar antes de consultar de nuevo
        await sleep(WORKER_CONFIG.pollIntervalMs)
        continue
      }

      const jobId = job.id as string
      const tipo = job.tipo as JobTipo
      const payload = job.payload as JobPayload

      console.log(`[Worker] Ejecutando job ${jobId} (${tipo}) prioridad=${job.prioridad}`)

      // Buscar runner registrado
      const runner = getRunner(tipo)
      if (!runner) {
        await fail(jobId, `No existe runner para tipo: ${tipo}`)
        jobsFailed++
        console.warn(`[Worker] Sin runner para ${tipo}`)
        await sleep(WORKER_CONFIG.delayMs)
        continue
      }

      // Ejecutar con timeout implicito por el fetch del check-first
      try {
        const result: RunnerResult = await runner(payload)

        if (result.success) {
          await complete(jobId, result.data ?? {})
          jobsCompleted++
          lastJobTime = new Date()
          console.log(`[Worker] Job ${jobId} completado`)
        } else {
          await fail(jobId, result.error ?? 'Error desconocido')
          jobsFailed++
          console.error(`[Worker] Job ${jobId} fallido: ${result.error}`)
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        await fail(jobId, msg)
        jobsFailed++
        console.error(`[Worker] Job ${jobId} exception: ${msg}`)
      }

      // Backpressure: esperar entre jobs
      await sleep(WORKER_CONFIG.delayMs)
    } catch (error: unknown) {
      // Error del sistema (no del job)
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[Worker] Error en loop: ${msg}`)
      await sleep(WORKER_CONFIG.errorBackoffMs)
    }
  }

  console.log('[Worker] Loop terminado')
}

// Registrar todos los runners del sistema
export function registerDefaultRunners(): void {
  // Check-First runners (Capa 2)
  registerRunner('check_fuente', runCheckFuente)
  registerRunner('check_indicador', runCheckIndicador)

  // Captura runners (Capa 1)
  registerRunner('scrape_fuente', runScrapeFuente)
  registerRunner('capture_indicador', runCaptureIndicador)

  // Productos ONION200
  registerRunner('generar_boletin', runGenerarBoletin)
  registerRunner('enviar_entrega', runEnviarEntrega)

  // Verificacion y mantenimiento
  registerRunner('verificar_enlaces', runVerificarEnlaces)
  registerRunner('mantenimiento', runMantenimiento)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
