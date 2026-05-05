// GET /api/jobs/fuentes/[id] - Single source state detail
// PUT /api/jobs/fuentes/[id] - Update frequency override

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const fuente = await db.fuenteEstado.findUnique({
      where: { id },
      include: { medio: true },
    })

    if (!fuente) {
      return NextResponse.json({ error: 'Fuente no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ fuente })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[API /jobs/fuentes/[id] GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { frecuenciaOverride, activo } = body as {
      frecuenciaOverride?: string
      activo?: boolean
    }

    // Build update data with only provided fields
    const data: Record<string, unknown> = {}
    if (frecuenciaOverride !== undefined) data.frecuenciaBase = frecuenciaOverride
    if (activo !== undefined) data.activo = activo

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 },
      )
    }

    const fuente = await db.fuenteEstado.update({
      where: { id },
      data,
      include: { medio: true },
    })

    return NextResponse.json({ exito: true, fuente })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[API /jobs/fuentes/[id] PUT]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
