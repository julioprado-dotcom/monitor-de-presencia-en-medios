// GET /api/jobs/fuentes - List all source states (FuenteEstado)

import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const fuentes = await db.fuenteEstado.findMany({
      include: {
        medio: {
          select: {
            id: true,
            nombre: true,
            url: true,
          },
        },
      },
      orderBy: { ultimoCheck: 'desc' },
    })

    return NextResponse.json(fuentes)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[API /jobs/fuentes GET]', msg)
    // Return empty array with 200 on DB failure
    return NextResponse.json([])
  }
}
