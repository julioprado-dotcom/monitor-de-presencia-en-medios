// Capturer Tier 1 - Indicadores macroeconomicos de alta prioridad
// DECODEX Bolivia
// Stub funcional: la implementacion completa se desarrolla en modulo dedicado

import db from '@/lib/db'

export interface CapturaExitosa {
  slug: string
  valorTexto: string
  confiable: boolean
  metadata?: string
}

export interface CapturaFallida {
  slug: string
  error: string
  metadata: string
}

export interface CapturaTier1Result {
  exitosos: CapturaExitosa[]
  fallidos: CapturaFallida[]
  total: number
}

// Lista de indicadores Tier 1 (se leen de la DB)
const TIER1_SLUGS = [
  'tc-oficial-bcb',
  'tc-paralelo',
  'rin-bcb',
  'lme-cobre',
  'lme-zinc',
  'lme-estano',
  'lme-plata',
  'reservas-internacionales',
  'ipc-ine',
]

// Capturar todos los indicadores Tier 1
// En produccion: fetch real desde BCB, LME, etc.
export async function capturarTier1(): Promise<CapturaTier1Result> {
  const exitosos: CapturaExitosa[] = []
  const fallidos: CapturaFallida[] = []

  for (const slug of TIER1_SLUGS) {
    try {
      const indicador = await db.indicador.findUnique({
        where: { slug },
      })

      if (!indicador || !indicador.activo) {
        fallidos.push({ slug, error: 'Inactivo o no encontrado', metadata: 'skip' })
        continue
      }

      // En produccion: fetch real desde la URL del indicador
      // Por ahora, devolver el ultimo valor conocido de la DB
      const ultimoValor = await db.indicadorValor.findFirst({
        where: { indicadorId: indicador.id },
        orderBy: { fechaCaptura: 'desc' },
      })

      if (ultimoValor) {
        exitosos.push({
          slug,
          valorTexto: ultimoValor.valorTexto || ultimoValor.valor.toFixed(indicador.formatoNumero),
          confiable: ultimoValor.confiable,
        })
      } else {
        fallidos.push({
          slug,
          error: 'Sin valores previos',
          metadata: 'no_data',
        })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      fallidos.push({ slug, error: msg, metadata: 'exception' })
    }
  }

  return {
    exitosos,
    fallidos,
    total: exitosos.length + fallidos.length,
  }
}

// Seed de indicadores macroeconomicos en la DB
// Usado por POST /api/seed para crear registros iniciales
export async function seedIndicadores(): Promise<number> {
  const INDICADORES_CUANTITATIVOS = [
    // === TIER 1: Implementacion inmediata ===
    {
      nombre: 'Tipo de Cambio Oficial BCB', slug: 'tc-oficial-bcb',
      categoria: 'monetario', tipo: 'cuantitativo', fuente: 'Banco Central de Bolivia',
      url: 'https://www.bcb.gob.bo/', periodicidad: 'diaria',
      unidad: 'Bs/USD', formatoNumero: 2, orden: 1, tier: 1,
      ejesTematicos: 'economia,politica-economica,relaciones-internacionales',
      notas: 'Tipo de cambio oficial publicado por el BCB',
    },
    {
      nombre: 'Tipo de Cambio Paralelo', slug: 'tc-paralelo',
      categoria: 'monetario', tipo: 'cuantitativo', fuente: 'Investing.com / mercado paralelo',
      url: 'https://www.investing.com/', periodicidad: 'diaria',
      unidad: 'Bs/USD', formatoNumero: 2, orden: 2, tier: 1,
      ejesTematicos: 'economia,politica-economica',
      notas: 'Tipo de cambio del mercado paralelo/paralelismo',
    },
    {
      nombre: 'Reservas Internacionales Netas', slug: 'rin-bcb',
      categoria: 'monetario', tipo: 'cuantitativo', fuente: 'Banco Central de Bolivia',
      url: 'https://www.bcb.gob.bo/', periodicidad: 'semanal',
      unidad: 'USD MM', formatoNumero: 0, orden: 3, tier: 1,
      ejesTematicos: 'economia,politica-economica,relaciones-internacionales',
      notas: 'Reservas Internacionales Netas del BCB',
    },
    {
      nombre: 'LME Cobre', slug: 'lme-cobre',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'London Metal Exchange',
      url: 'https://www.lme.com/', periodicidad: 'diaria',
      unidad: 'USD/ton', formatoNumero: 2, orden: 4, tier: 1,
      ejesTematicos: 'mineria,medio-ambiente',
      notas: 'Cotizacion del cobre en LME - referencia para exportaciones bolivianas',
    },
    {
      nombre: 'LME Zinc', slug: 'lme-zinc',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'London Metal Exchange',
      url: 'https://www.lme.com/', periodicidad: 'diaria',
      unidad: 'USD/ton', formatoNumero: 2, orden: 5, tier: 1,
      ejesTematicos: 'mineria,medio-ambiente',
      notas: 'Cotizacion del zinc en LME - referencia para exportaciones bolivianas',
    },
    {
      nombre: 'LME Estano', slug: 'lme-estano',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'London Metal Exchange',
      url: 'https://www.lme.com/', periodicidad: 'diaria',
      unidad: 'USD/ton', formatoNumero: 2, orden: 6, tier: 1,
      ejesTematicos: 'mineria,medio-ambiente,relaciones-internacionales',
      notas: 'Cotizacion del estano en LME - mineral estrategico boliviano',
    },
    {
      nombre: 'LME Plata', slug: 'lme-plata',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'London Metal Exchange',
      url: 'https://www.lme.com/', periodicidad: 'diaria',
      unidad: 'USD/ton', formatoNumero: 2, orden: 7, tier: 1,
      ejesTematicos: 'mineria,medio-ambiente,relaciones-internacionales',
      notas: 'Cotizacion de la plata en LME',
    },
    {
      nombre: 'Reservas Internacionales', slug: 'reservas-internacionales',
      categoria: 'monetario', tipo: 'cuantitativo', fuente: 'Banco Central de Bolivia',
      url: 'https://www.bcb.gob.bo/', periodicidad: 'semanal',
      unidad: 'USD MM', formatoNumero: 0, orden: 8, tier: 1,
      ejesTematicos: 'economia,politica-economica',
      notas: 'Total de reservas internacionales',
    },
    {
      nombre: 'IPC Nacional', slug: 'ipc-ine',
      categoria: 'economico', tipo: 'cuantitativo', fuente: 'Instituto Nacional de Estadistica (INE)',
      url: 'https://www.ine.gob.bo/', periodicidad: 'mensual',
      unidad: '% interanual', formatoNumero: 2, orden: 9, tier: 2,
      ejesTematicos: 'economia,politica-economica',
      notas: 'Indice de Precios al Consumidor - variacion interanual. Fuente: PDF del INE.',
    },
    // === TIER 2: Corto plazo ===
    {
      nombre: 'Precio del Oro', slug: 'precio-oro',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'Kitco',
      url: 'https://www.kitco.com/', periodicidad: 'diaria',
      unidad: 'USD/onza', formatoNumero: 2, orden: 10, tier: 2,
      ejesTematicos: 'mineria,relaciones-internacionales',
      notas: 'Precio internacional del oro - referencia para reservas y exportaciones',
    },
    {
      nombre: 'Precio Petroleo Brent', slug: 'precio-petroleo-brent',
      categoria: 'hidrocarburos', tipo: 'cuantitativo', fuente: 'Mercados internacionales',
      url: '', periodicidad: 'diaria',
      unidad: 'USD/barril', formatoNumero: 2, orden: 11, tier: 2,
      ejesTematicos: 'hidrocarburos,energia',
      notas: 'Precio internacional del petroleo referencia Brent - impacto en economia boliviana',
    },
    {
      nombre: 'Precio Petroleo WTI', slug: 'precio-petroleo-wti',
      categoria: 'hidrocarburos', tipo: 'cuantitativo', fuente: 'Mercados internacionales',
      url: '', periodicidad: 'diaria',
      unidad: 'USD/barril', formatoNumero: 2, orden: 12, tier: 2,
      ejesTematicos: 'hidrocarburos,energia',
      notas: 'Precio internacional del petroleo referencia WTI',
    },
    {
      nombre: 'Precio Gas Natural', slug: 'precio-gas-natural',
      categoria: 'hidrocarburos', tipo: 'cuantitativo', fuente: 'Mercados internacionales / YPFB',
      url: '', periodicidad: 'semanal',
      unidad: 'USD/MMBtu', formatoNumero: 2, orden: 13, tier: 2,
      ejesTematicos: 'hidrocarburos,energia',
      notas: 'Precio internacional del gas natural - impacto en exportaciones de YPFB',
    },
    // === TIER 2: Accesibilidad limitada ===
    {
      nombre: 'Produccion de Gas Natural', slug: 'produccion-gas-ypfb',
      categoria: 'hidrocarburos', tipo: 'cuantitativo', fuente: 'YPFB',
      url: '', periodicidad: 'mensual',
      unidad: 'MMmcd', formatoNumero: 1, orden: 14, tier: 2,
      ejesTematicos: 'hidrocarburos,energia,economia',
      notas: 'Produccion de gas natural en millones de metros cubicos diarios. Fuente con acceso limitado.',
    },
    {
      nombre: 'Produccion Minera', slug: 'produccion-minera',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'Ministerio de Minería y Metalurgia',
      url: '', periodicidad: 'mensual',
      unidad: 'toneladas', formatoNumero: 0, orden: 15, tier: 2,
      ejesTematicos: 'mineria,economia',
      notas: 'Produccion minera nacional por mineral. Fuente con acceso limitado.',
    },
    {
      nombre: 'Indice de Actividad Economica', slug: 'iae-ine',
      categoria: 'economico', tipo: 'cuantitativo', fuente: 'Instituto Nacional de Estadistica (INE)',
      url: 'https://www.ine.gob.bo/', periodicidad: 'trimestral',
      unidad: 'indice', formatoNumero: 2, orden: 16, tier: 2,
      ejesTematicos: 'economia,politica-economica',
      notas: 'Indice de Actividad Economica - proxy del crecimiento economico trimestral',
    },
    {
      nombre: 'Tasa de Desempleo', slug: 'tasa-desempleo',
      categoria: 'social', tipo: 'cuantitativo', fuente: 'Instituto Nacional de Estadistica (INE)',
      url: 'https://www.ine.gob.bo/', periodicidad: 'trimestral',
      unidad: '%', formatoNumero: 1, orden: 17, tier: 2,
      ejesTematicos: 'economia,social',
      notas: 'Tasa de desempleo abierto nacional - indicador clave del mercado laboral',
    },
    {
      nombre: 'Tasa de Interes de Referencia', slug: 'tasa-interes-referencia',
      categoria: 'economico', tipo: 'cuantitativo', fuente: 'Banco Central de Bolivia',
      url: 'https://www.bcb.gob.bo/', periodicidad: 'mensual',
      unidad: '%', formatoNumero: 2, orden: 18, tier: 2,
      ejesTematicos: 'economia,politica-economica',
      notas: 'Tasa de interes de referencia del BCB - politica monetaria',
    },
    {
      nombre: 'Exportaciones Mineras', slug: 'exportaciones-mineras',
      categoria: 'minero', tipo: 'cuantitativo', fuente: 'Instituto Nacional de Estadistica (INE)',
      url: 'https://www.ine.gob.bo/', periodicidad: 'mensual',
      unidad: 'USD MM', formatoNumero: 1, orden: 19, tier: 2,
      ejesTematicos: 'mineria,economia,relaciones-internacionales',
      notas: 'Valor de exportaciones mineras - ingreso de divisas por mineria',
    },
    // === TIER 3: Proxy / Derivados ===
    {
      nombre: 'Precio Combustible', slug: 'precio-combustible',
      categoria: 'economico', tipo: 'cuantitativo', fuente: 'Proxy (monitoreo de redes y mercado)',
      url: '', periodicidad: 'semanal',
      unidad: 'Bs/galon', formatoNumero: 2, orden: 20, tier: 3,
      ejesTematicos: 'hidrocarburos,energia,economia',
      notas: 'Precio de combustibles en mercado interno. Obtenido via NLP sobre publicaciones en redes sociales y reportes de mercado.',
    },
  ]

  const INDICADORES_CUALITATIVOS = [
    // === TIER 2: Indicadores sociales cualitativos ===
    {
      nombre: 'Conflictividad Social', slug: 'conflictividad-escalamiento',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'semanal',
      unidad: 'nivel', formatoNumero: 1, orden: 100, tier: 2,
      ejesTematicos: 'movimientos-sociales,politica-economica',
      metodologia: 'Construido a partir del analisis de multiples fuentes: frecuencia de protestas, huelgas, bloqueos, confrontaciones, declaraciones de lideres sociales y politicos, cobertura mediatica de conflictos.',
      variables: ['Protestas y movilizaciones', 'Huelgas y paros', 'Bloqueos de caminos', 'Confrontaciones', 'Declaraciones escalatorias', 'Cobertura mediatica de conflictos'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Evaluacion semanal del nivel de tension social. Escala: 0-3 Bajo, 4-6 Medio, 7-8 Alto, 9-10 Critico',
    },
    {
      nombre: 'Satisfaccion Publica', slug: 'satisfaccion-publica',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'mensual',
      unidad: 'nivel', formatoNumero: 1, orden: 101, tier: 2,
      ejesTematicos: 'gobierno,politica',
      metodologia: 'Construido a partir de la percepcion ciudadana observada en medios, redes sociales y encuestas publicadas. Incluye aprobacion gubernamental, confianza institucional y expectativas economicas.',
      variables: ['Percepcion economica', 'Aprobacion gubernamental', 'Confianza institucional', 'Expectativas futuras', 'Satisfaccion con servicios publicos'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Evaluacion de la percepcion ciudadana general. Escala: 0-3 Baja, 4-6 Media, 7-10 Alta',
    },
    {
      nombre: 'Oposicion Politica', slug: 'oposicion-politica',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'semanal',
      unidad: 'nivel', formatoNumero: 1, orden: 102, tier: 2,
      ejesTematicos: 'gobierno,politica',
      metodologia: 'Mide la intensidad de la oposicion al gobierno mediante el analisis de discurso opositor, acciones de protesta organizadas, alianzas opositoras y cobertura mediatica dedicada.',
      variables: ['Intensidad discursiva', 'Acciones de protesta organizadas', 'Alianzas opositoras', 'Cobertura mediatica opositora', 'Iniciativas legislativas de oposicion'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Minima, 3-4 Baja, 5-6 Moderada, 7-8 Alta, 9-10 Maxima',
    },
    {
      nombre: 'Rechazo a Politicas Publicas', slug: 'rechazo-politicas',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'quincenal',
      unidad: 'nivel', formatoNumero: 1, orden: 103, tier: 2,
      ejesTematicos: 'gobierno,politica-economica',
      metodologia: 'Analiza el grado de rechazo ciudadano a politicas publicas especificas mediante el seguimiento de expresiones de descontento en medios, redes sociales, impugnaciones y demandas.',
      variables: ['Expresiones de rechazo en medios', 'Rechazo en redes sociales', 'Impugnaciones legales', 'Demandas judiciales', 'Movilizacion contra politicas'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Aceptacion general, 3-4 Rechazo leve, 5-6 Rechazo moderado, 7-8 Rechazo fuerte, 9-10 Rechazo masivo',
    },
    {
      nombre: 'Resistencia a Politicas Publicas', slug: 'resistencia-politicas',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'quincenal',
      unidad: 'nivel', formatoNumero: 1, orden: 104, tier: 2,
      ejesTematicos: 'gobierno,movimientos-sociales',
      metodologia: 'Evalua las formas organizadas de resistencia a politicas publicas: acciones civiles, impugnaciones formales, demandas judiciales, desobediencia civil y campanas de comunicacion.',
      variables: ['Acciones de resistencia civil', 'Impugnaciones formales', 'Demandas judiciales activas', 'Desobediencia civil', 'Campanas de comunicacion'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Sin resistencia, 3-4 Resistencia incipiente, 5-6 Resistencia organizada, 7-8 Resistencia fuerte, 9-10 Resistencia generalizada',
    },
    // === RESCATADOS DE DOCUMENTACION (04_Indicadores + 05_Protocolo_El_Foco + 02_Saldo_Del_Dia) ===
    {
      nombre: 'Aprobacion Presidencial', slug: 'aprobacion-presidencial',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Encuestas publicadas + analisis multifuente',
      url: '', periodicidad: 'mensual',
      unidad: 'nivel', formatoNumero: 1, orden: 106, tier: 2,
      ejesTematicos: 'gobierno,politica',
      metodologia: 'Evalua el nivel de aprobacion del Presidente mediante el seguimiento de encuestas publicadas, percepcion en redes sociales, cobertura mediatica y analisis de sentimiento. Se complementa con datos de encuestadoras reconocidas cuando estan disponibles.',
      variables: ['Encuestas publicadas', 'Percepcion en redes sociales', 'Cobertura mediatica favorable', 'Cobertura mediatica desfavorable', 'Apoyo de bases sociales', 'Relacion con fuerzas armadas y policia'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Muy baja, 3-4 Baja, 5-6 Media, 7-8 Alta, 9-10 Muy alta. Indicador clave del eje Gobierno.',
    },
    {
      nombre: 'Percepcion de Seguridad Ciudadana', slug: 'percepcion-seguridad',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'mensual',
      unidad: 'nivel', formatoNumero: 1, orden: 107, tier: 2,
      ejesTematicos: 'gobierno,social',
      metodologia: 'Mide la percepcion ciudadana sobre seguridad delictiva mediante analisis de denuncias publicas, cobertura mediatica de hechos delictivos, redes sociales y encuestas. Incluye victimizacion y confianza en fuerzas de seguridad.',
      variables: ['Denuncias publicas y mediaticas', 'Hechos delictivos de alto impacto', 'Confianza en la Policia', 'Confianza en el sistema judicial', 'Victimizacion percibida', 'Sentimiento de inseguridad en redes'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Segura, 3-4 Moderadamente segura, 5-6 Preocupante, 7-8 Insegura, 9-10 Critica. Eje Justicia y Derechos Humanos.',
    },
    {
      nombre: 'Actividad Legislativa', slug: 'actividad-legislativa',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'semanal',
      unidad: 'nivel', formatoNumero: 1, orden: 108, tier: 2,
      ejesTematicos: 'gobierno,politica',
      metodologia: 'Evalua el nivel de actividad legislativa y su impacto politico: proyectos de ley presentados, aprobados y rechazados, sesiones plenarias, conflictos entre poderes e iniciativas de oposicion.',
      variables: ['Proyectos de ley presentados', 'Proyectos aprobados', 'Proyectos rechazados', 'Sesiones plenarias efectivas', 'Conflictos entre poderes', 'Iniciativas de oposicion legislativa'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala por volumen e impacto: 0-2 Minima, 3-4 Baja, 5-6 Moderada, 7-8 Alta, 9-10 Intensa. Indicador del eje Gobierno.',
    },
    // === TIER 3: Indicadores derivados / complejos ===
    {
      nombre: 'Temas de Preocupacion Ciudadana', slug: 'preocupacion-ciudadana',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Analisis multifuente',
      url: '', periodicidad: 'mensual',
      unidad: 'nivel', formatoNumero: 1, orden: 109, tier: 3,
      ejesTematicos: 'social,politica-economica',
      metodologia: 'Identifica y pondera los temas que mas preocupan a la ciudadania mediante el analisis de conversaciones en redes sociales, consultas en medios, encuestas publicadas y reclamos formales.',
      variables: ['Costo de vida', 'Empleo', 'Seguridad ciudadana', 'Corrupcion', 'Salud', 'Educacion', 'Servicios basicos'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Cada sub-variable se puntua independientemente. El valor compuesto refleja la intensidad general de la preocupacion.',
    },
    {
      nombre: 'Indice de Conflictividad Social', slug: 'indice-conflictividad',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Derivado de multiples fuentes',
      url: '', periodicidad: 'semanal',
      unidad: 'indice 0-100', formatoNumero: 0, orden: 110, tier: 3,
      ejesTematicos: 'movimientos-sociales,politica-economica',
      metodologia: 'Indice compuesto 0-100 que integra: volumen de protestas, sentimiento dominante en cobertura mediatica, geolocalizacion de conflictos, declaraciones de la Defensoria del Pueblo y magnitud de afectaciones. Se calcula como promedio ponderado de las sub-variables.',
      variables: ['Volumen de protestas (frecuencia)', 'Sentimiento mediatico (positivo/negativo)', 'Geolocalizacion de conflictos', 'Declaraciones Defensoria del Pueblo', 'Magnitud de afectaciones (bloqueos, paros)', 'Duracion promedio de conflictos', 'Participacion de organizaciones sociales'],
      escalaMin: 0, escalaMax: 100,
      notas: 'Escala: 0-25 Baja, 26-50 Moderada, 51-75 Alta, 76-100 Critica. Indice compuesto derivado de multiples fuentes.',
    },
    {
      nombre: 'Sentimiento Cambiario', slug: 'sentimiento-cambiario',
      categoria: 'monetario', tipo: 'cualitativo',
      fuente: 'ONION200 - Derivado de analisis de sentimiento',
      url: '', periodicidad: 'diaria',
      unidad: 'indice -100 a +100', formatoNumero: 0, orden: 111, tier: 3,
      ejesTematicos: 'politica-economica',
      metodologia: 'Indice de sentimiento cambiario basado en analisis GLM de menciones en medios y redes sociales sobre temas de dolar, devaluacion, tipo de cambio y reservas. Rango -100 (pessimismo extremo) a +100 (optimismo extremo).',
      variables: ['Menciones sobre dolar', 'Menciones sobre devaluacion', 'Menciones sobre tipo de cambio', 'Menciones sobre reservas internacionales', 'Sentimiento general economico'],
      escalaMin: -100, escalaMax: 100,
      notas: 'Escala: -100 a -50 Pessimismo alto, -49 a -1 Pessimismo moderado, 0 Neutral, 1 a 49 Optimismo moderado, 50 a 100 Optimismo alto.',
    },
    // === TIER 3: Medio ambiente ===
    {
      nombre: 'Alertas Ambientales', slug: 'alertas-ambientales',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Monitoreo multifuente',
      url: '', periodicidad: 'semanal',
      unidad: 'nivel', formatoNumero: 1, orden: 112, tier: 3,
      ejesTematicos: 'medio-ambiente',
      metodologia: 'Monitorea alertas y conflictos ambientales: deforestacion, contaminacion, incendios forestales, derrames, conflictos por recursos hidricos y territoriales. Integra datos satelitales cuando disponibles.',
      variables: ['Incendios forestales reportados', 'Deforestacion detectada', 'Contaminacion hidrica', 'Derrames industriales', 'Conflictos por recursos hidricos', 'Conflictos territoriales', 'Denuncias ambientales'],
      escalaMin: 0, escalaMax: 10,
      notas: 'Escala: 0-2 Normal, 3-4 Alerta leve, 5-6 Alerta moderada, 7-8 Alerta alta, 9-10 Emergencia ambiental. Eje Medio Ambiente y Territorio.',
    },
    {
      nombre: 'Indice de Tension Social', slug: 'indice-tension-social',
      categoria: 'social', tipo: 'cualitativo',
      fuente: 'ONION200 - Derivado de Saldo del Dia',
      url: '', periodicidad: 'diaria',
      unidad: 'escala 1-10', formatoNumero: 1, orden: 113, tier: 3,
      ejesTematicos: 'movimientos-sociales',
      metodologia: 'Indice diario que mide la tension social mediante el volumen de menciones sobre movimientos sociales, sentimiento dominante y geolocalizacion de eventos. Calculado automaticamente a partir del procesamiento diario de noticias.',
      variables: ['Volumen menciones movimientos sociales', 'Sentimiento dominante', 'Geolocalizacion de eventos', 'Cantidad de actores movilizados', 'Afectacion a servicios publicos'],
      escalaMin: 1, escalaMax: 10,
      notas: 'Escala: 1-2 Calma, 3-4 Tension leve, 5-6 Tension moderada, 7-8 Tension alta, 9-10 Crisis. Indicador derivado del procesamiento de Saldo del Dia.',
    },
  ]

  const ALL_INDICADORES = [...INDICADORES_CUANTITATIVOS, ...INDICADORES_CUALITATIVOS]

  let created = 0
  for (const ind of ALL_INDICADORES) {
    const exists = await db.indicador.findUnique({ where: { slug: ind.slug } })
    if (!exists) {
      // Parsear variables a JSON string si es array
      const vars = (ind as Record<string, unknown>).variables;
      const data = {
        ...ind,
        variables: Array.isArray(vars) ? JSON.stringify(vars) : (typeof vars === 'string' ? vars : '[]'),
      }
      await db.indicador.create({ data })
      created++
    }
  }

  return created
}

// Obtener ultimo valor de un indicador por slug
export async function getUltimoValor(slug: string): Promise<CapturaExitosa | null> {
  try {
    const indicador = await db.indicador.findUnique({
      where: { slug },
    })

    if (!indicador || !indicador.activo) return null

    const ultimoValor = await db.indicadorValor.findFirst({
      where: { indicadorId: indicador.id },
      orderBy: { fechaCaptura: 'desc' },
    })

    if (!ultimoValor) return null

    return {
      slug,
      valorTexto: ultimoValor.valorTexto || ultimoValor.valor.toFixed(indicador.formatoNumero),
      confiable: ultimoValor.confiable,
    }
  } catch {
    return null
  }
}
