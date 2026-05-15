// Extraer enlaces de notas de un HTML de homepage
// DECODEX Bolivia — Pipeline optimizado: Fase 1 (SIN IA, SIN descargas extra)
//
// Busca patrones típicos de artículos en homepages de medios bolivianos:
// - <a> con href que contienen fecha, slug, /noticias/, /politica/, etc.
// - Título visible en el texto del enlace o en <h2>, <h3> adyacentes
// - Lead opcional en <p> adyacente

// ─── Interfaces ────────────────────────────────────────────────

export interface NotaLink {
  url: string
  titulo: string
  lead?: string
  fecha?: string
}

// ─── Patrones de URLs de artículos por medio ──────────────────
// Estos patrones identifican links que probablemente son notas (no navegación)

const PATRONES_NOTA = [
  // Patrones genéricos de artículos
  /\/\d{4}\/\d{2}\/\d{2}/,          // /2026/05/10/
  /\/noticia[s]?[-/]/i,               // /noticias/ /noticia-
  /\/politica[-/]/i,                  // /politica/
  /\/economia[-/]/i,                  // /economia/
  /\/sociedad[-/]/i,                  // /sociedad/
  /\/nacional[-/]/i,                  // /nacional/
  /\/departamental[-/]/i,             // /departamental/
  /\/opinion[-/]/i,                   // /opinion/
  /\/editorial[-/]/i,                 // /editorial/
  /\/entretenimiento[-/]/i,           // /entretenimiento/
  /\/deportes[-/]/i,                  // /deportes/
  /\/seguridad[-/]/i,                 // /seguridad/
  /\/mundo[-/]/i,                     // /mundo/
  /\/investigacion[-/]/i,             // /investigacion/
  /\/informe[-/]/i,                   // /informe/
  // Patrones con slugs (típicos de CMS)
  /\/[a-z]+-[a-z]+-\d{4,}/,          // /gobierno-anuncia-12345
  // Id numérico alto (artículo ID en muchos CMS)
  /\/\d{5,}\/?$/,
]

// Patrones a EXCLUIR (navegación, tags, categorías, etc.)
const PATRONES_EXCLUIR = [
  /^#/,                              // anclas
  /\/tag[s]?[-/]/i,                  // /tags/
  /\/categoria[s]?[-/]/i,            // /categorias/
  /\/autor[-/]/i,                    // /autor/
  /\/pagina[-/]/i,                   // /pagina/ /pag/
  /\/buscar/i,                       // /buscar
  /\/contacto/i,                     // /contacto
  /\/publicidad/i,                   // /publicidad
  /\/aviso[-s]?-legal/i,             // /aviso-legal
  /\/politica-de-privacidad/i,       // /politica-de-privacidad
  /\/terminos[-s]?[-/]/i,            // /terminos/
  /\/suscribir/i,                    // /suscribir
  /\/login/i,                        // /login
  /\/register/i,                     // /register
  /\/rss/i,                          // /rss
  /\/feed/i,                         // /feed
  /\/sitemap/i,                      // /sitemap
  /\/redes-sociales/i,               // /redes-sociales
  /\/whatsapp/i,                     // /whatsapp
  /\/telegram/i,                     // /telegram
  /\.(jpg|jpeg|png|gif|svg|webp|pdf|mp4|mp3)$/i,  // archivos multimedia
  /\/(css|js|fonts|images|assets|static|media)\//i, // recursos estáticos
  /facebook\.com/i,
  /twitter\.com/i,
  /x\.com/i,
  /instagram\.com/i,
  /tiktok\.com/i,
  /youtube\.com/i,
  /t\.me\//i,
  /wa\.me\//i,
  /api\./i,
]

// ─── Función principal ───────────────────────────────────────

/**
 * Extrae enlaces de notas de un HTML de homepage.
 * Retorna hasta `maxLinks` enlaces únicos, ordenados por posición en el HTML.
 */
