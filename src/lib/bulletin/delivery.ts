// Delivery - Formateo y preparacion de envio de boletines ONION200
// DECODEX Bolivia
// Stub funcional: la implementacion completa se desarrolla en modulo dedicado

import type { TipoBoletin } from '@/types/bulletin'

export interface DeliveryPayload {
  tipoBoletin: TipoBoletin
  canal: 'whatsapp' | 'email' | 'web' | 'pdf'
  destinatarios: string[]
  contenidoFormateado: string
  metadata: {
    longitudCaracteres: number
    truncado: boolean
    fechaFormateo: string
  }
}

// Variables de template disponibles
export interface TemplateVars {
  fecha: string
  cliente: string
  [key: string]: string
}

// Construir payload de entrega formateado para un canal especifico
export function buildDeliveryPayload(
  tipo: TipoBoletin,
  canal: 'whatsapp' | 'email',
  destinatarios: string[],
  contenido: string,
  vars: TemplateVars,
): DeliveryPayload {
  let contenidoFormateado = contenido

  // Aplicar variables de template
  for (const [key, value] of Object.entries(vars)) {
    contenidoFormateado = contenidoFormateado.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      value,
    )
  }

  // Truncar para WhatsApp si es necesario
  const truncado = canal === 'whatsapp' && contenidoFormateado.length > 40000

  if (truncado) {
    contenidoFormateado = contenidoFormateado.substring(0, 40000) + '\n\n[... contenido truncado por limite de WhatsApp]'
  }

  return {
    tipoBoletin: tipo,
    canal,
    destinatarios,
    contenidoFormateado,
    metadata: {
      longitudCaracteres: contenidoFormateado.length,
      truncado,
      fechaFormateo: new Date().toISOString(),
    },
  }
}

// Truncar texto para WhatsApp (limite practico: 40,000 caracteres)
export function truncateForWhatsApp(text: string, maxChars = 40000): string {
  if (text.length <= maxChars) return text
  return text.substring(0, maxChars) + '\n\n[... truncado]'
}
