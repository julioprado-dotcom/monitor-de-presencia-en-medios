import { z } from 'zod';

// ─── Cliente ──────────────────────────────────────────────────────
export const clienteCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es obligatorio').max(200),
  nombreContacto: z.string().trim().max(200).optional().default(''),
  email: z.string().email('Email inválido').max(300),
  telefono: z.string().max(50).optional().default(''),
  whatsapp: z.string().max(50).optional().default(''),
  organizacion: z.string().max(300).optional().default(''),
  segmento: z.enum(['partido_politico', 'movimiento_social', 'ong', 'embajada', 'legislador', 'medio', 'academico', 'otro']).optional().default('otro'),
  plan: z.enum(['basico', 'avanzado', 'institucional']).optional().default('basico'),
  estado: z.enum(['activo', 'suspendido', 'cancelado']).optional().default('activo'),
  parlamentarios: z.array(z.string()).optional().default([]),
  ejesContratados: z.array(z.string()).optional().default([]),
  notas: z.string().max(2000).optional().default(''),
});

// ─── Contrato ─────────────────────────────────────────────────────
export const contratoCreateSchema = z.object({
  clienteId: z.string().min(1, 'Cliente es obligatorio'),
  tipoProducto: z.string().min(1, 'Tipo de producto es obligatorio'),
  mediosAsignados: z.array(z.string()).optional().default([]),
  ejesTematicos: z.array(z.string()).optional().default([]),
  parlamentarios: z.array(z.string()).optional().default([]),
  frecuencia: z.enum(['diario', 'semanal', 'quincenal', 'mensual']).optional().default('diario'),
  formatoEntrega: z.enum(['whatsapp', 'email', 'ambos']).optional().default('whatsapp'),
  fechaInicio: z.string().min(1, 'Fecha inicio es obligatoria'),
  fechaFin: z.string().optional().default(''),
  montoMensual: z.number().min(0).optional().default(0),
  moneda: z.enum(['Bs', 'USD']).optional().default('Bs'),
  estado: z.enum(['activo', 'pausado', 'vencido', 'cancelado']).optional().default('activo'),
  notas: z.string().max(2000).optional().default(''),
});

// ─── Persona ──────────────────────────────────────────────────────
export const personaCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es obligatorio').max(200),
  camara: z.enum(['Diputados', 'Senadores']).optional().default('Diputados'),
  departamento: z.string().max(100).optional().default(''),
  partido: z.string().max(300).optional().default(''),
  partidoSigla: z.string().max(50).optional().default(''),
  tipo: z.string().max(50).optional().default('plurinominal'),
  cargoDirectiva: z.string().max(200).optional().default(''),
  email: z.string().email('Email inválido').max(300).optional().default(''),
  fotoUrl: z.string().url().max(500).optional().default(''),
});

// ─── Suscriptor ───────────────────────────────────────────────────
export const suscriptorCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es obligatorio').max(200),
  email: z.string().email('Email inválido').max(300),
  whatsapp: z.string().max(50).optional().default(''),
  plan: z.enum(['basico', 'avanzado', 'institucional']).optional().default('basico'),
});

// ─── Entrega ──────────────────────────────────────────────────────
export const entregaCreateSchema = z.object({
  contratoId: z.string().min(1, 'Contrato es obligatorio'),
  tipoBoletin: z.string().min(1, 'Tipo de boletín es obligatorio'),
  contenido: z.string().optional().default(''),
  fechaProgramada: z.string().optional().default(''),
  fechaEnvio: z.string().optional().default(''),
  estado: z.enum(['pendiente', 'enviado', 'fallido']).optional().default('enviado'),
  canal: z.enum(['whatsapp', 'email', 'web']).optional().default('whatsapp'),
  destinatarios: z.array(z.string()).optional().default([]),
  error: z.string().max(500).optional().default(''),
});

// ─── Reporte ──────────────────────────────────────────────────────
export const reporteCreateSchema = z.object({
  tipo: z.string().min(1).max(100).optional().default('semanal'),
  personaId: z.string().optional().default(''),
  fechaInicio: z.string().optional().default(''),
  fechaFin: z.string().optional().default(''),
  resumen: z.string().max(5000).optional().default(''),
  totalMenciones: z.number().int().min(0).optional().default(0),
  sentimientoPromedio: z.number().min(0).max(5).optional().default(0),
  temasPrincipales: z.array(z.string()).optional().default([]),
});

// ─── Eje Temático ─────────────────────────────────────────────────
export const ejeCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre es obligatorio').max(200),
  slug: z.string().trim().min(1).max(100),
  icono: z.string().max(10).optional().default(''),
  color: z.string().max(20).optional().default('#3b82f6'),
  descripcion: z.string().max(500).optional().default(''),
  keywords: z.string().max(500).optional().default(''),
  dimension: z.string().max(50).optional().default(''),
  orden: z.number().int().min(0).optional().default(0),
});

// ─── Login ────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es obligatoria'),
});

// ─── Paginación ───────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
