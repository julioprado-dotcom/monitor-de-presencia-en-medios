/**
 * Injector — ONION200 Indicadores
 * Inyecta indicadores relevantes en los prompts de GLM para enriquecer
 * los boletines con datos contextuales reales.
 */

import { db as prisma } from '@/lib/db'
import { type IndicadorContextual } from '@/types/bulletin'

// ─── Obtener indicadores relevantes para un eje temático ──────────

export async function getIndicadoresParaEje(
  ejeSlug: string,
  opciones?: {
    maximo?: number
    soloConfiables?: boolean
  }
): Promise<IndicadorContextual[]> {
  const maximo = opciones?.maximo ?? 5
  const soloConfiables = opciones?.soloConfiables ?? true

  // Buscar indicadores activos que incluyan este eje en su lista
  const indicadores = await prisma.indicador.findMany({
    where: {
      activo: true,
      ejesTematicos: { contains: ejeSlug },
    },
    orderBy: { orden: 'asc' },
  })

  if (indicadores.length === 0) return []

  // Para cada indicador, obtener su último valor
  const contextualizados: IndicadorContextual[] = []

  for (const ind of indicadores) {
    if (contextualizados.length >= maximo) break

    const ultimo = await prisma.indicadorValor.findFirst({
      where: { indicadorId: ind.id, confiable: soloConfiables ? true : undefined },
      orderBy: { fechaCaptura: 'desc' },
    })

    if (!ultimo) continue

    // Calcular variación vs período anterior
    const anterior = await prisma.indicadorValor.findFirst({
      where: { indicadorId: ind.id, fecha: { lt: ultimo.fecha } },
      orderBy: { fecha: 'desc' },
    })

    let variacion: string | undefined
    if (anterior && anterior.valor !== 0) {
      const pct = ((ultimo.valor - anterior.valor) / anterior.valor) * 100
      const sign = pct >= 0 ? '+' : ''
      variacion = `${sign}${pct.toFixed(1)}%`
    }

    // Verificar frescura del dato
    const ahora = new Date()
    const diffMs = ahora.getTime() - ultimo.fechaCaptura.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    let fresco = true

    if (ind.periodicidad === 'diaria' && diffHours > 48) fresco = false
    if (ind.periodicidad === 'semanal' && diffHours > 360) fresco = false // 15 días
    if (ind.periodicidad === 'mensual' && diffHours > 1080) fresco = false // 45 días

    contextualizados.push({
      nombre: ind.nombre,
      slug: ind.slug,
      valor: `${ultimo.valorTexto} (${ind.fuente})`,
      valorRaw: ultimo.valor,
      variacion,
      fechaDato: ultimo.fecha.toLocaleDateString('es-BO', {
        day: 'numeric',
        month: 'long',
        timeZone: 'America/La_Paz',
      }),
      fresco,
    })
  }

  // Ordenar: prioritarios por frescura y relevancia
  contextualizados.sort((a, b) => {
    // Primero los frescos
    if (a.fresco !== b.fresco) return a.fresco ? -1 : 1
    // Luego los que tienen variación
    if ((a.variacion !== undefined) !== (b.variacion !== undefined)) {
      return a.variacion !== undefined ? -1 : 1
    }
    return 0
  })

  return contextualizados.slice(0, maximo)
}

// ─── Obtener indicadores para múltiples ejes ──────────────────────

export async function getIndicadoresParaEjes(
  ejeSlugs: string[],
  opciones?: { maximo?: number }
): Promise<IndicadorContextual[]> {
  const maximo = opciones?.maximo ?? 5
  const todos: Map<string, IndicadorContextual> = new Map()

  for (const slug of ejeSlugs) {
    const indicadores = await getIndicadoresParaEje(slug, { maximo: 3 })
    for (const ind of indicadores) {
      if (!todos.has(ind.slug) && todos.size < maximo) {
        todos.set(ind.slug, ind)
      }
    }
  }

  return Array.from(todos.values())
}

// ─── Formatear bloque de indicadores para prompt GLM ──────────────

export function formatearIndicadoresPrompt(
  indicadores: IndicadorContextual[],
  fecha: Date
): string {
  if (indicadores.length === 0) return ''

  const fechaStr = fecha.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/La_Paz',
  })

  let bloque = `CONTEXTO DE INDICADORES ONION200 (datos al ${fechaStr}):\n`

  for (const ind of indicadores) {
    const linea = `- ${ind.nombre}: ${ind.valor}`
    const variacion = ind.variacion !== undefined ? ` (${ind.variacion})` : ''
    const frescura = !ind.fresco ? ' [DATO DESACTUALIZADO — verificar vigencia]' : ''
    bloque += `${linea}${variacion}${frescura}\n`
  }

  bloque += '\nINSTRUCCIÓN: Usa estos indicadores para enriquecer tu análisis. '
  bloque += 'Correlaciona las tendencias de los indicadores con las menciones mediáticas. '
  bloque += 'Si un indicador está marcado como desactualizado, mencionalo con cautela.\n'

  return bloque
}

// ─── Contador simple de tokens estimados ─────────────────────────

export function estimarTokens(texto: string): number {
  // Estimación: ~1 token por 4 caracteres en español
  return Math.ceil(texto.length / 4)
}
