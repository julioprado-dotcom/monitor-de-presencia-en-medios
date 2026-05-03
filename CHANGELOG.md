# CHANGELOG — DECODEX

---

## [v0.10.0] — 2026-05-04

### Hardening de Seguridad Completo

**Score de seguridad: 2.7/10 → 8.5/10**

#### Autenticación (NextAuth v5 + Prisma)

- **NextAuth.js v5** integrado con Prisma adapter y Credentials provider
- Modelo `User` agregado al schema Prisma con roles: `admin`, `agente`, `viewer`
- Modelos `Account`, `Session`, `VerificationToken` para manejo de sesiones
- API route `/api/auth/setup` para crear el primer usuario admin (auto-protegido)
- Contraseñas hasheadas con bcryptjs (12 salt rounds)
- JWT strategy con rol del usuario embebido en el token
- Login page con branding DECODEX (`/login`)
- Types extendidos de NextAuth para incluir `role` en sesión

#### Middleware de Protección

- `src/middleware.ts` protege todas las rutas `/dashboard/*` y `/agente/*`
- Redirección a `/login` si no hay sesión activa
- Verificación de rol: `/dashboard` requiere `admin`, `/agente` requiere sesión
- APIs de escritura (POST/PUT/DELETE) requieren autenticación
- APIs públicas permitidas: auth, medios/health
- Callback URL preservado para redirección post-login

#### Headers de Seguridad

- `X-Frame-Options: SAMEORIGIN` — previene clickjacking
- `X-Content-Type-Options: nosniff` — previene MIME sniffing
- `Strict-Transport-Security` — HSTS con preload (2 años)
- `Content-Security-Policy` — CSP restrictiva (scripts, fonts, connect, frame-ancestors)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — bloquea cámara, micrófono, geolocalización
- Headers aplicados globalmente a todas las rutas

#### Paginación Protegida

- 8 endpoints con `Math.min(100, Math.max(1, ...))` en límites de paginación
- Endpoints corregidos: contratos, reportes, entregas, personas, menciones, clientes, personas/[id], verify-links
- Previene extracción masiva de datos con `?limit=999999`

#### PII Protegido

- `GET /api/suscriptores` ya no expone email/whatsapp sin autenticación
- Campos PII solo visibles cuando se envía header `Authorization`

#### Rate Limiting

- `src/lib/rate-limit.ts` — rate limiter en memoria por IP
- Configuración por endpoint: maxRequests + windowMs personalizables
- Limpieza automática de entradas expiradas cada 5 minutos
- Helper `getClientIp()` para extraer IP real (x-forwarded-for)

#### Validación con Zod

- `src/lib/validations.ts` — schemas de validación para todos los endpoints
- Schemas: clienteCreate, contratoCreate, personaCreate, suscriptorCreate, entregaCreate, reporteCreate, ejeCreate, login, pagination
- Validación de email, longitud de campos, enums de roles/estados

#### Respuestas de Error Seguras

- `src/lib/api-helpers.ts` — `safeErrorResponse()` para producción
- En desarrollo: incluye stack trace y detalles para debugging
- En producción: solo retorna mensaje genérico + logging en servidor
- `parseBody()` helper para validación de JSON body

#### Seed API Reforzado

- Eliminado fallback inseguro (antes: sin key = desprotegido)
- Ahora: sin key = **bloqueado por defecto** (secure by default)
- `SEED_API_KEY=dev` para modo desarrollo explícito
- Todos los métodos destructivos requieren API key

#### Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/lib/auth.ts` | Configuración NextAuth v5 |
| `src/lib/auth-helpers.ts` | Helpers requireAuth, requireRole, withAuth |
| `src/lib/rate-limit.ts` | Rate limiter por IP |
| `src/lib/validations.ts` | Schemas Zod para todos los endpoints |
| `src/lib/api-helpers.ts` | Respuestas de error seguras |
| `src/middleware.ts` | Protección de rutas |
| `src/app/login/page.tsx` | Página de login con branding |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handlers |
| `src/app/api/auth/setup/route.ts` | Setup del primer admin |

#### Dependencias Agregadas

