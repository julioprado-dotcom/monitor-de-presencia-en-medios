// ─── Motor de Evaluación de Alertas Tempranas — DECODEX Bolivia ────────────
// Evalúa indicadores contra umbrales y genera el semáforo consolidado.
//
// Algoritmo basado en Apéndice Técnico A, Sección 3:
// - 🟢 VERDE: Ningún indicador supera umbral 🟡
// - 🟡 AMARILLO: 1 indicador en 🔴 O 2+ indicadores en 🟡
// - 🔴 ROJO: 2+ indicadores en 🔴 O 1🔴 + 2+🟡 O cruce sistémico activo

import {
  UMBRALES_CRITICOS,
  CRUCES_SISTEMICOS,
  EJES,
  type UmbralAlerta,
  type NivelAlerta,
  type EjeEstrategico,
  type HistorialPunto,
} from './umbrales';

// ─── Tipos de Salida ──────────────────────────────────────────────────────

export interface AlertaGenerada {
  id: string;
  umbralId: string;
  eje: EjeEstrategico;
  nivel: NivelAlerta;
  indicador: string;
  nombre: string;
  mensaje: string;
  valor: number;
  timestamp: Date;
}

export interface EstadoEje {
  eje: EjeEstrategico;
  slug: string;
  nombre: string;
  estado: NivelAlerta;
  alertas: AlertaGenerada[];
  indicadoresEnRojo: number;
  indicadoresEnAmarillo: number;
  totalEvaluados: number;
}

export interface CruceActivo {
  id: string;
  ejeA: EjeEstrategico;
  ejeB: EjeEstrategico;
  nombre: string;
  nivel: 'alto' | 'medio';
  mensaje: string;
}

export interface SemaforoConsolidado {
  fecha: string;
  hora_actualizacion: string;
  estado_global: NivelAlerta;
  ejes: Record<string, EstadoEje>;
  alertas: AlertaGenerada[];
  cruces_activos: CruceActivo[];
  recomendacion_accion: string;
  resumen: string;
}

// ─── Indicador de Entrada ────────────────────────────────────────────────

export interface IndicadorEntrada {
  slug: string;            // Debe coincidir con UmbralAlerta.indicador
  valor: number;
  historial?: HistorialPunto[];
}

// ─── Función Principal: Evaluar Indicadores ──────────────────────────────

/**
 * Evalúa un set de indicadores contra todos los umbrales configurados.
 * Retorna el semáforo consolidado completo.
 *
 * @param indicadores - Array de indicadores con sus valores actuales
 * @param opciones - Opciones de configuración
 */
export function evaluarIndicadores(
  indicadores: IndicadorEntrada[],
  opciones: {
    fecha?: Date;
    incluirRecomendacion?: boolean;
  } = {}
): SemaforoConsolidado {
  const now = opciones.fecha || new Date();
  const alertas: AlertaGenerada[] = [];

  // Crear mapa rápido de indicadores
  const indicadoresMap = new Map<string, { valor: number; historial: HistorialPunto[] }>();
  for (const ind of indicadores) {
    indicadoresMap.set(ind.slug, {
      valor: ind.valor,
      historial: ind.historial || [],
    });
  }

  // Evaluar cada umbral contra los indicadores disponibles
  for (const umbral of UMBRALES_CRITICOS) {
    const datos = indicadoresMap.get(umbral.indicador);
    if (datos === undefined) continue; // No hay dato para este umbral

    const nivel = umbral.condicion(datos.valor, datos.historial);
    if (nivel === 'VERDE') continue; // Solo registrar alertas activas

    alertas.push({
      id: `${umbral.id}_${now.getTime()}`,
      umbralId: umbral.id,
      eje: umbral.eje,
      nivel,
      indicador: umbral.indicador,
      nombre: umbral.nombre,
      mensaje: umbral.mensaje(datos.valor, nivel),
      valor: datos.valor,
      timestamp: now,
    });
  }

  // Consolidar por eje
  const ejesEstado = consolidarEjes(alertas, now);

  // Evaluar cruces sistémicos
  const crucesActivos = evaluarCruces(ejesEstado);

  // Calcular estado global
  const estadoGlobal = calcularEstadoGlobal(ejesEstado, crucesActivos);

  // Generar recomendación
  const recomendacion = opciones.incluirRecomendacion !== false
    ? generarRecomendacion(estadoGlobal, alertas, crucesActivos)
    : '';

  // Generar resumen textual
  const resumen = generarResumen(estadoGlobal, ejesEstado, alertas);

  // Formatear fecha/hora
  const fechaStr = now.toISOString().split('T')[0];
  const horaStr = now.toTimeString().split(' ')[0];

  return {
    fecha: fechaStr,
    hora_actualizacion: horaStr,
    estado_global: estadoGlobal,
    ejes: ejesEstado,
    alertas,
    cruces_activos: crucesActivos,
    recomendacion_accion: recomendacion,
    resumen,
  };
}

