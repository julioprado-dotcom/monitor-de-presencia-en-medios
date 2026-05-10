// Runner: connectivity_test — DECODEX Bolivia
// Test de conectividad con el mundo exterior.
// Se ejecuta automáticamente al reiniciar el servidor como primera tarea del worker.
// Intenta contactar las fuentes activas para verificar que hay internet.

import db from '@/lib/db'
import type { RunnerResult } from '../types'
import { CHECK_FIRST_CONFIG } from '../constants'

const TEST_TIMEOUT = CHECK_FIRST_CONFIG.timeoutMs

interface TestTarget {
  url: string
  nombre: string
}

async function testUrl(target: TestTarget): Promise<{
  ok: boolean
  status: number
  responseTime: number
  error?: string
}> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT)

    const response = await fetch(target.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': CHECK_FIRST_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const responseTime = Date.now() - start

    return {
      ok: response.ok || response.status === 304 || response.status === 301 || response.status === 302,
      status: response.status,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - start
    const msg = error instanceof Error
      ? (error.name === 'AbortError' ? 'Timeout' : error.message)
      : String(error)
    return { ok: false, status: 0, responseTime, error: msg }
  }
}

export async function run(_payload: Record<string, unknown>): Promise<RunnerResult> {
  console.log('[ConnectivityTest] Iniciando test de conectividad...')

  // Obtener URLs de fuentes activas para testear (max 5)
  const fuentes = await db.fuenteEstado.findMany({
    where: { activo: true, url: { not: '' } },
    select: { url: true, medio: { select: { nombre: true } } },
    take: 5,
    orderBy: { medio: { nombre: 'asc' } },
  })

  const targets: TestTarget[] = fuentes.map(f => ({
    url: f.url,
    nombre: f.medio.nombre,
  }))

  // Si no hay fuentes, testear URLs de referencia
  if (targets.length === 0) {
    targets.push(
      { url: 'https://www.google.com', nombre: 'Google' },
      { url: 'https://www.abi.bo', nombre: 'ABI (ref)' },
    )
  }

  // Testear en paralelo
  const results = await Promise.all(targets.map(t => testUrl(t)))

  const exitosos = results.filter(r => r.ok)
  const fallidos = results.filter(r => !r.ok)
  const avgResponseTime = exitosos.length > 0
    ? Math.round(exitosos.reduce((sum, r) => sum + r.responseTime, 0) / exitosos.length)
    : 0

  // Log detallado
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const t = targets[i]
    const icon = r.ok ? '✅' : '❌'
    console.log(
      `  ${icon} ${t.nombre}: ${r.status} (${r.responseTime}ms)` +
      (r.error ? ` — ${r.error}` : '')
    )
  }

  const conectado = exitosos.length > 0

  if (conectado) {
    console.log(
      `[ConnectivityTest] OK — ${exitosos.length}/${targets.length} alcanzados, ` +
      `avg ${avgResponseTime}ms` +
      (fallidos.length > 0 ? ` (${fallidos.length} fallidos)` : '')
    )
  } else {
    console.error(
      `[ConnectivityTest] FALLIDO — 0/${targets.length} alcanzados. ` +
      `Sin conectividad con el mundo exterior.`
    )
  }

  return {
    success: conectado,
    data: {
      testType: 'startup_connectivity',
      totalTargets: targets.length,
      exitosos: exitosos.length,
      fallidos: fallidos.length,
      avgResponseTimeMs: avgResponseTime,
      conectado,
      targets: targets.map((t, i) => ({
        nombre: t.nombre,
        url: t.url,
        ok: results[i].ok,
        status: results[i].status,
        responseTimeMs: results[i].responseTime,
        error: results[i].error,
      })),
    },
    error: conectado ? undefined : 'Sin conectividad — 0 sitios alcanzados',
  }
}
