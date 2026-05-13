import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════
// Helpers: zona horaria Bolivia UTC-4
// ═══════════════════════════════════════════════════════════

function todayStart(): Date {
  const now = new Date();
  const boliviaOffset = -4 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const boliviaMs = utcMs + boliviaOffset * 60000;
  const boliviaNow = new Date(boliviaMs);
  const start = new Date(boliviaNow.getFullYear(), boliviaNow.getMonth(), boliviaNow.getDate());
  const startUTC = new Date(start.getTime() - boliviaOffset * 60000);
  return startUTC;
}

function weekStart(): Date {
  const now = new Date();
  const boliviaOffset = -4 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const boliviaMs = utcMs + boliviaOffset * 60000;
  const boliviaNow = new Date(boliviaMs);
  // Monday as start of week
  const day = boliviaNow.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(boliviaNow.getFullYear(), boliviaNow.getMonth(), boliviaNow.getDate() - diff);
  return new Date(monday.getTime() - boliviaOffset * 60000);
}

// ═══════════════════════════════════════════════════════════
// Helpers: tiempo relativo en espanol
// ═══════════════════════════════════════════════════════════

function tiempoRelativo(fecha: Date | null): string {
  if (!fecha) return 'nunca';
  const ahora = Date.now();
  const ms = ahora - fecha.getTime();
  const minutos = Math.floor(ms / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias}d`;
}

// ═══════════════════════════════════════════════════════════
// Mapeo de productos para display
// ═══════════════════════════════════════════════════════════

const PRODUCT_NAMES: Record<string, string> = {
  EL_TERMOMETRO: 'El Termometro',
  SALDO_DEL_DIA: 'Saldo del Dia',
  EL_FOCO: 'El Foco',
  EL_ESPECIALIZADO: 'El Especializado',
  EL_INFORME_CERRADO: 'Informe Cerrado',
  FICHA_LEGISLADOR: 'Ficha Legislador',
  EL_RADAR: 'El Radar',
  VOZ_Y_VOTO: 'Voz y Voto',
  EL_HILO: 'El Hilo',
  FOCO_DE_LA_SEMANA: 'Foco de la Semana',
  ALERTA_TEMPRANA: 'Alerta Temprana',
  BOLETIN_DEL_GRANO: 'Boletin del Grano',
};

// ═══════════════════════════════════════════════════════════
// Endpoint
// ═══════════════════════════════════════════════════════════

export async function GET() {
  try {
    const start = todayStart();
    const weekS = weekStart();

    // ════════════════════════════════════════════════════
    // 1. CAPTURA
    // ════════════════════════════════════════════════════
    const mencionesHoy = await db.mencion.count({
      where: { fechaCaptura: { gte: start } },
    });

    // Promedio diario: ultimos 7 dias
    const sieteDiasAtras = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const totalSemanaPasada = await db.mencion.count({
      where: { fechaCaptura: { gte: sieteDiasAtras, lt: start } },
    });
    const promedioDiario = totalSemanaPasada > 0 ? Math.round(totalSemanaPasada / 7) : 0;

    // Ultima captura (para saber horas sin captura)
    const ultimaMencion = await db.mencion.findFirst({
      orderBy: { fechaCaptura: 'desc' },
      select: { fechaCaptura: true },
    });
    let sinCapturaHoras: number | null = null;
    if (ultimaMencion?.fechaCaptura) {
      sinCapturaHoras = Math.floor((Date.now() - ultimaMencion.fechaCaptura.getTime()) / (1000 * 60 * 60));
    }

    // Fuentes con nombres legibles
    const fuentesRaw = await db.fuenteEstado.findMany({
      include: {
        Medio: { select: { nombre: true } },
      },
      orderBy: { ultimoCheck: 'desc' },
      take: 50,
    });

    // Menciones por medio esta semana
    const mencionesSemana = await db.mencion.groupBy({
      by: ['medioId'],
      where: { fechaCaptura: { gte: weekS } },
      _count: true,
    });
    const mencionesPorMedio = new Map(mencionesSemana.map(m => [m.medioId, m._count]));

    const fuentes = fuentesRaw.map(f => {
      const estado = f.activo
        ? (f.fallosConsecutivos > 3 ? 'error' : f.fallosConsecutivos > 0 ? 'warning' : 'ok')
        : 'inactivo';
      return {
        id: f.id,
        nombre: f.Medio?.nombre || f.url,
        estado,
        ultimaCaptura: tiempoRelativo(f.ultimoCheck),
        mencionesSemana: mencionesPorMedio.get(f.medioId) || 0,
      };
    });

    // ════════════════════════════════════════════════════
    // 2. CLASIFICACION
    // ════════════════════════════════════════════════════
    const totalMenciones = await db.mencion.count();
    const clasificadas = await db.mencion.count({
      where: { tratamientoPeriodistico: { not: null } },
    });
    const porcentaje = totalMenciones > 0 ? Math.round((clasificadas / totalMenciones) * 100) : 0;

    // Lentes con coverage
    let lentes: Array<{ nombre: string; total: number; clasificadas: number; porcentaje: number }> = [];
    try {
      const lentesRaw = await db.lente.findMany({
        where: { activo: true },
        include: {
          MencionLente: {
            include: {
              Mencion: {
                select: { tratamientoPeriodistico: true },
              },
            },
          },
        },
      });

      lentes = lentesRaw.map(l => {
        const clasificadasLente = l.MencionLente.filter(ml => ml.Mencion.tratamientoPeriodistico !== null).length;
        return {
          nombre: l.nombre,
          total: l.MencionLente.length,
          clasificadas: clasificadasLente,
          porcentaje: l.MencionLente.length > 0
            ? Math.round((clasificadasLente / l.MencionLente.length) * 100)
            : 0,
        };
      });
    } catch {
      // Lente table might not exist or be empty — safe fallback
      lentes = [];
    }

    const pendientes = totalMenciones - clasificadas;

    // ════════════════════════════════════════════════════
    // 3. PRODUCCION (Entregas grouped by tipo this week)
    // ════════════════════════════════════════════════════
    const entregasSemana = await db.entrega.findMany({
      where: { fechaCreacion: { gte: weekS } },
      include: {
        contrato: { select: { cliente: { select: { nombre: true } } } },
      },
      orderBy: { fechaCreacion: 'desc' },
      take: 100,
    });

    // Group by tipo
    const productoMap = new Map<string, {
      nombre: string;
      tipo: string;
      total: number;
      enviadas: number;
      fallidas: number;
      pendientes: number;
      ultimaEdicion: string;
      mencionesUsadas: number;
    }>();

    for (const e of entregasSemana) {
      const tipo = e.tipoBoletin || 'otro';
      const nombre = PRODUCT_NAMES[tipo] || tipo;
      const existing = productoMap.get(tipo);
      if (existing) {
        existing.total++;
        if (e.estado === 'enviado') existing.enviadas++;
        else if (e.estado === 'fallido') existing.fallidas++;
        else existing.pendientes++;
        if (!existing.ultimaEdicion || e.fechaCreacion > new Date(existing.ultimaEdicion)) {
          existing.ultimaEdicion = e.fechaCreacion.toISOString();
        }
      } else {
        productoMap.set(tipo, {
          nombre,
          tipo,
          total: 1,
          enviadas: e.estado === 'enviado' ? 1 : 0,
          fallidas: e.estado === 'fallido' ? 1 : 0,
          pendientes: e.estado !== 'enviado' && e.estado !== 'fallido' ? 1 : 0,
          ultimaEdicion: e.fechaCreacion.toISOString(),
          mencionesUsadas: 0, // We can't easily get this from Entrega alone
        });
      }
    }

    // Always include all 10 standard products even if no entregas
    const standardProducts = [
      'EL_TERMOMETRO', 'SALDO_DEL_DIA', 'EL_FOCO', 'EL_ESPECIALIZADO',
      'EL_INFORME_CERRADO', 'FICHA_LEGISLADOR', 'EL_RADAR', 'EL_HILO',
      'BOLETIN_DEL_GRANO', 'VOZ_Y_VOTO',
    ];

    const semana = standardProducts.map(tipo => {
      const existing = productoMap.get(tipo);
      return {
        nombre: PRODUCT_NAMES[tipo] || tipo,
        tipo,
        estado: existing
          ? (existing.fallidas > 0 ? 'error' : existing.pendientes > 0 ? 'pending' : 'ok')
          : 'pending',
        ultimaEdicion: existing?.ultimaEdicion || null,
        mencionesUsadas: existing?.mencionesUsadas || 0,
        total: existing?.total || 0,
      };
    });

    // ════════════════════════════════════════════════════
    // 4. DISTRIBUCION (last 5 deliveries)
    // ════════════════════════════════════════════════════
    const ultimasEntregas = await db.entrega.findMany({
      where: { fechaEnvio: { not: null } },
      include: {
        contrato: {
          select: {
            cliente: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaEnvio: 'desc' },
      take: 5,
    });

    // Also check failed ones
    const ultimasFallidas = await db.entrega.findMany({
      where: { estado: 'fallido' },
      include: {
        contrato: {
          select: {
            cliente: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
      take: 5,
    });

    // Merge: take last 5 unique
    const allEntregas = [...ultimasEntregas, ...ultimasFallidas]
      .sort((a, b) => {
        const ta = a.fechaEnvio || a.fechaCreacion;
        const tb = b.fechaEnvio || b.fechaCreacion;
        return tb.getTime() - ta.getTime();
      })
      .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
      .slice(0, 5);

    const ultimos = allEntregas.map(e => ({
      id: e.id,
      producto: PRODUCT_NAMES[e.tipoBoletin] || e.tipoBoletin || 'Desconocido',
      destinatario: e.contrato?.cliente?.nombre || 'Sin cliente',
      canal: e.canal || 'email',
      timestamp: (e.fechaEnvio || e.fechaCreacion).toISOString(),
      estado: e.estado,
      error: e.error || undefined,
    }));

    const errores = await db.entrega.count({
      where: {
        estado: 'fallido',
        fechaCreacion: { gte: weekS },
      },
    });

    return NextResponse.json({
      captura: {
        hoy: mencionesHoy,
        promedioDiario,
        sinCapturaHoras,
        fuentes,
      },
      clasificacion: {
        total: totalMenciones,
        clasificadas,
        porcentaje,
        lentes,
        pendientes,
      },
      produccion: { semana },
      distribucion: {
        ultimos,
        errores,
      },
    });
  } catch (error) {
    console.error('[dashboard/status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard status' },
      { status: 500 }
    );
  }
}
