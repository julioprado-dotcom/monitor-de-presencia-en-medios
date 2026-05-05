import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware de seguridad — protege TODAS las rutas API destructivas
 * con validación REAL de JWT (no solo presencia del token).
 *
 * Usa `jose` (Edge-compatible) para verificar firma JWT contra AUTH_SECRET.
 * NO invoca auth() — no necesita DB. Compatible con Edge Runtime.
 * NO agrega headers de seguridad (preserva iframe proxy Z.ai).
 *
 * Estrategia de autenticación:
 * - Bearer token → verificación JWT contra AUTH_SECRET
 * - Cookie de sesión NextAuth → verificación JWT del token de sesión
 * - Fallback presencial → solo si AUTH_SECRET no está configurado (dev)
 */

// ── Endpoints públicos específicos por método ──────────────────
const PUBLIC_ENDPOINTS: Array<{ path: string; methods: string[] }> = [
  { path: '/api/auth/',                     methods: ['GET', 'POST'] },
  { path: '/api/suscriptores',              methods: ['GET', 'POST'] },
  { path: '/api/search',                    methods: ['GET', 'POST'] },
  { path: '/api/medios/health',             methods: ['GET'] },
  { path: '/api/stats',                     methods: ['GET'] },
  { path: '/api/indicadores/historico',     methods: ['GET'] },
  { path: '/api/indicadores',               methods: ['GET'] },
  { path: '/api/medios',                    methods: ['GET'] },
  { path: '/api/personas',                  methods: ['GET'] },
  { path: '/api/reportes/stats',            methods: ['GET'] },
  { path: '/api/reportes/generator-data',   methods: ['GET'] },
  { path: '/api/ejes',                      methods: ['GET'] },
  { path: '/api/menciones',                 methods: ['GET'] },
  { path: '/api/entregas',                  methods: ['GET'] },
  { path: '/api/jobs/stats',                methods: ['GET'] },
  { path: '/api/jobs/fuentes',              methods: ['GET'] },
];

// ── Rutas que SIEMPRE requieren auth (todos los métodos) ──────
const ALWAYS_PROTECTED: string[] = [
  '/api/admin/',
  '/api/seed',
  '/api/auth/setup',
];

// ── Rutas GET que exponen PII y requieren auth ─────────────────
const PII_PROTECTED_GET: string[] = [
  '/api/clientes',
  '/api/contratos',
];

const DESTRUCTIVE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ── AUTH_SECRET cache ──────────────────────────────────────────
let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array | null {
  if (_secret) return _secret;
  const env = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!env) return null;
  _secret = new TextEncoder().encode(env);
  return _secret;
}

// ── Helpers ──────────────────────────────────────────────────────

function isPublicEndpoint(pathname: string, method: string): boolean {
  return PUBLIC_ENDPOINTS.some(
    (e) => pathname.startsWith(e.path) && e.methods.includes(method)
  );
}

function isAlwaysProtected(pathname: string): boolean {
  return ALWAYS_PROTECTED.some((r) => pathname.startsWith(r));
}

/**
 * Extrae el token JWT de un header Authorization Bearer.
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Extrae el token JWT de las cookies de sesión NextAuth / Auth.js v5.
 */
function extractSessionToken(cookies: { get: (name: string) => { value: string } | undefined }): string | null {
  // NextAuth v4 cookie names
  const v4 = cookies.get('next-auth.session-token');
  if (v4?.value) return v4.value;

  // NextAuth v5 / Auth.js cookie names
  const v5 = cookies.get('authjs.session-token');
  if (v5?.value) return v5.value;

  // Secure variants (HTTPS)
  const secureV5 = cookies.get('__Secure-authjs.session-token');
  if (secureV5?.value) return secureV5.value;

  const secureV4 = cookies.get('__Secure-next-auth.session-token');
  if (secureV4?.value) return secureV4.value;

  return null;
}

/**
 * Verificación REAL de JWT usando jose + AUTH_SECRET.
 * Edge-compatible, no requiere acceso a DB.
 * Retorna true solo si el token tiene firma válida.
 */
async function verifyJwt(token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) {
    // Sin AUTH_SECRET configurado, fallar cerrado (no permitir bypass)
    return false;
  }

  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verificación de autenticación con JWT real.
 * Extrae token de Bearer header o cookies de sesión,
 * luego verifica su firma contra AUTH_SECRET.
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // 1. Intentar Bearer token
  const bearerToken = extractBearerToken(request.headers.get('authorization'));
  if (bearerToken) {
    return verifyJwt(bearerToken);
  }

  // 2. Intentar cookie de sesión
  const sessionToken = extractSessionToken(request.cookies);
  if (sessionToken) {
    return verifyJwt(sessionToken);
  }

  return false;
}

// ── Middleware principal ─────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // Solo interceptar rutas API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Rutas de administración siempre protegidas (todos los métodos)
  if (isAlwaysProtected(pathname)) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      return NextResponse.json(
        { error: 'Autenticación requerida para esta operación' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Rutas GET que exponen PII — requieren auth incluso para lectura
  if (method === 'GET' && PII_PROTECTED_GET.some((r) => pathname.startsWith(r))) {
    const authed = await isAuthenticated(request);
    if (!authed) {
      return NextResponse.json(
        { error: 'Autenticación requerida para acceder a estos datos' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Si la ruta NO está en la lista pública, requerir auth para métodos destructivos
  if (!isPublicEndpoint(pathname, method)) {
    if (DESTRUCTIVE_METHODS.includes(method)) {
      const authed = await isAuthenticated(request);
      if (!authed) {
        return NextResponse.json(
          { error: 'Autenticación requerida para esta operación' },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

// ── Matcher: todas las rutas API ────────────────────────────────
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