export function extraerLinksDeNoticias(
  html: string,
  baseUrl: string,
  maxLinks = 40,
): NotaLink[] {
  // Normalizar baseUrl
  const base = normalizeUrl(baseUrl)
  const baseDomain = extractDomain(base)

  // Extraer todos los <a> con href y texto
  const links = extractAllLinks(html)
  if (links.length === 0) return []

  // Filtrar: solo los que parecen notas de artículo
  const candidatos = links.filter(link => {
    const href = link.href
    if (!href || href.length < 10) return false

    // Excluir patrones de navegación
    for (const pat of PATRONES_EXCLUIR) {
      if (pat.test(href)) return false
    }

    // Debe ser del mismo dominio o dominio permitido
    if (!isRelevantDomain(href, baseDomain)) return false

    // Texto del enlace debe ser sustancial (no solo iconos)
    const texto = (link.text || '').trim()
    if (texto.length < 8) return false

    // Debe parecer un artículo (al menos un patrón de nota, O tiene un título largo)
    const hasPattern = PATRONES_NOTA.some(p => p.test(href))
    const hasSubstantialTitle = texto.length >= 30

    return hasPattern || hasSubstantialTitle
  })

  // Deduplicar por URL normalizada
  const seen = new Set<string>()
  const unicos: NotaLink[] = []

  for (const link of candidatos) {
    const fullUrl = resolveUrl(link.href, base)
    const normalized = normalizeUrl(fullUrl)

    if (seen.has(normalized)) continue
    seen.add(normalized)

    // Intentar extraer fecha de la URL
    const fecha = extractFechaFromUrl(fullUrl)

    unicos.push({
      url: fullUrl,
      titulo: cleanTitle(link.text),
      fecha: fecha || undefined,
    })
  }

  return unicos.slice(0, maxLinks)
}

/**
 * Extraer el lead/párrafo inicial de una nota dentro de su bloque HTML.
 * Busca el <p> más cercano al enlace del artículo.
 */
export function extraerLeadDeBloque(html: string, articleUrl: string): string {
  // Buscar el enlace del artículo en el HTML
  const urlEscaped = articleUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // Buscar bloques <article>, <div class="..."> que contengan el enlace
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*(?:post|card|article|nota|story|new|entry)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*(?:post|card|article|nota|story|new|entry)[^"]*"[^>]*>([\s\S]{200,2000}?)<\/div>/gi,
  ]

  for (const pattern of articlePatterns) {
    const match = pattern.exec(html)
    if (match) {
      const bloque = match[1]
      // Extraer primer <p> significativo
      const pMatch = bloque.match(/<p[^>]*>([\s\S]{30,300}?)<\/p>/i)
      if (pMatch) {
        return cleanText(pMatch[1]).substring(0, 300)
      }
    }
  }

  return ''
}

// ─── Helpers internos ────────────────────────────────────────

interface RawLink {
  href: string
  text: string
}

function extractAllLinks(html: string): RawLink[] {
  const links: RawLink[] = []
  // Regex para <a href="...">texto</a>
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim()
    const text = stripTags(match[2]).trim()
    links.push({ href, text })
  }

  return links
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanTitle(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    // Normalizar: quitar trailing slash, fragment, ordenar params
    let path = u.pathname.replace(/\/+$/, '') || '/'
    // Lowercase path
    path = path.toLowerCase()
    return `${u.protocol}//${u.hostname}${path}`
  } catch {
    return url.toLowerCase().replace(/\/+$/, '')
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function resolveUrl(href: string, base: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href
  }
  if (href.startsWith('//')) {
    return 'https:' + href
  }
  try {
    return new URL(href, base).href
  } catch {
    return base + (href.startsWith('/') ? '' : '/') + href
  }
}

function isRelevantDomain(href: string, baseDomain: string): boolean {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    const domain = extractDomain(href)
    // Mismo dominio o subdominio
    return domain === baseDomain || domain.endsWith('.' + baseDomain)
  }
  // URLs relativas siempre son del mismo dominio
  return true
}

function extractFechaFromUrl(url: string): string | null {
  // Patrones: /2026/05/10/, /2026-05-10-, 20260510
  const datePatterns = [
    /\/(\d{4})\/(\d{2})\/(\d{2})/,       // /2026/05/10/
    /\/(\d{4})-(\d{2})-(\d{2})/,         // /2026-05-10-
    /(\d{4})(\d{2})(\d{2})\D/,            // 20260510-
  ]

  for (const pat of datePatterns) {
    const match = url.match(pat)
    if (match) {
      const [, y, m, d] = match
      // Validar fecha
      const year = parseInt(y)
      const month = parseInt(m)
      const day = parseInt(d)
      if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${y}-${m}-${d}`
      }
    }
  }

  return null
}
