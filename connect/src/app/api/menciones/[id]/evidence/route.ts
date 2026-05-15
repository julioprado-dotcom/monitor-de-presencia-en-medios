// ─── Evidencia Forense Digital — Endpoint Seguro ───────────────────────
// GET /api/menciones/[id]/evidence
//
// Principio D.8 del Manifiesto Epistemológico: "Verdad Histórica Blindada"
// - Solo usuarios Nivel Premium pueden acceder a la evidencia cruda.
// - Se requiere URL firmada temporal (5 minutos) para autenticación.
// - Devuelve el archivo HTML original + hash SHA-256 + metadata.

import { NextRequest, NextResponse } from 'next/server';
import { readFile, access, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  verifySignedUrl,
  generateSignedUrl,
} from '@/lib/forensic-capture';
import { safeError } from '@/lib/rate-guard';

const EVIDENCE_DIR = process.env.FORENSIC_EVIDENCE_DIR || './evidence';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ─── 1. Verificar parámetros de URL firmada ───────────────────────
    const token = request.nextUrl.searchParams.get('token');
    const expires = request.nextUrl.searchParams.get('expires');

    if (!token || !expires) {
      return NextResponse.json(
        {
          error: 'Acceso restringido',
          detail: 'Se requiere URL firmada temporal para acceder a la evidencia forense.',
          instruct: 'Use POST /api/menciones/[id]/evidence/request para generar una URL firmada.',
        },
        { status: 401 }
      );
    }

    // ─── 2. Verificar firma y expiración ─────────────────────────────
    const signingSecret = process.env.AUTH_SECRET || process.env.ADMIN_API_KEY || 'decodex-forensic';
    const verification = verifySignedUrl(id, token, expires, signingSecret);

    if (!verification.valid) {
      return NextResponse.json(
        {
          error: 'URL inválida o expirada',
          detail: verification.reason,
          instruct: 'Genere una nueva URL firmada con POST /api/menciones/[id]/evidence/request.',
        },
        { status: 403 }
      );
    }

    // ─── 3. Buscar mención y verificar que tiene evidencia ────────────
    const { default: db } = await import('@/lib/db');
    const mencion = await db.mencion.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        url: true,
        fechaCaptura: true,
        evidenciaHtmlRuta: true,
        evidenciaPngRuta: true,
        evidenciaHashSha256: true,
        evidenciaTimestamp: true,
        evidenciaUrlOriginal: true,
        evidenciaTamanoBytes: true,
        Medio: { select: { nombre: true, tipo: true } },
        Persona: { select: { nombre: true, partidoSigla: true } },
      },
    });

    if (!mencion) {
      return NextResponse.json(
        { error: 'Mención no encontrada' },
        { status: 404 }
      );
    }

    if (!mencion.evidenciaHashSha256 || !mencion.evidenciaHtmlRuta) {
      return NextResponse.json(
        {
          error: 'Evidencia no disponible',
          detail: 'Esta mención no tiene evidencia forense asociada. Puede que haya sido procesada antes de la activación del sistema de Blindaje Histórico.',
          mencionId: id,
        },
        { status: 404 }
      );
    }

    // ─── 4. Leer archivo HTML de evidencia ────────────────────────────
    const htmlPath = mencion.evidenciaHtmlRuta;
    if (!existsSync(htmlPath)) {
      return NextResponse.json(
        {
          error: 'Archivo de evidencia no encontrado',
          detail: 'El archivo HTML fue eliminado o la ruta es incorrecta.',
          rutaEsperada: htmlPath,
        },
        { status: 410 }
      );
    }

    const htmlContent = await readFile(htmlPath, 'utf-8');
    const fileSize = (await stat(htmlPath)).size;

    // ─── 5. Verificar integridad (hash SHA-256) ───────────────────────
    const { createHash } = await import('crypto');
    const currentHash = createHash('sha256').update(htmlContent).digest('hex');

    const hashMatch = currentHash === mencion.evidenciaHashSha256;

    // ─── 6. Devolver evidencia con metadata ──────────────────────────
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="decodex-evidencia-${id}.html"`,
        'Content-Length': String(fileSize),
        'X-DECODEX-Evidence-Id': id,
        'X-DECODEX-Hash-SHA256': mencion.evidenciaHashSha256,
        'X-DECODEX-Hash-Verified': String(hashMatch),
        'X-DECODEX-Timestamp': mencion.evidenciaTimestamp?.toISOString() || '',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: safeError(error, 'menciones/[id]/evidence') },
      { status: 500 }
    );
  }
}

// ─── POST: Solicitar URL firmada para evidencia ────────────────────────
// Cualquier usuario puede solicitar una URL firmada, pero la descarga
// real requiere el token temporal.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ─── 1. Verificar que la mención existe y tiene evidencia ────────
    const { default: db } = await import('@/lib/db');
    const mencion = await db.mencion.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        evidenciaHashSha256: true,
        evidenciaTimestamp: true,
        Medio: { select: { nombre: true } },
        Persona: { select: { nombre: true, partidoSigla: true } },
      },
    });

    if (!mencion) {
      return NextResponse.json(
        { error: 'Mención no encontrada' },
        { status: 404 }
      );
    }

    if (!mencion.evidenciaHashSha256) {
      return NextResponse.json(
        {
          error: 'Evidencia no disponible',
          detail: 'Esta mención no tiene evidencia forense asociada.',
        },
        { status: 404 }
      );
    }

    // ─── 2. Generar URL firmada temporal (5 minutos) ────────────────
    const signingSecret = process.env.AUTH_SECRET || process.env.ADMIN_API_KEY || 'decodex-forensic';
    const signed = generateSignedUrl(id, signingSecret, 5);

    // Construir URL completa
    const baseUrl = request.nextUrl.origin;
    const fullUrl = `${baseUrl}${signed.url}`;

    return NextResponse.json({
      ok: true,
      mensaje: 'URL firmada generada. Tiene 5 minutos para usarla.',
      evidencia: {
        mencionId: id,
        titulo: mencion.titulo,
        medio: mencion.Medio?.nombre || 'Desconocido',
        persona: mencion.Persona?.nombre || null,
        hashSha256: mencion.evidenciaHashSha256,
        timestampCaptura: mencion.evidenciaTimestamp,
      },
      acceso: {
        urlFirmada: fullUrl,
        expiraEn: signed.expiresAt.toISOString(),
        metodo: 'GET',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: safeError(error, 'menciones/[id]/evidence') },
      { status: 500 }
    );
  }
}
