// GET /api/jobs/stats - Full statistics dashboard data

import { NextResponse } from 'next/server'
import { getFullStats } from '@/lib/jobs/health'
import { getSchedulerStatus } from '@/lib/jobs/scheduler'

export async function GET() {
  try {
    const [fullStats, scheduler] = await Promise.all([
      getFullStats(),
      Promise.resolve(getSchedulerStatus()),
    ])

    return NextResponse.json({
      cola: fullStats.cola,
      worker: fullStats.worker,
      checkFirst: fullStats.checkFirst,
      fuentes: fullStats.fuentes,
      scheduler,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor'
    console.error('[API /jobs/stats GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
