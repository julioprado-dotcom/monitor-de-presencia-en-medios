// Z.ai Fetcher — Fetch nativo de páginas web
// Reemplaza zai.functions.invoke('page_reader') que retornaba 404.
// Usa fetch() directo con TLS workaround y headers de browser.
// DECODEX Bolivia

import type { CheckResult } from '../types'

// ─── Interfaz ───────────────────────────────────────────────────

interface ZaiPageResult {
  title: string
  url: string
  html: string
  publishedTime?: string
  usage?: { tokens: number }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ─── Función principal ─────────────────────────────────────────

/**
 * Obtiene el contenido de una URL usando fetch() nativo.
 * Esto bypassa las limitaciones de red del container y NO depende
 * del endpoint /functions/invoke del Z.ai SDK (que retorna 404).
 *
 * Retorna null si falla (no lanza excepción).
 */
export async function zaiFetch(url: string, timeoutMs = 30000): Promise<ZaiPageResult | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    const controller = new AbortController()
    timeoutId = setTimeout(() => {
      controller.abort()
      console.warn(`[Fetch] Timeout ${timeoutMs}ms reached for ${url}`)
    }, timeoutMs)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-BO,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    // Si llegamos aqui, fetch respondió a tiempo — limpiar timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }

    if (!response.ok) {
      console.warn(`[Fetch] HTTP ${response.status} para ${url}`)
      return null
    }

    const html = await response.text()
    const htmlLength = html.length

    if (htmlLength === 0) {
      console.warn(`[Fetch] HTML vacio para ${url}`)
      return null
    }

    // Extraer título del HTML
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : ''

    // Intentar extraer fecha de publicación
    let publishedTime: string | undefined
    const dateMatch = html.match(/(?:article:published_time|datePublished|publish-date)["\s]*content=["']([^"']+)/i)
    if (dateMatch) publishedTime = dateMatch[1]
    if (!publishedTime) {
      const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)/i)
      if (timeMatch) publishedTime = timeMatch[1]
    }

    console.log(
      `[Fetch] OK ${url} — "${title.substring(0, 50)}" ` +
      `(${htmlLength} chars)` +
      (publishedTime ? ` pub:${publishedTime}` : '')
    )

    return {
      title,
      url: response.url || url,
      html,
      publishedTime,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('abort') || msg.includes('timeout')) {
      console.warn(`[Fetch] Timeout ${timeoutMs}ms para ${url}`)
    } else {
      console.warn(`[Fetch] Error ${url}: ${msg}`)
    }
    return null
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }
}

/**
 * Obtiene texto plano de una URL usando fetch() nativo.
 * Ideal para pasar directo al LLM sin parsear HTML.
 */
export async function zaiFetchText(url: string, timeoutMs = 30000): Promise<{
  title: string
  text: string
  url: string
  publishedTime?: string
} | null> {
  const page = await zaiFetch(url, timeoutMs)
  if (!page) return null

  // Convertir HTML a texto plano (básico pero funcional)
  const text = page.html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, ' ')
    .trim()

  return {
    title: page.title,
    text,
    url: page.url,
    publishedTime: page.publishedTime,
  }
}

/**
 * Calcula un hash SHA-256 del contenido HTML de una URL via fetch nativo.
 * Útil para detección de cambios (fingerprint remoto).
 */
export async function zaiFingerprint(url: string): Promise<{
  hash: string
  title: string
  length: number
  html?: string
} | null> {
  const page = await zaiFetch(url)
  if (!page) return null

  // Normalizar para fingerprint: mismo approach que fingerprint.ts
  const normalized = page.html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\d{13}/g, '') // timestamps
    .replace(/"csrf[^"]*"\s*:\s*"[^"]*"/gi, '')
    .replace(/"nonce[^"]*"\s*:\s*"[^"]*"/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const hash = await sha256(normalized)

  return {
    hash,
    title: page.title,
    length: normalized.length,
    html: page.html, // pasar HTML para que scrape-fuente lo reutilice
  }
}

// ─── Utilidades ────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
