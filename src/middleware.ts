import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de seguridad — protege TODAS las rutas API destructivas
 * requiriendo autenticación (Bearer token o cookie de sesión NextAuth).
 *
 * NO invoca auth() para evitar dependencia de DB en Edge Runtime.
 * NO agrega headers de seguridad (preserva iframe proxy Z.ai).
 *
 * Estrategia de autenticación ligera (sin verificación DB):
 * - Bearer token → acceso API directo
 * - Cookie next-auth.session-token → acceso desde navegador autenticado
 * - Cookie authjs.session-token → acceso desde navegador (Auth.js v5)
 */

// ── Endpoints públicos específicos por método ──────────────────
const PUBLIC_ENDPOINTS: Array<{ path: string; methods: string[] }> = [
  { path: '/api/auth/',                     methods: ['GET', 'POST'] },
  { path: '/api/suscriptores',              methods: ['GET', 'POST'] },
  { path: '/api/search',                    methods: ['GET', 'POST'] },
  { path: '/api/indicadores/capture',       methods: ['POST'] },
  { path: '/api/medios/health',             methods: ['GET'] },
  { path: '/api/verify-links',              methods: ['GET', 'POST'] },
  { path: '/api/stats',                     methods: ['GET'] },
  { path: '/api/indicadores/historico',     methods: ['GET'] },
  { path: '/api/indicadores',               methods: ['GET'] },
  { path: '/api/medios',                    methods: ['GET'] },
  { path: '/api/personas',                  methods: ['GET'] },
  { path: '/api/reportes/stats',            methods: ['GET'] },
  { path: '/api/reportes/generator-data',   methods: ['GET'] },
  { path: '/api/ejes',                      methods: ['GET'] },
  { path: '/api/clientes',                  methods: ['GET'] },
  { path: '/api/contratos',                 methods: ['GET'] },
  { path: '/api/menciones',                 methods: ['GET'] },
  { path: '/api/entregas',                  methods: ['GET'] },
  { path: '/api/jobs/stats',                methods: ['GET'] },
];

// ── Rutas que SIEMPRE requieren auth (todos los métodos) ──────
const ALWAYS_PROTECTED: string[] = [
  '/api/admin/',
  '/api/seed',
  '/api/auth/setup',
];

const DESTRUCTIVE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Verifica si una ruta+combo es explícitamente pública.
 * Si no está en la lista → requiere auth para métodos destructivos.
 */
function isPublicEndpoint(pathname: string, method: string): boolean {
  return PUBLIC_ENDPOINTS.some(
    (e) => pathname.startsWith(e.path) && e.methods.includes(method)
  );
}

function isAlwaysProtected(pathname: string): boolean {
  return ALWAYS_PROTECTED.some((r) => pathname.startsWith(r));
}

/**
 * Verificación ligera de autenticación SIN acceso a DB.
 * Comprueba presencia de credenciales (Bearer token o cookies de sesión).
 */
function isAuthenticated(request: NextRequest): boolean {
  // 1. Bearer token (acceso API)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) return true;

  // 2. Cookie de sesión NextAuth / Auth.js v5 (acceso navegador)
  const cookies = request.cookies;
  if (cookies.get('next-auth.session-token')) return true;
  if (cookies.get('authjs.session-token')) return true;
  if (cookies.get('__Secure-authjs.session-token')) return true;
  if (cookies.get('__Secure-next-auth.session-token')) return true;

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
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Autenticación requerida para esta operación' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Si la ruta NO está en la lista pública, requerir auth para métodos destructivos
  if (!isPublicEndpoint(pathname, method)) {
    if (DESTRUCTIVE_METHODS.includes(method)) {
      if (!isAuthenticated(request)) {
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
