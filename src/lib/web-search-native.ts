/**
 * Native Web Search — Reemplaza zai.functions.invoke('web_search', ...)
 *
 * Motivo: El endpoint /functions/invoke del Z.ai SDK retorna 404 en producción.
 * Este módulo implementa búsqueda web nativa usando fetch() directo a Bing,
 * con parsing regex (no requiere cheerio/jsdom).
 *
 * DECODEX Bolivia — Fix production 404
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  link?: string; // alias de url (compatibilidad)
  host_name?: string;
  rank?: number;
  date?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * Busca en la web usando Bing (parsing con regex).
 * Retorna resultados en el mismo formato que zai.functions.invoke('web_search').
 *
 * @param query - Query de búsqueda
 * @param num - Número máximo de resultados (default 10)
 * @param timeoutMs - Timeout en milisegundos (default 15000)
 */
export async function webSearchNative(
  query: string,
  num: number = 10,
  timeoutMs: number = 15000,
): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.bing.com/search?q=${encodedQuery}&count=${num}&setlang=es`;

    console.log(`[web-search] Buscando: "${query.substring(0, 80)}..."`);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-BO,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'identity',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[web-search] Bing respondió ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results = parseBingResults(html, num);

    console.log(`[web-search] ${results.length} resultados para: "${query.substring(0, 60)}..."`);
    return results;
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort') || msg.includes('timeout')) {
      console.warn(`[web-search] Timeout ${timeoutMs}ms para: "${query.substring(0, 60)}..."`);
    } else {
      console.warn(`[web-search] Error: ${msg}`);
    }
    return [];
  }
}

/**
 * Parsea HTML de Bing para extraer resultados de búsqueda.
 * Usa regex porque no tenemos cheerio/jsdom disponibles.
 */
function parseBingResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Bing results están en bloques <li class="b_algo">
  // Cada bloque contiene:
  //   <a href="URL">TÍTULO</a>  (el link principal)
  //   <div class="b_caption"><p>SNIPPET</p></div>

  // Dividir por bloques de resultado
  const blocks = html.split(/<li\s+class="b_algo"/gi);

  for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
    const block = blocks[i];

    // Extraer URL del atributo href del primer <a>
    const hrefMatch = block.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>/i);
    if (!hrefMatch) continue;
    const url = decodeHTMLEntities(hrefMatch[1]);

    // Extraer título del texto dentro del <a>
    const titleMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    const title = cleanHTML(titleMatch[1]).trim();
    if (!title || title.length < 3) continue;

    // Extraer snippet del <p> dentro de b_caption
    const snippetMatch = block.match(/<div[^>]*class="b_caption"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    const snippet = snippetMatch ? cleanHTML(snippetMatch[1]).trim() : '';

    // Extraer hostname
    let hostName = '';
    try {
      hostName = new URL(url).hostname;
    } catch { /* URL inválida */ }

    results.push({
      title,
      url,
      snippet,
      link: url,
      host_name: hostName,
      rank: results.length + 1,
    });
  }

  // Fallback: si el parser de Bing no encontró nada, intentar con el formato alternativo
  if (results.length === 0) {
    return parseBingResultsFallback(html, maxResults);
  }

  return results;
}

/**
 * Parser de fallback para Bing — formato alternativo de resultados.
 * Busca patrones más genéricos de links con contextos.
 */
function parseBingResultsFallback(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  // Buscar todos los links que parecen resultados de búsqueda
  // Formato: <a href="URL" ...>Título</a> seguido de un <div> o <p> con el snippet
  const linkRegex = /<a[^>]+href="(https?:\/\/(?!www\.bing\.com|bing\.com|microsoft\.com|go\.microsoft\.com)[^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null && results.length < maxResults) {
    const url = decodeHTMLEntities(match[1]);
    const title = cleanHTML(match[2]).trim();
    const snippet = cleanHTML(match[3]).trim();

    if (title.length < 5 || url.includes('bing.com')) continue;

    let hostName = '';
    try { hostName = new URL(url).hostname; } catch { /* skip */ }

    results.push({
      title,
      url,
      snippet,
      link: url,
      host_name: hostName,
      rank: results.length + 1,
    });
  }

  return results;
}

/**
 * Limpia HTML tags y entidades de un string.
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')        // Remove HTML tags
    .replace(/&nbsp;/g, ' ')         // Non-breaking space
    .replace(/&amp;/g, '&')          // Ampersand
    .replace(/&lt;/g, '<')           // Less than
    .replace(/&gt;/g, '>')           // Greater than
    .replace(/&quot;/g, '"')         // Quote
    .replace(/&#(\d+);/g, (_, code) => // Numeric entities
      String.fromCharCode(parseInt(code, 10))
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => // Hex entities
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&apos;/g, "'")         // Apostrophe
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();
}

/**
 * Decodifica entidades HTML comunes.
 */
function decodeHTMLEntities(str: string): string {
  return cleanHTML(str);
}
