const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const semana = new Date(hoy); semana.setDate(semana.getDate()-7);

  const menciones = await p.mencion.count();
  const mencionesHoy = await p.mencion.count({ where: { fechaCaptura: { gte: hoy } } });
  const mencionesSemana = await p.mencion.count({ where: { fechaCaptura: { gte: semana } } });

  const medios = await p.medio.count();
  const fuentesTotal = await p.fuenteEstado.count();
  const fuentesActivas = await p.fuenteEstado.count({ where: { activo: true } });
  const fuentesDegradadas = await p.fuenteEstado.count({ where: { fallosConsecutivos: { gte: 1 } } });

  const lentes = await p.lente.count();
  const ejes = await p.ejeTematico.count({ where: { activo: true } });
  const mencConLente = Number((await p.$queryRaw`SELECT COUNT(DISTINCT mencionId) as c FROM MencionLente`)[0]?.c || 0);
  const mencConEje = Number((await p.$queryRaw`SELECT COUNT(DISTINCT mencionId) as c FROM MencionTema`)[0]?.c || 0);
  const mencConSent = await p.mencion.count({ where: { sentimiento: { not: null, not: 'no_clasificado', not: '' } } });

  const productos = await p.reporte.count();
  const productosHoy = await p.reporte.count({ where: { fechaCreacion: { gte: hoy } } });
  const productosSemana = await p.reporte.count({ where: { fechaCreacion: { gte: semana } } });
  const porTipo = (await p.reporte.groupBy({ by: ['tipo'], _count: true })).map(x => ({ tipo: x.tipo, count: x._count }));

  const entregas = await p.entrega.count();
  const enviadas = await p.entrega.count({ where: { estado: 'enviado' } });
  const fallidas = await p.entrega.count({ where: { estado: 'fallido' } });
  const suscriptores = await p.suscriptor.count();

  const jobsTotal = await p.job.count();
  const jobsCompletados = await p.job.count({ where: { estado: 'completado' } });
  const jobsFallidos = await p.job.count({ where: { estado: 'fallido' } });

  const indicadores = await p.indicador.count();
  const indicadorValores = await p.indicadorValor.count();

  // Ultima mencion
  const ultMencion = await p.mencion.findFirst({ orderBy: { fechaCaptura: 'desc' }, select: { fechaCaptura: true } });
  // Ultimo producto
  const ultProducto = await p.reporte.findFirst({ orderBy: { fechaCreacion: 'desc' }, select: { fechaCreacion: true, tipo: true } });

  // Indicadores ONION200 - nombres
  const indicadorNombres = await p.indicador.findMany({ select: { id: true, nombre: true, slug: true, categoria: true } });

  console.log(JSON.stringify({
    captura: { menciones: { total: menciones, hoy: mencionesHoy, semana: mencionesSemana }, medios, fuentes: { total: fuentesTotal, activas: fuentesActivas, degradadas: fuentesDegradadas }, ultMencion: ultMencion?.fechaCaptura },
    clasificacion: { lentes, ejes, mencConLente, mencConEje, mencConSent },
    produccion: { productos: { total: productos, hoy: productosHoy, semana: productosSemana }, porTipo, ultProducto: ultProducto?.fechaCreacion },
    distribucion: { entregas, enviadas, fallidas, suscriptores },
    sistema: { jobs: { total: jobsTotal, completados: jobsCompletados, fallidos: jobsFallidos } },
    indicadoresONION200: { total: indicadores, valores: indicadorValores, nombres: indicadorNombres },
  }, null, 2));
}

main().then(() => p.$disconnect()).catch(e => { console.error(e.message); p.$disconnect(); });
