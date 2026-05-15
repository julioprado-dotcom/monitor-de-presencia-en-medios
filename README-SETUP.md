# DECODEX Bolivia — RESTAURACION ONION200 v0.16.0

**Fecha de restauracion:** 2026-05-14
**Ingeniero:** Infraestructura DECODEX Bolivia
**Repositorio:** https://github.com/julioprado-dotcom/connect
**Rama:** main (15 commits verificados)

---

## 1. Estado Actual

El servidor DECODEX Bolivia esta operativo en `http://localhost:3000` con datos restaurados desde el snapshot mas reciente disponible.

### Base de Datos (SQLite)

| Tabla | Registros |
|-------|-----------|
| Mencion | 399 |
| MencionLente | 852 |
| MencionTema | 1,355 |
| Medio | 54 |
| FuenteEstado | 30 |
| Persona | 173 |
| EjeTematico | 44 |
| Lente | 9 |
| Indicador | 12 |
| Keyword | 789 |
| Job | 106 |
| CapturaLog | 66 |

**Fuente de restauracion:** `prisma/db/backups/snapshot-2026-05-13_23-noche_20260513-030000.db`

### API Endpoints Verificados

| Endpoint | HTTP | Estado |
|----------|------|--------|
| `/api/stats` | 200 | OK |
| `/api/medios` | 200 | OK |
| `/api/personas` | 200 | OK |
| `/api/ejes` | 200 | OK |
| `/api/jobs` | 200 | OK |
| `/api/suscriptores` | 200 | OK |
| `/api/entregas` | 200 | OK |
| `/api/dashboard/summary` | 200 | OK |
| `/api/dashboard/status` | 200 | OK |
| `/api/dashboard/menciones-summary` | 200 | OK |
| `/api/dashboard/jobs-summary` | 200 | OK |
| `/api/dashboard/fuentes-summary` | 200 | OK |
| `/api/search` | 400 | OK (sin query params) |
| `/api/clientes` | 500 | Tabla vacia (0 rows) |
| `/api/contratos` | 500 | Tabla vacia (0 rows) |
| `/api/productos` | 500 | Mismatch schema/codigo |
| `/api/indicadores` | 500 | Mismatch schema/codigo |
| `/api/reportes` | 500 | Tabla vacia (0 rows) |
| `/api/dashboard/medios-summary` | 500 | Mismatch schema/codigo |

**14 de 19 endpoints operativos.** Los endpoints en 500 presentan incompatibilidad entre el schema del backup (33 tablas) y el codigo actualizado del repositorio (37 tablas). Esto requiere revision del source code para sincronizar modelos Prisma con las rutas API.

---

## 2. Configuracion

### Variables de Entorno (`.env`)

```
DATABASE_URL=file:/home/z/my-project/prisma/db/custom.db
AUTH_SECRET=<configurado>
ADMIN_API_KEY=decodex-admin-dev-2026
SEED_API_KEY=dev
```

### Stack Tecnologico

- **Framework:** Next.js 16 + TypeScript
- **Estilos:** Tailwind CSS 4
- **ORM:** Prisma 6.19.3 + SQLite
- **Motor:** ONION200 v0.16.0 (4 capas: Captura, Indicadores, Procesamiento, Entrega)
- **Ejecucion:** Node.js v24 (runtime Z.ai sandbox)

### Estructura Clave

```
/home/z/my-project/
  prisma/db/custom.db          # Base de datos activa (~10 MB)
  prisma/db/backups/           # Snapshots automaticos
  prisma/schema.prisma         # 37 modelos Prisma
  src/app/api/                 # 42+ endpoints API
  src/components/dashboard/    # 17+ widgets del dashboard
  src/lib/jobs/                # Job Queue (scheduler, workers, check-first)
  src/lib/indicadores/         # Pipeline de indicadores (3 tiers)
  src/lib/services/            # Servicios (PDF, WhatsApp, email, boletines)
  docs/                        # Documentacion completa del proyecto
  brand/                       # Logos y assets DECODEX
```

---

## 3. Procedimiento de Arranque

En el sandbox Z.ai, el unico metodo verificado para levantar el servidor de forma persistente es `spawn()` detached:

### Produccion

```bash
node -e "
const { spawn } = require('child_process');
const fs = require('fs');
const log = fs.openSync('/home/z/my-project/server.log', 'a');
const child = spawn(
  '/home/z/my-project/node_modules/next/dist/bin/next',
  ['start', '-p', '3000'],
  { cwd: '/home/z/my-project', stdio: ['ignore', log, log], detached: true }
);
child.unref();
"
```

