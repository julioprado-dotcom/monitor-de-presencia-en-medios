/**
 * POST /api/indicadores/sync
 * Seeds indicator definitions and runs Tier 1 data capture.
 */

import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { capturarTier1, seedIndicadores } from '@/lib/indicadores/capturer-tier1'

export async function POST() {
  try {
    // Step 1: Ensure all indicator definitions exist in DB
    const seeded = await seedIndicadores()

    // Step 2: Run Tier 1 capture
    const resultado = await capturarTier1()

    return NextResponse.json({
      exito: true,
      exitosos: resultado.exitosos.length,
      fallidos: resultado.fallidos.length,
      total: resultado.total,
      seeded,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Sync error:', mensaje)
    return NextResponse.json(
      { exito: false, error: mensaje },
      { status: 500 }
    )
  }
}