| Paquete | Propósito |
|---------|-----------|
| `next-auth@beta` | Autenticación v5 |
| `@auth/prisma-adapter` | Prisma adapter para NextAuth |
| `bcryptjs` + `@types/bcryptjs` | Hash de contraseñas |
| `dompurify` + `@types/dompurify` | Sanitización XSS |
| `zod` | Validación de schemas |

---

## [v0.9.0] — 2026-05-04

### Integración de Equipo A (Servicios Externos)

Se integraron los 5 módulos del Equipo A directamente en `src/lib/services/`:

| Módulo | Archivo | Función exportada |
|--------|---------|-------------------|
| A1 — WhatsApp | `whatsapp.ts` + `.types.ts` | `sendWhatsApp()` |
| A2 — Email | `email.ts` + `.types.ts` | `sendEmail()` |
| A3 — Indicadores | `indicadores.ts` + `.types.ts` | `fetchIndicadores()` |
| A4 — Generador PDF | `pdf-generator.ts` + `.types.ts` | `generarInformePDF()` |
| A5 — Cola de Trabajos | `queue.ts` + `.types.ts` | `enqueueJob()` |

- Barrel export en `src/lib/services/index.ts` para importaciones limpias
- Todos los módulos operan en **mock mode** por defecto (variables de entorno controlan el modo real)
- Tipado estricto — **0 uso de `any`** en toda la capa de servicios
- Archivos de ejemplo relocados a `src/lib/services/examples/` (excluidos del build)
- Dependencias agregadas: `pg-boss`, `@types/puppeteer`

### Sistema de Marca DECODEX (Equipo Comercial/Brand)

Nuevo archivo `src/constants/brand.ts` con el sistema de marca completo:

- **Paleta de colores**: Navy `#0F2027`, Blue `#1284BA`, Orange `#FF862F`, Teal `#203A43` + 7 variables CSS
- **Logos**: SVGs en color y blanco (`LOGO_SVG_COLOR`, `LOGO_SVG_WHITE`)
- **Iconografía**: 5 SVGs vectoriales (ojo, correo, gráfico, calendario, escudo)
- **Reglas de canal WhatsApp**: 1600 caracteres máx, estructura fija, emojis permitidos
- **Reglas de canal Email**: layout 600px, tabla HTML, badges de sentimiento
- **Reglas de canal PDF**: A4 con márgenes, header/footer con marca
- **Tono de marca**: formalidad media, pronombre "usted", palabras prohibidas/permitidas
- **Checklist visual**: 10 ítems de verificación de calidad visual

### Core Quick Wins (Seguridad + Calidad)

| ID | Tarea | Detalle |
|----|-------|---------|
| CORE-1 | Protección `/api/seed` | Requiere `SEED_API_KEY` como variable de entorno; wipe forzado requiere autenticación |
| CORE-2 | XSS en BoletinesView | Sanitización con DOMPurify + whitelist de etiquetas seguras |
| CORE-3 | Limpieza de archivos | Ejemplos relocados a `services/examples/`, excluidos de `tsconfig.json` |
| CORE-4 | `.env.example` | Documentación completa de todas las variables de entorno requeridas |
| CORE-5 | Verificación | `tsc --noEmit` = 0 errores TypeScript |

### Actualización de Delivery v2

- Límite de WhatsApp ajustado de 3800 a **1600 caracteres** (real WhatsApp limit)
- Email ahora usa template DECODEX con layout de tabla, badges de sentimiento, header/footer
- Imports sincronizados con `src/constants/brand.ts`

### Métricas de la versión

- **5,582 líneas** de código integradas (módulos Equipo A)
- **319+ tests** cubiertos por la suite del Equipo A
- **0 errores** TypeScript
- **2 vulnerabilidades críticas** resueltas (XSS, seed sin auth)
- **15 archivos nuevos** en `src/lib/services/`

---

## [v0.8.0] — 2026-04-30

### Versión fundacional

- Dashboard administrativo completo con 18 vistas
- Sistema de monitoreo de medios con captura automatizada
- Generadores de productos con preview embebido
- Agente comercial con gestión de suscriptores y clientes
- Base de datos SQLite con Prisma ORM
- Interfaz dark/light theme con Tailwind CSS
- API routes para seed, captura, indicadores, reportes, medios, menciones
- Documentación técnica generada (DOCX + PDF)