### Desarrollo (hot-reload)

```bash
node -e "
const { spawn } = require('child_process');
const fs = require('fs');
const log = fs.openSync('/home/z/my-project/server.log', 'a');
const child = spawn(
  '/home/z/my-project/node_modules/next/dist/bin/next',
  ['dev', '--turbopack', '-p', '3000'],
  { cwd: '/home/z/my-project', stdio: ['ignore', log, log], detached: true }
);
child.unref();
"
```

### Verificacion

```bash
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Esperado: 200
```

### Diagnostico Rapido

```bash
# Servidor activo?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Base de datos existe?
ls -lh /home/z/my-project/prisma/db/custom.db

# Menciones en BD?
curl -s http://localhost:3000/api/stats | python3 -m json.tool | grep menciones
```

---

## 4. Intervenciones Realizadas

1. **Restauracion de BD:** Copia de snapshot `2026-05-13_23-noche` (399 menciones, 54 medios, 173 personas, 44 ejes)
2. **Fix de fechas:** Las fechas del backup estaban en formato `YYYY-MM-DDTHH:MM:SS` sin zona horaria. Se actualizo a `YYYY-MM-DDTHH:MM:SS.000Z` para compatibilidad con Prisma v6. Afectadas: Medio (53), Persona (346), Job (424), CapturaLog (66) filas.
3. **Prisma Client:** Regenerado con `prisma generate` sin `prisma db push` (para preservar datos del backup)
4. **Tablas faltantes:** El backup tiene 33 tablas vs 37 del schema actual. Faltan: `AdminFeedback`, `AprendizajeSistema` (tablas vacias, sin impacto operativo)

---

## 5. Pendientes / Recomendaciones

- **Endpoints 500:** Revisar rutas `/api/productos`, `/api/indicadores`, `/api/reportes`, `/api/clientes`, `/api/contratos` para sincronizar con el schema actual del backup
- **Modelos nuevos:** `AdminFeedback` y `AprendizajeSistema` requieren `prisma db push` pero esto destruira los datos existentes. Migrar datos primero, luego aplicar push
- **Backups:** Los snapshots mas recientes en `prisma/db/backups/` contienen datos parciales (15-399 menciones). Considerar restauracion desde GitHub si existen datos completos
- **Jobs:** 106 jobs en estado heredado del backup. Verificar estados y ejecuciones pendientes
- **Fuentes:** 30 FuenteEstado registradas. Verificar conectividad y scheduler

---

## 6. Documentacion de Referencia

| Documento | Descripcion |
|-----------|-------------|
| `README.md` | Estructura del proyecto, stack, API routes |
| `CONTEXTO.md` | Estado del proyecto v0.14.0 |
| `ONION200.md` | Arquitectura del motor ONION200 |
| `CHANGELOG.md` | Historial v0.8.0 a v0.13.0 |
| `PROTOCOLO_GIT.md` | Reglas de trabajo con Git |
| `docs/HOJA_DE_RUTA_2026-05-11.md` | 4 ejes de reforma pendientes |
| `docs/ESTANDAR_PRODUCTOS.md` | Estandar periodistico para 11 productos |
| `docs/DASHBOARD_DESIGN.md` | Diseno dashboard Centro de Comando |
| `docs/DISENO-JOB-QUEUE.md` | Sistema de Job Queue (4 capas) |
| `docs/PROMPT-MESTRO-DECODEX.md` | Prompt contextual, marco filosofico |
| `docs/PROCEDIMIENTO_ARRANQUE.md` | Procedimiento de arranque en Z.ai |
| `docs/brand/Acta-Nacimiento-DECODEX-v2.md` | Documento fundacional de marca |
| `docs/02_Protocolo_Producto_Saldo_Del_Dia.md` | Protocolo producto Saldo del Dia |
| `docs/03_Protocolo_Producto_El_Radar.md` | Protocolo producto El Radar (gratuito) |
| `docs/04_Indicadores_ONION200.md` | Pipeline de indicadores, 3 tiers |
| `docs/05_Protocolo_Producto_El_Foco.md` | Protocolo producto El Foco |
| `documents/CONNECT_Bolivia_Estrategia_Comercial.pdf` | Estrategia comercial DECODEX |
