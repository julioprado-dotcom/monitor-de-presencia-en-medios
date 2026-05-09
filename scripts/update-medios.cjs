const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== 1. Crear FuenteEstado para RTP ===');
  // RTP medio ya existe: cmoxmqtxk0000nhuhj5dmyhmh
  const rtpMedio = await p.medio.findFirst({ where: { nombre: 'RTP' } });
  if (rtpMedio) {
    // Actualizar URL
    await p.medio.update({
      where: { id: rtpMedio.id },
      data: { url: 'https://rtpbolivia.com.bo/' }
    });
    console.log('  URL RTP actualizada a: https://rtpbolivia.com.bo/');

    // Verificar si ya tiene FuenteEstado
    const existingFuente = await p.fuenteEstado.findFirst({ where: { medioId: rtpMedio.id } });
    if (!existingFuente) {
      const fuente = await p.fuenteEstado.create({
        data: {
          medioId: rtpMedio.id,
          tipoCheck: 'completo',
          frecuenciaBase: '*/30 6-22 * * *',
          url: 'https://rtpbolivia.com.bo/',
          activo: true,
        }
      });
      console.log('  FuenteEstado creada:', fuente.id);
    } else {
      console.log('  FuenteEstado ya existe:', existingFuente.id);
    }
  } else {
    console.log('  ERROR: RTP no encontrado');
  }

  console.log('\n=== 2. Crear Radio Sangabriel ===');
  let sangabriel = await p.medio.findFirst({ where: { nombre: 'Radio Sangabriel' } });
  if (!sangabriel) {
    sangabriel = await p.medio.create({
      data: {
        nombre: 'Radio Sangabriel',
        url: 'https://radiosangabriel.org.bo/category/noticias/',
        tipo: 'Radio',
        categoria: 'medio_tradicional',
        nivel: '2',
        pais: 'Bolivia',
        departamento: 'La Paz',
        plataformas: 'web,radio',
        notas: 'Radio comunitaria con sección de noticias',
        activo: true,
      }
    });
    console.log('  Medio creado:', sangabriel.id, sangabriel.nombre);
  } else {
    console.log('  Ya existe:', sangabriel.id);
  }
  const sfSangabriel = await p.fuenteEstado.findFirst({ where: { medioId: sangabriel.id } });
  if (!sfSangabriel) {
    await p.fuenteEstado.create({
      data: {
        medioId: sangabriel.id,
        tipoCheck: 'completo',
        frecuenciaBase: '0 */2 * * *',
        url: 'https://radiosangabriel.org.bo/category/noticias/',
        activo: true,
      }
    });
    console.log('  FuenteEstado creada');
  } else {
    console.log('  FuenteEstado ya existe');
  }

  console.log('\n=== 3. Crear El Alteño ===');
  let elalteno = await p.medio.findFirst({ where: { nombre: 'El Alteño' } });
  if (!elalteno) {
    elalteno = await p.medio.create({
      data: {
        nombre: 'El Alteño',
        url: 'https://www.elalteno.com.bo/',
        tipo: 'Periódico digital',
        categoria: 'medio_tradicional',
        nivel: '2',
        pais: 'Bolivia',
        departamento: 'La Paz',
        plataformas: 'web',
        notas: 'Periódico de El Alto',
        activo: true,
      }
    });
    console.log('  Medio creado:', elalteno.id, elalteno.nombre);
  } else {
    console.log('  Ya existe:', elalteno.id);
  }
  const sfElalteno = await p.fuenteEstado.findFirst({ where: { medioId: elalteno.id } });
  if (!sfElalteno) {
    await p.fuenteEstado.create({
      data: {
        medioId: elalteno.id,
        tipoCheck: 'completo',
        frecuenciaBase: '0 */2 * * *',
        url: 'https://www.elalteno.com.bo/',
        activo: true,
      }
    });
    console.log('  FuenteEstado creada');
  } else {
    console.log('  FuenteEstado ya existe');
  }

  console.log('\n=== 4. Verificar Kawsachun Coca ===');
  const kawsa = await p.medio.findFirst({ where: { nombre: 'Kawsachun Coca' } });
  if (kawsa) {
    // Actualizar URL si es necesario
    if (kawsa.url !== 'https://kawsachuncoca.com/noticias') {
      await p.medio.update({
        where: { id: kawsa.id },
        data: { url: 'https://kawsachuncoca.com/noticias' }
      });
      console.log('  URL actualizada a: https://kawsachuncoca.com/noticias');
    } else {
      console.log('  Ya existe con URL correcta:', kawsa.id);
    }
  } else {
    console.log('  No existe, creando...');
    const newKawsa = await p.medio.create({
      data: {
        nombre: 'Kawsachun Coca',
        url: 'https://kawsachuncoca.com/noticias',
        tipo: 'Periódico digital',
        categoria: 'independiente',
        nivel: '3',
        pais: 'Bolivia',
        departamento: 'Cochabamba',
        plataformas: 'web',
        notas: 'Medio independiente cochabambino',
        activo: true,
      }
    });
    console.log('  Medio creado:', newKawsa.id);
    const sfKawsa = await p.fuenteEstado.findFirst({ where: { medioId: newKawsa.id } });
    if (!sfKawsa) {
      await p.fuenteEstado.create({
        data: {
          medioId: newKawsa.id,
          tipoCheck: 'completo',
          frecuenciaBase: '0 */3 * * *',
          url: 'https://kawsachuncoca.com/noticias',
          activo: true,
        }
      });
      console.log('  FuenteEstado creada');
    }
  }

  console.log('\n=== 5. Ajustar Fase 1: ANF y Bolivia TV → nivel 2 ===');
  // Fase 1 toma primeros 4 de N1 por nombre asc
  // Queremos: ABI, ATB, El Deber, RTP
  // Sin ANF ni Bolivia TV en N1, los primeros 4 son: ABI, ATB, El Deber, RTP ✓

  const anf = await p.medio.findFirst({ where: { nombre: { contains: 'ANF' } } });
  if (anf) {
    await p.medio.update({ where: { id: anf.id }, data: { nivel: '2' } });
    console.log('  ANF movido a N2');
  }

  const boliviaTv = await p.medio.findFirst({ where: { nombre: { contains: 'Bolivia TV' } } });
  if (boliviaTv) {
    await p.medio.update({ where: { id: boliviaTv.id }, data: { nivel: '2' } });
    console.log('  Bolivia TV movido a N2');
  }

  console.log('\n=== 6. Verificar Fase 1 (primeros 4 N1 alfabéticamente) ===');
  const n1medios = await p.medio.findMany({
    where: { nivel: '1' },
    orderBy: { nombre: 'asc' },
    select: { nombre: true },
    take: 5,
  });
  for (const m of n1medios) {
    console.log('  ' + m.nombre);
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
