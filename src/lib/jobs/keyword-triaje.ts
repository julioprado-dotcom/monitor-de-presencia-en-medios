// Triaje por keywords — Filtro local SIN IA, SIN LLM
// DECODEX Bolivia — Pipeline optimizado: Fase 2
//
// Compara título+lead contra diccionario local:
// - Nombres de 169 asambleistas
// - Keywords de 47 ejes temáticos
// - Keywords de indicadores
//
// Regla: prefiere falso positivo sobre falso negativo.
// Es más barato que el LLM clasifique una nota irrelevante a que pierda una relevante.

import db from '@/lib/db'
import type { NotaLink } from './link-extractor'

// ─── Interfaces ────────────────────────────────────────────────

export interface TriajeResult {
  url: string
  titulo: string
  lead: string
  match: boolean
  puntaje: number
  matchedPersonas: string[]      // nombres de asambleistas encontrados
  matchedKeywords: string[]       // keywords de ejes/indicadores encontrados
  matchedEjes: string[]           // slugs de ejes temáticos
  razon: string                   // por qué se seleccionó
}

// ─── Cache del diccionario (TTL 5 min — los datos config cambian poco) ──

interface DiccionarioCache {
  asambleistas: Map<string, string>    // "nombre normalizado" → "ID persona"
  keywords: Map<string, string[]>       // "keyword" → ["eje_slug1", "eje_slug2"]
  indicadores: Map<string, string>      // "keyword" → "indicador_slug"
  expiry: number
}

let diccionarioCache: DiccionarioCache | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// ─── Función principal ───────────────────────────────────────

/**
 * Triaje de notas por keyword matching local.
 * Recibe una lista de notas y retorna solo las que matchean.
 *
 * @param notas - Lista de notas con título, lead, url
 * @param opciones - Umbral mínimo de puntaje (default: 1)
 * @returns Notas que pasaron el triaje, ordenadas por puntaje descendente
 */
export async function trijarNotas(
  notas: NotaLink[],
  opciones?: { puntajeMinimo?: number },
): Promise<TriajeResult[]> {
  const puntajeMin = opciones?.puntajeMinimo ?? 1

  // Cargar diccionario (cacheado)
  const dict = await getDiccionario()

  // Texto normalizado rápido
  const normalizar = (s: string) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9áéíóúñü\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const resultados: TriajeResult[] = []

  for (const nota of notas) {
    const texto = normalizar(`${nota.titulo} ${nota.lead || ''}`)
    if (texto.length < 10) continue

    const matchedPersonas: string[] = []
    const matchedKeywords: string[] = []
    const matchedEjes = new Set<string>()
    let puntaje = 0

    // 1. Buscar asambleistas (puntaje alto — nombre completo)
    for (const [nombreNorm, personaId] of dict.asambleistas) {
      if (texto.includes(nombreNorm)) {
        matchedPersonas.push(nombreNorm)
        puntaje += 3 // alta prioridad: mención directa a asambleista
      } else {
        // Buscar apellido (2+ palabras del nombre)
        const partes = nombreNorm.split(' ')
        if (partes.length >= 2) {
          // Tomar las 2-3 palabras más significativas del apellido
          const apellidos = partes.slice(1).join(' ')
          if (apellidos.length >= 6 && texto.includes(apellidos)) {
            matchedPersonas.push(nombreNorm)
            puntaje += 2 // prioridad media: solo apellido coincide
          }
        }
      }
    }

    // 2. Buscar keywords de ejes temáticos
    for (const [keyword, ejes] of dict.keywords) {
      if (texto.includes(keyword)) {
        matchedKeywords.push(keyword)
        puntaje += 1
        for (const eje of ejes) {
          matchedEjes.add(eje)
        }
      }
    }

    // 3. Buscar keywords de indicadores
    for (const [keyword, slug] of dict.indicadores) {
      if (texto.includes(keyword)) {
        matchedKeywords.push(keyword)
        puntaje += 1 // misma prioridad que ejes
      }
    }

    // Determinar razón
    let razon = ''
    if (matchedPersonas.length > 0) {
      razon = `Asambleista: ${matchedPersonas[0]}`
    } else if (matchedKeywords.length > 0) {
      razon = `Keywords: ${matchedKeywords.slice(0, 3).join(', ')}`
    }

    resultados.push({
      url: nota.url,
      titulo: nota.titulo,
      lead: nota.lead || '',
      match: puntaje >= puntajeMin,
      puntaje,
      matchedPersonas,
      matchedKeywords,
      matchedEjes: [...matchedEjes],
      razon,
    })
  }

  // Filtrar por puntaje mínimo y ordenar descendente
  return resultados
    .filter(r => r.match)
    .sort((a, b) => b.puntaje - a.puntaje)
}

