// Runner: mantenimiento - Tareas de mantenimiento periodico
// DECODEX Bolivia
// Se ejecuta diariamente a las 04:00 AM via scheduler

import db from '@/lib/db'
import { purgeCompleted, purgeFailed } from '../queue'
import { batchDegradar } from '../frequency/adapter'
import { batchRecalcularHorarios } from '../histogram/tracker'
import type { JobPayload, RunnerResult, MantenimientoResult, TareaMantenimiento } from '../types'
import { QUEUE_LIMITS } from '../constants'

export async function run(payload: JobPayload): Promise<RunnerResult> {
  const tareas = (payload.tareas as TareaMantenimiento[]) || [
    'recalcular_horarios',
    'degradar_fuentes',
    'limpiar_jobs',
  ]

  const startTime = Date.now()
  const resultados: MantenimientoResult[] = []

  for (const tarea of tareas) {
    try {
      const resultado = await ejecutarTarea(tarea)
      resultados.push(resultado)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      resultados.push({ tarea, completada: false, detalle: `Error: ${msg}` })
    }
  }

  const responseTime = Date.now() - startTime

  return {
    success: true,
    data: {
      tareasEjecutadas: resultados.length,
      tareasCompletadas: resultados.filter(r => r.completada).length,
      resultados,
      responseTime,
    },
  }
}

// Ejecutar una tarea individual de mantenimiento
async function ejecutarTarea(tarea: TareaMantenimiento): Promise<MantenimientoResult> {
  switch (tarea) {
    case 'recalcular_horarios': {
      const count = await batchRecalcularHorarios()
      return {
        tarea,
        completada: true,
        detalle: `Horarios recalculados para ${count} fuentes`,
      }
    }

    case 'degradar_fuentes': {
      const count = await batchDegradar()
      return {
        tarea,
        completada: true,
        detalle: `${count} fuentes degradadas por inactividad`,
      }
    }

    case 'limpiar_logs': {
      // Limpiar captura logs antiguos (90 dias por defecto)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - QUEUE_LIMITS.capturaLogRetentionDays)
      const result = await db.capturaLog.deleteMany({
        where: { fecha: { lt: cutoff } },
      })
      return {
        tarea,
        completada: true,
        detalle: `${result.count} logs de captura eliminados (> ${QUEUE_LIMITS.capturaLogRetentionDays} dias)`,
      }
    }

    case 'purge_menciones': {
      // Limpiar texto de menciones antiguas (6 meses)
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - QUEUE_LIMITS.mencionTextRetentionMonths)
      const menciones = await db.mencion.findMany({
        where: { fechaCaptura: { lt: cutoff } },
        select: { id: true },
        take: 500, // batch
      })
      for (const m of menciones) {
        await db.mencion.update({
          where: { id: m.id },
          data: { textoCompleto: '', comentariosResumen: '' },
        })
      }
      return {
        tarea,
        completada: true,
        detalle: `Texto limpiado en ${menciones.length} menciones (> ${QUEUE_LIMITS.mencionTextRetentionMonths} meses)`,
      }
    }

    case 'limpiar_jobs': {
      const completados = await purgeCompleted(QUEUE_LIMITS.jobRetentionDays)
      const fallidos = await purgeFailed(7)
      return {
        tarea,
        completada: true,
        detalle: `${completados} completados y ${fallidos} fallidos purgados`,
      }
    }

    case 'recalcular_scheduler': {
      // Reprogramar todas las fuentes sin reiniciar el worker
      const { rescheduleAll } = await import('../scheduler')
      await rescheduleAll()
      return {
        tarea,
        completada: true,
        detalle: 'Scheduler reprogramado con horarios actualizados',
      }
    }

    default: {
      return { tarea, completada: false, detalle: `Tarea desconocida: ${tarea}` }
    }
  }
}

const handler = run

export default { handler }