// ─── Consolidación por Eje ───────────────────────────────────────────────

/**
 * Agrupa alertas por eje y calcula el estado semáforo de cada uno.
 * Aplica reglas de la Sección 3.1 del Apéndice Técnico:
 * - ROJO: 2+ indicadores en rojo, o 1 rojo + 2+ amarillo
 * - AMARILLO: 1 rojo, o 2+ amarillo
 * - VERDE: todo normal
 */
export function consolidarEjes(
  alertas: AlertaGenerada[],
  timestamp: Date = new Date()
): Record<string, EstadoEje> {
  const resultado: Record<string, EstadoEje> = {};

  // Inicializar todos los ejes
  for (const eje of EJES) {
    resultado[eje.slug] = {
      eje: eje.key,
      slug: eje.slug,
      nombre: eje.nombre,
      estado: 'VERDE',
      alertas: [],
      indicadoresEnRojo: 0,
      indicadoresEnAmarillo: 0,
      totalEvaluados: 0,
    };
  }

  // Distribuir alertas en sus ejes
  for (const alerta of alertas) {
    const ejeDef = EJES.find(e => e.key === alerta.eje);
    if (!ejeDef) continue;

    const estadoEje = resultado[ejeDef.slug];
    estadoEje.alertas.push(alerta);

    if (alerta.nivel === 'ROJO') {
      estadoEje.indicadoresEnRojo++;
    } else if (alerta.nivel === 'AMARILLO') {
      estadoEje.indicadoresEnAmarillo++;
    }
  }

  // Calcular estado semáforo por eje
  for (const slug of Object.keys(resultado)) {
    const estadoEje = resultado[slug];
    const { indicadoresEnRojo: rojos, indicadoresEnAmarillo: amarillos } = estadoEje;

    if (rojos >= 2 || (rojos >= 1 && amarillos >= 2)) {
      estadoEje.estado = 'ROJO';
    } else if (rojos >= 1 || amarillos >= 2) {
      estadoEje.estado = 'AMARILLO';
    } else if (amarillos >= 1) {
      // 1 amarillo solo → eje en amarillo según regla estricta
      // La regla dice "2+ en amarillo", pero 1 amarillo en eje social/energía es relevante
      estadoEje.estado = 'AMARILLO';
    } else {
      estadoEje.estado = 'VERDE';
    }
  }

  return resultado;
}

// ─── Evaluación de Cruces Sistémicos ──────────────────────────────────────

/**
 * Evalúa si los cruces sistémicos se activan según los estados de los ejes.
 */
export function evaluarCruces(
  ejesEstado: Record<string, EstadoEje>
): CruceActivo[] {
  const activos: CruceActivo[] = [];

  // Mapa de eje key → estado
  const estadoPorEje = new Map<EjeEstrategico, NivelAlerta>();
  for (const slug of Object.keys(ejesEstado)) {
    estadoPorEje.set(ejesEstado[slug].eje, ejesEstado[slug].estado);
  }

  for (const cruce of CRUCES_SISTEMICOS) {
    const estadoA = estadoPorEje.get(cruce.ejeA) || 'VERDE';
    const estadoB = estadoPorEje.get(cruce.ejeB) || 'VERDE';

    if (cruce.activarSi(estadoA, estadoB)) {
      activos.push({
        id: cruce.id,
        ejeA: cruce.ejeA,
        ejeB: cruce.ejeB,
        nombre: cruce.nombre,
        nivel: (estadoA === 'ROJO' && estadoB === 'ROJO') ? 'alto' : 'medio',
        mensaje: cruce.mensaje,
      });
    }
  }

  return activos;
}

