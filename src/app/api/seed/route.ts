import { NextResponse } from 'next/server';
import db from '@/lib/db';

const EJES_TEMATICOS = [
  { nombre: 'Hidrocarburos, Energía y Combustible', slug: 'hidrocarburos-energia', icono: '⛽', color: '#f59e0b', orden: 1, keywords: 'gas,petróleo,YPFB,litio,electricidad,subsidio,gasolina,diésel,hidrocarburo,regalías,Ley de Hidrocarburos' },
  { nombre: 'Movimientos Sociales y Conflictividad', slug: 'movimientos-sociales', icono: '✊', color: '#ef4444', orden: 2, keywords: 'bloqueo,marcha,paro,protesta,COB,CSUTCB,CSCB,CONAMAQ,FNMCB,conflicto,movilización,transportistas,magisterio' },
  { nombre: 'Gobierno, Oposición e Instituciones', slug: 'gobierno-oposicion', icono: '🏛️', color: '#3b82f6', orden: 3, keywords: 'Asamblea,diputado,senador,ley,banca,bloque,partido,elección,gobierno,oposición,presidente,ministro' },
  { nombre: 'Corrupción e Impunidad', slug: 'corrupcion-impunidad', icono: '🔥', color: '#dc2626', orden: 4, keywords: 'corrupción,denuncia,auditoría,Fondo Indígena,irregularidad,desvío,Fiscalía,nepotismo,comisión de verdad,YPFB' },
  { nombre: 'Economía y Política Económica', slug: 'economia', icono: '💰', color: '#10b981', orden: 5, keywords: 'inflación,tipo de cambio,dólar,PIB,exportación,importación,reservas,empresa estatal,presupuesto,empleo' },
  { nombre: 'Justicia y Derechos Humanos', slug: 'justicia-derechos', icono: '⚖️', color: '#6366f1', orden: 6, keywords: 'justicia,Fiscalía,Tribunal,sentencia,detención,derechos humanos,preso,judicialización,delito,policía' },
  { nombre: 'Procesos Electorales', slug: 'procesos-electorales', icono: '🗳️', color: '#8b5cf6', orden: 7, keywords: 'elección,TSE,OEP,observación,urnas,voto,candidato,comicio,electoral,escrutinio' },
  { nombre: 'Educación, Universidades y Cultura', slug: 'educacion-cultura', icono: '📚', color: '#06b6d4', orden: 8, keywords: 'educación,universidad,magisterio,presupuesto,estudiantes,strike,escuela,colegio,cultura,patrimonio' },
  { nombre: 'Salud y Servicios Públicos', slug: 'salud-servicios', icono: '🏥', color: '#ec4899', orden: 9, keywords: 'salud,hospital,medicamentos,Seguro,COVID,médicos,enfermeros,sistema de salud' },
  { nombre: 'Medio Ambiente, Territorio y Recursos', slug: 'medio-ambiente', icono: '🌍', color: '#22c55e', orden: 10, keywords: 'medio ambiente,agua,incendios,autonomías,minería,deforestación,territorio,concesión,litio,Pachamama' },
  { nombre: 'Relaciones Internacionales', slug: 'relaciones-internacionales', icono: '🌎', color: '#0ea5e9', orden: 11, keywords: 'relaciones,frontera,migración,embajada,cooperación,tratado,diplomacia,EEUU,Chile,Unión Europea' },
];

export async function POST() {
  try {
    const existing = await db.persona.count();

    if (existing > 0) {
      return NextResponse.json({
        message: 'Base de datos ya contiene datos',
        personas: existing,
        medios: await db.medio.count(),
        ejes: await db.ejeTematico.count(),
      });
    }

    const fs = await import('fs');
    const path = await import('path');

    // 1. Seed ejes temáticos
    const ejesResult = [];
    for (const eje of EJES_TEMATICOS) {
      const created = await db.ejeTematico.create({ data: eje });
      ejesResult.push(created);
    }

    // 2. Seed medios from medios.json
    const mediosPath = path.join(process.cwd(), 'data', 'medios.json');
    const mediosRaw = fs.readFileSync(mediosPath, 'utf-8');
    const medios: Array<Record<string, string>> = JSON.parse(mediosRaw);

    const mediosResult = [];
    for (const medio of medios) {
      const created = await db.medio.create({
        data: {
          nombre: medio.nombre,
          url: medio.url || '',
          tipo: medio.tipo,
          nivel: String(medio.nivel || '1'),
          departamento: medio.departamento || null,
          plataformas: medio.plataformas || '',
          notas: medio.notas || '',
        },
      });
      mediosResult.push(created);
    }

    // 3. Seed legisladores from legisladores_2025_2030.json (solo titulares)
    const legisPath = path.join(process.cwd(), 'data', 'legisladores_2025_2030.json');
    const legisRaw = fs.readFileSync(legisPath, 'utf-8');
    const legisladores: Array<Record<string, string>> = JSON.parse(legisRaw);
    const titulares = legisladores.filter(l => l.tipo?.toUpperCase() === 'TITULAR');

    const personasResult = [];
    for (const leg of titulares) {
      const persona = await db.persona.create({
        data: {
          nombre: (leg.nombre || '').replace(/\s+/g, ' ').trim(),
          camara: leg.camara === 'Senadores' ? 'Senadores' : 'Diputados',
          departamento: leg.departamento || '',
          partido: leg.partido || '',
          partidoSigla: leg.partidoSigla || '',
          tipo: 'Titular',
          periodo: '2025-2030',
        },
      });
      personasResult.push(persona);
    }

    return NextResponse.json({
      message: 'Seed ejecutado correctamente (v0.5.0)',
      ejesInsertados: ejesResult.length,
      mediosInsertados: mediosResult.length,
      personasInsertadas: personasResult.length,
      desglose: {
        diputados: titulares.filter(l => l.camara === 'Diputados').length,
        senadores: titulares.filter(l => l.camara === 'Senadores').length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al ejecutar seed', details: message },
      { status: 500 }
    );
  }
}
