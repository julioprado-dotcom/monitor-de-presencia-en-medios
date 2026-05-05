// POST /api/jobs/worker - Pause or resume the worker

import { NextRequest, NextResponse } from 'next/server'
import { startWorker, stopWorker, getWorkerStats } from '@/lib/jobs/worker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion } = body as { accion?: string }

    if (!accion || (accion !== 'pause' && accion !== 'resume')) {
      return NextResponse.json(
        { error: 'El campo "accion" es obligatorio y debe ser "pause" o "resume"' },
        { status: 400 },
      )
    }

    if (accion === 'pause') {
      stopWorker()
      return NextResponse.json({ exito: true, estado: 'paused' })
    }

    // accion === 'resume'
    startWorker()
    return NextResponse.json({ exito: true, estado: 'running' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[API /jobs/worker POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
