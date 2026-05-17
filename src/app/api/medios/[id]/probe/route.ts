import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { withAuth } from '@/lib/auth-helpers';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await withAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const medio = await db.medio.findUnique({
      where: { id },
      include: { FuenteEstado: true },
    });
    if (!medio) {
      return NextResponse.json({ error: 'Medio no encontrado' }, { status: 404 });
    }

    const url = medio.url || medio.FuenteEstado?.url || '';
    const logs: Array<{ step: string; status: 'ok' | 'error' | 'warn'; message: string; ms?: number }> = [];

    // Step 1: URL check
    const t0 = Date.now();
    if (!url) {
      logs.push({ step: 'URL', status: 'error', message: 'Sin URL configurada', ms: 0 });
      await db.medio.update({ where: { id }, data: { ultimoError: 'Sin URL configurada' } });
      return NextResponse.json({ medioId: id, nombre: medio.nombre, url, logs, success: false });
    }

    // Step 2: DNS/Domain resolution via fetch
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
      logs.push({ step: 'DNS', status: 'ok', message: `Dominio resuelto: ${hostname}`, ms: Date.now() - t0 });
    } catch {
      logs.push({ step: 'DNS', status: 'error', message: 'URL inválida (no se pudo parsear)', ms: Date.now() - t0 });
      await db.medio.update({ where: { id }, data: { ultimoError: 'URL inválida' } });
      return NextResponse.json({ medioId: id, nombre: medio.nombre, url, logs, success: false });
    }

    // Step 3: HTTP connection
    const t1 = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'DECODEX-Probe/1.0' },
      });
      clearTimeout(timeout);
      const ms = Date.now() - t1;
      if (res.ok || res.status === 301 || res.status === 302 || res.status === 304) {
        logs.push({ step: 'HTTP', status: 'ok', message: `HTTP ${res.status} — ${ms}ms`, ms });
      } else {
        logs.push({ step: 'HTTP', status: 'warn', message: `HTTP ${res.status} — ${ms}ms`, ms });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      const isTimeout = msg.includes('abort') || msg.includes('timeout') || msg.includes('Timeout');
      logs.push({
        step: 'HTTP',
        status: 'error',
        message: isTimeout ? `Timeout tras ${Date.now() - t1}ms` : msg,
        ms: Date.now() - t1,
      });
    }

    // Step 4: Try RSS detection
    const t2 = Date.now();
    try {
      const rssUrl = url.endsWith('/feed') || url.endsWith('/rss') ? url :
        url.replace(/\/$/, '') + '/feed';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(rssUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DECODEX-Probe/1.0' },
      });
      clearTimeout(timeout);
      const text = await res.text();
      const itemCount = (text.match(/<item[\s>]/g) || (text.match(/<entry[\s>]/g))).length;
      if (itemCount > 0) {
        logs.push({ step: 'RSS', status: 'ok', message: `${itemCount} items encontrados en feed`, ms: Date.now() - t2 });
      } else if (res.ok) {
        logs.push({ step: 'RSS', status: 'warn', message: 'Feed accesible pero sin items', ms: Date.now() - t2 });
      } else {
        logs.push({ step: 'RSS', status: 'warn', message: `Feed no disponible (HTTP ${res.status})`, ms: Date.now() - t2 });
      }
    } catch {
      logs.push({ step: 'RSS', status: 'warn', message: 'No se pudo verificar feed RSS', ms: Date.now() - t2 });
    }

    // Step 5: FuenteEstado sync
    const hasError = logs.some(l => l.status === 'error');
    const hasOk = logs.some(l => l.status === 'ok' && l.step === 'HTTP');
    if (medio.FuenteEstado) {
      const updateData: Record<string, unknown> = {};
      if (hasOk) {
        updateData.ultimoCheckOk = new Date();
        updateData.ultimoError = '';
      }
      if (hasError && !hasOk) {
        const errorMsg = logs.filter(l => l.status === 'error').map(l => l.message).join('; ');
        updateData.ultimoError = errorMsg;
      }
      if (Object.keys(updateData).length > 0) {
        await db.fuenteEstado.update({ where: { medioId: id }, data: updateData }).catch(() => {});
      }
    }

    // Update medio ultimoError
    const errorMsgs = logs.filter(l => l.status === 'error').map(l => l.message);
    await db.medio.update({
      where: { id },
      data: { ultimoError: errorMsgs.length > 0 ? errorMsgs.join('; ') : '' },
    }).catch(() => {});

    const success = hasOk && !hasError;
    return NextResponse.json({
      medioId: id,
      nombre: medio.nombre,
      url,
      logs,
      success,
      estado: medio.FuenteEstado?.estado || 'sin_estado',
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Error interno' }, { status: 500 });
  }
}
