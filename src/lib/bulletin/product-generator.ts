// Product Generator - Generacion de productos ONION200
// DECODEX Bolivia
// Stub funcional: la implementacion completa se desarrolla en modulo dedicado

import type { TipoBoletin, ProductoConfig } from '@/types/bulletin'

// Configuracion de productos ONION200
const PRODUCTOS: ProductoConfig[] = [
  {
    tipo: 'EL_TERMOMETRO',
    nombre: 'El Termometro',
    nombreCorto: 'Termometro',
    descripcion: 'Boletin matutino - abre el dia con balance de medios',
    categoria: 'premium',
    frecuencia: 'diario_am',
    horarioEnvio: '07:00 AM',
    longitudPaginas: 8,
    longitudMinLectura: 12,
    canales: ['whatsapp', 'email', 'web'],
    periodoDefault: 1,
    activo: true,
    generador: {
      tipo: 'dedicado',
      ventana: 'nocturna',
      filtros: ['fecha', 'ejes', 'actores', 'medios'],
      requierePreview: true,
      panelId: 'termometro_saldo',
      descripcionVentana: 'Ayer 19:00 - Hoy 07:00',
    },
  },
  {
    tipo: 'SALDO_DEL_DIA',
    nombre: 'Saldo del Dia',
    nombreCorto: 'Saldo',
    descripcion: 'Cierre de jornada con balance completo',
    categoria: 'premium',
    frecuencia: 'diario_pm',
    horarioEnvio: '07:00 PM',
    longitudPaginas: 10,
    longitudMinLectura: 15,
    canales: ['whatsapp', 'email', 'web'],
    periodoDefault: 1,
    activo: true,
    generador: {
      tipo: 'dedicado',
      ventana: 'diurna',
      filtros: ['fecha', 'ejes', 'actores', 'medios'],
      requierePreview: true,
      panelId: 'termometro_saldo',
      descripcionVentana: 'Hoy 07:00 - 19:00',
    },
  },
  {
    tipo: 'EL_FOCO',
    nombre: 'El Foco',
    nombreCorto: 'Foco',
    descripcion: 'Analisis profundo por eje tematico',
    categoria: 'premium_mid',
    frecuencia: 'diario',
    horarioEnvio: '09:00 AM',
    longitudPaginas: 15,
    longitudMinLectura: 20,
    canales: ['whatsapp', 'email', 'pdf'],
    periodoDefault: 1,
    activo: true,
    generador: {
      tipo: 'dedicado',
      ventana: 'dia_completo',
      filtros: ['ejes', 'actores'],
      requierePreview: true,
      panelId: 'foco',
      tieneFases: true,
      descripcionVentana: 'Dia completo (00:00 - 23:59)',
    },
  },
  {
    tipo: 'EL_RADAR',
    nombre: 'El Radar',
    nombreCorto: 'Radar',
    descripcion: 'Boletin semanal gratuito de awareness',
    categoria: 'gratuito',
    frecuencia: 'semanal',
    horarioEnvio: '08:00 AM lunes',
    longitudPaginas: 5,
    longitudMinLectura: 8,
    canales: ['email', 'web'],
    periodoDefault: 7,
    activo: true,
    generador: {
      tipo: 'dedicado',
      ventana: 'semanal',
      filtros: ['fecha', 'ejes'],
      requierePreview: true,
      panelId: 'radar',
      descripcionVentana: 'Lunes - Domingo',
    },
  },
  {
    tipo: 'EL_ESPECIALIZADO',
    nombre: 'El Especializado',
    nombreCorto: 'Especializado',
    descripcion: 'Analisis experto sectorial',
    categoria: 'premium_mid',
    frecuencia: 'semanal',
    horarioEnvio: '10:00 AM',
    longitudPaginas: 20,
    longitudMinLectura: 25,
    canales: ['whatsapp', 'email', 'pdf'],
    periodoDefault: 7,
    activo: true,
    generador: {
      tipo: 'dedicado',
      ventana: 'semanal',
      filtros: ['ejes', 'actores', 'medios'],
      requierePreview: true,
      panelId: 'especializado',
      descripcionVentana: 'Semana completa',
    },
  },
]

// Obtener config de un producto por tipo
export function getProductConfig(tipo: TipoBoletin): ProductoConfig | null {
  return PRODUCTOS.find(p => p.tipo === tipo) || null
}

// Obtener menciones para un boletin
export async function getMencionesForBulletin(
  tipo: TipoBoletin,
  options: { personaId?: string; ejesTematicos?: string[] } = {},
): Promise<{
  menciones: Record<string, unknown>[]
  fechaInicio: Date
  fechaFin: Date
  totalMenciones: number
}> {
  // En produccion: query real a la DB con filtros por tipo, fechas, ejes, etc.
  // Por ahora, ventana de fechas segun tipo
  const now = new Date()
  const config = getProductConfig(tipo)
  const dias = config?.periodoDefault || 1

  const fechaFin = new Date(now)
  const fechaInicio = new Date(now)
  fechaInicio.setDate(fechaInicio.getDate() - dias)

  // Placeholder: devolver array vacio
  // El modulo real de generacion inyectara las menciones
  return {
    menciones: [],
    fechaInicio,
    fechaFin,
    totalMenciones: 0,
  }
}

// Formatear fecha en zona horaria de Bolivia (America/La_Paz, UTC-4)
export function formatFechaBolivia(date: Date): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/La_Paz',
  }
  return date.toLocaleDateString('es-BO', opciones)
}
