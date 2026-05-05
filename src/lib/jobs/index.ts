// Inicializacion del sistema de Job Queue - DECODEX Bolivia
// Punto de entrada unico: initJobSystem()

import { startWorker, stopWorker, registerDefaultRunners, getWorkerStats } from './worker'
import { startHealthMonitor, stopHealthMonitor } from './health'
import { startScheduler, stopScheduler } from './scheduler'


let initialized = false

// Iniciar todo el sistema (llamar una sola vez)
export async function initJobSystem(): Promise<void> {
  if (initialized) return
  initialized = true

  console.log('[Jobs] Iniciando sistema de Job Queue...')

  // 1. Registrar runners por defecto (mantenimiento)
  registerDefaultRunners()

  // 2. Iniciar worker (background loop)
  startWorker()

  // 3. Iniciar health monitor (cada 60s)
  startHealthMonitor()

  // 4. Iniciar scheduler (node-cron para fuentes y boletines)
  await startScheduler()

  console.log('[Jobs] Sistema de Job Queue iniciado')
}

// API publica para registrar runners desde otros modulos
export { registerRunner } from './worker'

// API publica para obtener stats
export function getStats() {
  return {
    worker: getWorkerStats(),
  }
}

// Detener todo el sistema
export function shutdownJobSystem(): void {
  stopScheduler()
  stopHealthMonitor()
  stopWorker()
  initialized = false
  console.log('[Jobs] Sistema detenido')
}
