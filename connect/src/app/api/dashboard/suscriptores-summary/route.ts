/**
 * /api/dashboard/suscriptores-summary — Suscriptores dashboard
 * Returns subscriber counts (paid + free), weekly registrations, latest free subscribers.
 */
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { safeError } from '@/lib/rate-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalSuscriptores, totalGratuitos, activosSuscriptor, activosGratuito, registradosSemanaSuscriptor, registradosSemanaGratuito, ultimos] =
      await Promise.all([
        db.suscriptor.count(),
        db.suscriptorGratuito.count(),
        db.suscriptor.count({ where: { activo: true } }),
        db.suscriptorGratuito.count({ where: { activo: true } }),
        db.suscriptor.count({
          where: { fechaSuscripcion: { gte: startOfWeek } },
        }),
        db.suscriptorGratuito.count({
          where: { fechaSuscripcion: { gte: startOfWeek } },
        }),
        db.suscriptorGratuito.findMany({
          take: 5,
          orderBy: { fechaSuscripcion: 'desc' },
        }),
      ]);

    const ultimosMapped = ultimos.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      email: s.email,
      canal: s.canal,
      origen: s.origen,
      activo: s.activo,
      fechaSuscripcion: s.fechaSuscripcion.toISOString(),
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalSuscriptores,
      totalGratuitos,
      activos: activosSuscriptor + activosGratuito,
      registradosSemana: registradosSemanaSuscriptor + registradosSemanaGratuito,
      ultimos: ultimosMapped,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: safeError(error, 'suscriptores-summary') }, { status: 500 });
  }
}
