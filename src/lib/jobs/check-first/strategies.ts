// Dispatcher de estrategias Check-First - DECODEX Bolivia
// Elige la estrategia correcta (rss, etag, fingerprint, api) segun la fuente

import db from '@/lib/db'
import { CHECK_FIRST_CONFIG, TIPO_CHECK_PATTERNS } from '../constants'
import type { CheckResult, TipoCheck } from '../types'
import { checkRSS } from './rss'
import { checkETag } from './etag'
import { checkFingerprint } from './fingerprint'

// Auto-detectar tipo de check por URL
export function detectarTipoCheck(url: string): TipoCheck {
  for (const { patron, tipo } of TIPO_CHECK_PATTERNS) {
    if (patron.test(url)) return tipo
  }
  // Default: intentar ETag/HEAD primero (mas ligero)
  return 'head'
}

// Ejecutar check de una fuente (usa el tipoCheck configurado en FuenteEstado)
export async function checkFuente(fuenteId: string): Promise<CheckResult & {
  responseTime?: number
  tipoCheckUsado: TipoCheck
  datosActualizacion?: Record<string, unknown>
}> {
  // Obtener estado de la fuente
  const fuente = await db.fuenteEstado.findUnique({
    where: { id: fuenteId },
    include: { medio: true },
  })

  if (!fuente) {
    return {
      cambiado: false,
      tecnica: 'none',
      detalle: `FuenteEstado ${fuenteId} no encontrado`,
      error: 'fuente_no_encontrada',
      tipoCheckUsado: 'head' as TipoCheck,
    }
  }

  if (!fuente.activo) {
    return {
      cambiado: false,
      tecnica: 'none',
      detalle: `Fuente ${fuente.medio.nombre} inactiva`,
      tipoCheckUsado: fuente.tipoCheck as TipoCheck,
    }
  }

  // Verificar tiempo minimo entre checks
  if (fuente.ultimoCheck) {
    const minutosDesdeUltimo = (Date.now() - fuente.ultimoCheck.getTime()) / 60000
    if (minutosDesdeUltimo < CHECK_FIRST_CONFIG.minTimeBetweenChecks) {
      return {
        cambiado: false,
        tecnica: 'none',
        tipoCheckUsado: fuente.tipoCheck as TipoCheck,
        detalle: `Check demasiado reciente (${Math.round(minutosDesdeUltimo)} min)`,
      }
    }
  }

  const tipoCheck = (fuente.tipoCheck || detectarTipoCheck(fuente.url)) as TipoCheck
  const url = fuente.url

  let result: CheckResult & { responseTime?: number; datosActualizacion?: Record<string, unknown> }
  const datosActualizacion: Record<string, unknown> = { tipoCheck }

  try {
    switch (tipoCheck) {
      case 'rss': {
        const rssResult = await checkRSS(url, fuente.ultimosIds, fuente.etag || undefined)
        result = {
          cambiado: rssResult.cambiado,
          tecnica: rssResult.tecnica,
          detalle: rssResult.detalle,
          datosNuevos: rssResult.datosNuevos,
          responseTime: rssResult.responseTime,
        }
        // Guardar IDs actualizados
        datosActualizacion.ultimosIds = JSON.stringify(rssResult.ultimosIdsActualizados)
        break
      }

      case 'head': {
        const etagResult = await checkETag(
          url,
          fuente.etag || undefined,
          fuente.lastModified || undefined,
        )
        result = {
          cambiado: etagResult.cambiado,
          tecnica: etagResult.tecnica,
          detalle: etagResult.detalle,
          responseTime: etagResult.responseTime,
        }
        if (etagResult.newETag) datosActualizacion.etag = etagResult.newETag
        if (etagResult.newLastModified) datosActualizacion.lastModified = etagResult.newLastModified
        break
      }

      case 'fingerprint': {
        const fpResult = await checkFingerprint(url, fuente.fingerprint || undefined)
        result = {
          cambiado: fpResult.cambiado,
          tecnica: fpResult.tecnica,
          detalle: fpResult.detalle,
          responseTime: fpResult.responseTime,
        }
        if (fpResult.newFingerprint) datosActualizacion.fingerprint = fpResult.newFingerprint
        break
      }

      case 'api': {
        // Para APIs, usamos fingerprint como fallback
        const fpResult = await checkFingerprint(url, fuente.fingerprint || undefined)
        result = {
          cambiado: fpResult.cambiado,
          tecnica: 'api',
          detalle: fpResult.detalle,
          responseTime: fpResult.responseTime,
        }
        if (fpResult.newFingerprint) datosActualizacion.fingerprint = fpResult.newFingerprint
        break
      }

      default: {
        result = {
          cambiado: false,
          tecnica: 'none',
          detalle: `Tipo de check desconocido: ${tipoCheck}`,
        }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    result = {
      cambiado: false,
      tecnica: tipoCheck,
      detalle: `Error: ${msg}`,
      error: msg,
    }
    datosActualizacion.error = msg
  }

  // Actualizar FuenteEstado con los resultados del check
  await updateFuenteEstado(fuente, result, datosActualizacion)

  return {
    ...result,
    tipoCheckUsado: tipoCheck,
    datosActualizacion,
  }
}

// Actualizar FuenteEstado despues de un check
async function updateFuenteEstado(
  fuente: { id: string; totalChecks: number; checksSinCambio: number; error: string },
  result: CheckResult,
  datosActualizacion: Record<string, unknown>,
): Promise<void> {
  const now = new Date()

  // Datos para actualizar siempre despues de un check
  const updateData: Record<string, unknown> = {
    ultimoCheck: now,
    totalChecks: { increment: 1 },
    responseTime: result.responseTime || 0,
  }

  // Limpiar error previo si el check fue exitoso
  if (!result.error) {
    updateData.error = ''
  } else {
    updateData.error = result.error
  }

  // Si hubo cambio: resetear contador, actualizar ultimo cambio
  if (result.cambiado) {
    updateData.checksSinCambio = 0
    updateData.ultimoCambio = now
    updateData.totalCambios = { increment: 1 }
  } else {
    // Sin cambio: incrementar contador
    updateData.checksSinCambio = { increment: 1 }
  }

  // Campos especificos de la estrategia
  for (const [key, value] of Object.entries(datosActualizacion)) {
    if (key !== 'tipoCheck' && value !== undefined) {
      updateData[key] = value
    }
  }

  await db.fuenteEstado.update({
    where: { id: fuente.id },
    data: updateData,
  })
}
