// Runner: check_fuente - Verificacion Check-First de una fuente de medios
// DECODEX Bolivia

import type { JobPayload, RunnerResult } from '../types'
import { checkFuente } from '../check-first/strategies'

export async function run(payload: JobPayload): Promise<RunnerResult> {
  const fuenteId = payload.fuenteId as string
  const medioId = payload.medioId as string | undefined

  if (!fuenteId) {
    return {
      success: false,
      error: 'check_fuente requiere fuenteId en el payload',
    }
  }

  try {
    const result = await checkFuente(fuenteId)

    // Si hubo cambio, devolver datos para que el scheduler encole un scrape
    if (result.cambiado) {
      return {
        success: true,
        data: {
          cambiado: true,
          fuenteId,
          medioId,
          tecnica: result.tecnica,
          detalle: result.detalle,
          datosNuevos: result.datosNuevos,
          responseTime: result.responseTime,
          tipoCheckUsado: result.tipoCheckUsado,
          // Indica al scheduler que debe encolar un scrape_fuente
          requiereScrape: true,
        },
      }
    }

    // Sin cambio
    return {
      success: true,
      data: {
        cambiado: false,
        fuenteId,
        medioId,
        tecnica: result.tecnica,
        detalle: result.detalle,
        responseTime: result.responseTime,
        tipoCheckUsado: result.tipoCheckUsado,
        requiereScrape: false,
      },
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `check_fuente fallo para fuente ${fuenteId}: ${msg}`,
    }
  }
}

// Registro automatico
const handler = run

export default { handler }