// ─── Cargar diccionario ──────────────────────────────────────

async function getDiccionario(): Promise<{
  asambleistas: Map<string, string>
  keywords: Map<string, string[]>
  indicadores: Map<string, string>
}> {
  // Retornar cache si es válido
  if (diccionarioCache && diccionarioCache.expiry > Date.now()) {
    return {
      asambleistas: diccionarioCache.asambleistas,
      keywords: diccionarioCache.keywords,
      indicadores: diccionarioCache.indicadores,
    }
  }

  // Consultas en paralelo
  const [personas, ejes] = await Promise.all([
    db.persona.findMany({
      where: { activa: true },
      select: { id: true, nombre: true },
    }),
    db.ejeTematico.findMany({
      where: { activo: true },
      select: { id: true, slug: true, keywords: true },
    }),
  ])

  // 1. Construir mapa de asambleistas (nombre normalizado → ID)
  const asambleistas = new Map<string, string>()
  for (const p of personas) {
    const norm = normalizarNombre(p.nombre)
    if (norm.length >= 3) {
      asambleistas.set(norm, p.id)
    }
  }

  // 2. Construir mapa de keywords → ejes
  const keywords = new Map<string, string[]>()
  for (const eje of ejes) {
    if (!eje.keywords) continue
    const kws = eje.keywords.split(',').map(k => normalizarNombre(k.trim())).filter(k => k.length >= 3)
    for (const kw of kws) {
      const existing = keywords.get(kw) || []
      existing.push(eje.slug)
      keywords.set(kw, existing)
    }
  }

  // 3. Construir mapa de keywords de indicadores
  const indicadores = new Map<string, string>()
  // Indicadores clave que buscamos en notas (sin necesidad de DB — hardcodeados por ahora)
  const indicadoresFijos = [
    { keywords: ['tipo de cambio', 'dolar', 'dolar oficial', 'dolar paralelo', 'brecha cambiaria', 'devaluacion', 'devaluación'], slug: 'tc-oficial' },
    { keywords: ['reservas internacionales', 'reservas netas', 'rin', 'divisas'], slug: 'reservas-internacionales' },
    { keywords: ['inflacion', 'ipc', 'indice de precios', 'canasta familiar'], slug: 'inflacion' },
    { keywords: ['litio', 'carbonato de litio', 'ylb', 'salar de uyuni', 'baterias'], slug: 'litio' },
    { keywords: ['gas natural', 'gnp', 'exportacion de gas', 'ypfb', 'volumen de gas'], slug: 'gas-natural' },
    { keywords: ['zinc', 'estaño', 'plata', 'lme', 'precio del zinc', 'precio minero', 'comibol', 'huanuni'], slug: 'precio-minero' },
    { keywords: ['deficit fiscal', 'presupuesto', 'tgn', 'gasto fiscal', 'financiamiento'], slug: 'presupuesto-fiscal' },
    { keywords: ['pib', 'producto interno bruto', 'crecimiento economico', 'recesion'], slug: 'pib' },
  ]

  for (const ind of indicadoresFijos) {
    for (const kw of ind.keywords) {
      indicadores.set(normalizarNombre(kw), ind.slug)
    }
  }

  // Guardar en cache
  diccionarioCache = {
    asambleistas,
    keywords,
    indicadores,
    expiry: Date.now() + CACHE_TTL,
  }

  console.log(`[Triaje] Diccionario cargado: ${asambleistas.size} asambleistas, ${keywords.size} keywords, ${indicadores.size} indicadores`)

  return { asambleistas, keywords, indicadores }
}

// ─── Helpers ─────────────────────────────────────────────────

function normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9áéíóúñü\s]/g, '') // solo letras y números
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Invalidar cache del diccionario (para pruebas o cuando se actualizan datos config)
 */
export function invalidarCacheDiccionario(): void {
  diccionarioCache = null
}
