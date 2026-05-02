import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Total personas monitoreadas
    const totalPersonas = await db.persona.count({ where: { activa: true } });

    // Total medios activos
    const fuentesActivas = await db.medio.count({ where: { activo: true } });

    // Menciones hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const mencionesHoy = await db.mencion.count({
      where: {
        fechaCaptura: { gte: hoy, lt: manana },
      },
    });

    // Menciones esta semana
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);
    inicioSemana.setHours(0, 0, 0, 0);

    const mencionesSemana = await db.mencion.count({
      where: { fechaCaptura: { gte: inicioSemana } },
    });

    // Reportes generados
    const totalReportes = await db.reporte.count();

    // Enlaces rotos
    const enlacesRotos = await db.mencion.count({
      where: { enlaceActivo: false },
    });

    // Total comentarios
    const totalComentarios = await db.comentario.count();

    // Total ejes activos
    const totalEjes = await db.ejeTematico.count({ where: { activo: true } });

    // Top 10 actores con más menciones esta semana
    const topActores = await db.mencion.groupBy({
      by: ['personaId'],
      where: { fechaCaptura: { gte: inicioSemana } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topActoresData = await Promise.all(
      topActores.map(async (item) => {
        const persona = await db.persona.findUnique({
          where: { id: item.personaId },
          select: { id: true, nombre: true, partidoSigla: true, camara: true, departamento: true },
        });

        // Sentimiento de las menciones de esta persona esta semana
        const mencionesPersona = await db.mencion.findMany({
          where: { personaId: item.personaId, fechaCaptura: { gte: inicioSemana } },
          select: { sentimiento: true, temas: true },
        });

        const sentimientoCount: Record<string, number> = {};
        const temasCount: Record<string, number> = {};
        for (const m of mencionesPersona) {
          const s = m.sentimiento || 'no_clasificado';
          sentimientoCount[s] = (sentimientoCount[s] || 0) + 1;
          // temas es un string con temas separados por coma
          if (m.temas) {
            for (const t of m.temas.split(',').map((x) => x.trim()).filter(Boolean)) {
              temasCount[t] = (temasCount[t] || 0) + 1;
            }
          }
        }
        const sentimientoTop = Object.entries(sentimientoCount)
          .sort(([, a], [, b]) => b - a)[0] || ['no_clasificado', 0];
        const temasTop = Object.entries(temasCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([tema, count]) => ({ tema, count }));

        // Ejes temáticos principales (via MencionTema → EjeTematico)
        const ejesMenciones = await db.mencionTema.findMany({
          where: { mencion: { personaId: item.personaId, fechaCaptura: { gte: inicioSemana } } },
          include: { ejeTematico: { select: { id: true, nombre: true, slug: true, color: true } } },
        });
        const ejesCount: Record<string, { nombre: string; slug: string; color: string; count: number }> = {};
        for (const em of ejesMenciones) {
          const key = em.ejeTematico.id;
          if (!ejesCount[key]) {
            ejesCount[key] = { nombre: em.ejeTematico.nombre, slug: em.ejeTematico.slug, color: em.ejeTematico.color, count: 0 };
          }
          ejesCount[key].count++;
        }
        const ejesTop = Object.values(ejesCount)
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        return {
          ...persona,
          mencionesCount: item._count.id,
          sentimiento: {
            dominante: sentimientoTop[0],
            distribucion: sentimientoCount,
          },
          ejesTematicos: ejesTop,
          temasEspecificos: temasTop,
        };
      })
    );

    // Menciones por partido
    const mencionesPorPartidoRaw = await db.mencion.findMany({
      where: { fechaCaptura: { gte: inicioSemana } },
      include: {
        persona: { select: { partidoSigla: true } },
      },
    });

    const partidoCount: Record<string, number> = {};
    for (const m of mencionesPorPartidoRaw) {
      const sigla = m.persona.partidoSigla || 'Sin partido';
      partidoCount[sigla] = (partidoCount[sigla] || 0) + 1;
    }

    const mencionesPorPartido = Object.entries(partidoCount)
      .map(([partido, count]) => ({ partido, count }))
      .sort((a, b) => b.count - a.count);

    // Últimas menciones
    const ultimasMenciones = await db.mencion.findMany({
      take: 15,
      orderBy: { fechaCaptura: 'desc' },
      include: {
        persona: { select: { id: true, nombre: true, partidoSigla: true, camara: true } },
        medio: { select: { id: true, nombre: true, tipo: true } },
      },
    });

    // Distribución por cámara
    const diputados = await db.persona.count({ where: { camara: 'Diputados', activa: true } });
    const senadores = await db.persona.count({ where: { camara: 'Senadores', activa: true } });

    // Clientes activos
    const clientesActivos = await db.cliente.count({ where: { estado: 'activo' } });

    // Contratos vigentes
    const contratosVigentes = await db.contrato.count({ where: { estado: 'activo' } });

    // Entregas hoy (enviadas en las últimas 24h)
    const entregasHoy = await db.entrega.count({
      where: {
        estado: 'enviado',
        fechaEnvio: { gte: hoy, lt: manana },
      },
    });

    // Estado de fuentes — CapturaLog por nivel (última captura de cada nivel)
    const fuentesPorNivel = await Promise.all(
      ['1', '2', '3', '4', '5'].map(async (nivel) => {
        const captura = await db.capturaLog.findFirst({
          where: { nivel },
          orderBy: { fecha: 'desc' },
        });
        const mediosCount = await db.medio.count({ where: { nivel, activo: true } });
        const capturasHoy = await db.capturaLog.count({
          where: {
            nivel,
            fecha: { gte: hoy, lt: manana },
          },
        });
        return {
          nivel,
          mediosCount,
          ultimaCaptura: captura?.fecha || null,
          ultimaExitosa: captura?.exitosa || false,
          ultimoTotalArticulos: captura?.totalArticulos || 0,
          ultimoMencionesEncontradas: captura?.mencionesEncontradas || 0,
          capturasHoy,
        };
      })
    );

    // Medios totales por nivel
    const mediosPorNivel = await Promise.all(
      ['1', '2', '3', '4', '5'].map(async (nivel) => ({
        nivel,
        total: await db.medio.count({ where: { nivel } }),
        activos: await db.medio.count({ where: { nivel, activo: true } }),
      }))
    );

    // Alertas por tipo (últimas 24h)
    const alertasNegativas = await db.reporte.count({
      where: {
        tipo: 'ALERTA_TEMPRANA',
        sentimientoComentarios: { contains: 'negativo' },
        fechaCreacion: { gte: hoy },
      },
    });
    const alertasPositivas = await db.reporte.count({
      where: {
        tipo: 'ALERTA_TEMPRANA',
        sentimientoComentarios: { contains: 'positivo' },
        fechaCreacion: { gte: hoy },
      },
    });
    const alertasNeutras = await db.reporte.count({
      where: {
        tipo: 'ALERTA_TEMPRANA',
        fechaCreacion: { gte: hoy },
        NOT: [
          { sentimientoComentarios: { contains: 'positivo' } },
          { sentimientoComentarios: { contains: 'negativo' } },
        ],
      },
    });

    // Última alerta registrada
    const ultimaAlerta = await db.reporte.findFirst({
      where: { tipo: 'ALERTA_TEMPRANA' },
      orderBy: { fechaCreacion: 'desc' },
      select: { id: true, fechaCreacion: true, resumen: true, sentimientoComentarios: true },
    });

    return NextResponse.json({
      totalPersonas,
      totalMedios: fuentesActivas,
      mencionesHoy,
      mencionesSemana,
      totalReportes,
      enlacesRotos,
      totalComentarios,
      totalEjes,
      topActores: topActoresData,
      mencionesPorPartido,
      ultimasMenciones,
      distribucionCamara: { diputados, senadores },
      clientesActivos,
      contratosVigentes,
      entregasHoy,
      fuentesPorNivel,
      mediosPorNivel,
      alertas: {
        negativasHoy: alertasNegativas,
        positivasHoy: alertasPositivas,
        neutrasHoy: alertasNeutras,
        ultimaAlerta: ultimaAlerta || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