// ─── Estado Global ────────────────────────────────────────────────────────

/**
 * Calcula el estado global del semáforo.
 * ROJO si: algún eje en ROJO, o hay cruces sistémicos activos de nivel alto.
 * AMARILLO si: algún eje en AMARILLO.
 * VERDE si: todos los ejes en VERDE.
 */
export function calcularEstadoGlobal(
  ejesEstado: Record<string, EstadoEje>,
  cruces: CruceActivo[]
): NivelAlerta {
  // Si hay cruce sistémico de nivel alto → ROJO global
  if (cruces.some(c => c.nivel === 'alto')) return 'ROJO';

  for (const slug of Object.keys(ejesEstado)) {
    if (ejesEstado[slug].estado === 'ROJO') return 'ROJO';
  }

  for (const slug of Object.keys(ejesEstado)) {
    if (ejesEstado[slug].estado === 'AMARILLO') return 'AMARILLO';
  }

  return 'VERDE';
}

// ─── Generación de Recomendación ──────────────────────────────────────────

function generarRecomendacion(
  estadoGlobal: NivelAlerta,
  alertas: AlertaGenerada[],
  cruces: CruceActivo[]
): string {
  if (estadoGlobal === 'VERDE') {
    return 'Situación estable. Monitoreo rutinario de indicadores.';
  }

  const partes: string[] = [];

  // Alertas rojas primero
  const rojas = alertas.filter(a => a.nivel === 'ROJO');
  const amarillas = alertas.filter(a => a.nivel === 'AMARILLO');

  if (rojas.length > 0) {
    partes.push(`Atender ${rojas.length} alerta(s) roja(s): ${rojas.map(a => a.nombre).join(', ')}.`);
  }

  if (cruces.length > 0) {
    partes.push(`Cruce(s) sistémico(s) activo(s): ${cruces.map(c => c.nombre).join(', ')}.`);
  }

  if (estadoGlobal === 'ROJO') {
    partes.push('Considerar activación de protocolo de crisis y preparar informe especial.');
  } else {
    partes.push('Monitoreo intensificado. Preparar informe de seguimiento en caso de escalada.');
  }

  return partes.join(' ');
}

// ─── Generación de Resumen ───────────────────────────────────────────────

function generarResumen(
  estadoGlobal: NivelAlerta,
  ejesEstado: Record<string, EstadoEje>,
  alertas: AlertaGenerada[]
): string {
  const emoji = estadoGlobal === 'ROJO' ? '🔴' : estadoGlobal === 'AMARILLO' ? '🟡' : '🟢';
  const rojos = alertas.filter(a => a.nivel === 'ROJO').length;
  const amarillos = alertas.filter(a => a.nivel === 'AMARILLO').length;

  const ejesStr = Object.entries(ejesEstado)
    .map(([slug, eje]) => {
      const ico = eje.estado === 'ROJO' ? '🔴' : eje.estado === 'AMARILLO' ? '🟡' : '🟢';
      return `${ico} ${eje.nombre}`;
    })
    .join(' | ');

  return `${emoji} Estado Global: ${estadoGlobal} — ${rojos} alerta(s) roja(s), ${amarillos} amarilla(s). Ejes: ${ejesStr}`;
}

// ─── Semáforo Compacto (para logs y testing) ──────────────────────────────

/**
 * Retorna un string compacto del semáforo por eje, útil para logs.
 * Ejemplo: "MACRO[🔴] SOCIAL[🟡] ENERGIA[🟢] POLITICA[🟢] LOGISTICA[🟢] AMBIENTE[🟡]"
 */
export function semaforoCompacto(semaforo: SemaforoConsolidado): string {
  const emoji = (n: NivelAlerta) => n === 'ROJO' ? '🔴' : n === 'AMARILLO' ? '🟡' : '🟢';
  return Object.values(semaforo.ejes)
    .map(e => `${e.eje}[${emoji(e.estado)}]`)
    .join(' ');
}
