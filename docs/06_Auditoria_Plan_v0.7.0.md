# AUDITORÍA Y PLAN DE APLICACIÓN — CONNECT v0.7.0

**Fecha:** 2 mayo 2026
**Versión actual:** v0.6.0
**Versión objetivo:** v0.7.0 — Dashboard orientado a negocio (SaaS)

---

## PARTE 1: AUDITORÍA — Estado actual vs Aprobado

### 1.1 Sidebar (Navegación)

| Item | Estado | Nota |
|------|--------|------|
| Resumen | ✅ Existe | Pero orientado a legisladores, no a negocio |
| Menciones | ✅ Existe | Funcional |
| Clasificadores | ✅ Existe | Funcional |
| Reportes | ✅ Existe | Funcional |
| Captura | ✅ Existe | Funcional |
| Configuración | ✅ Existe | Básica |
| ~~Personas~~ | ✅ Eliminado | Correcto — no es vista de admin SaaS |
| ~~Medios~~ | ✅ Eliminado | Correcto — no es vista de admin SaaS |
| **Clientes** | ❌ FALTA | Vista para gestionar suscriptores premium |
| **Contratos** | ❌ FALTA | Vista para gestionar productos contratados por cliente |
| **Indicadores** | ❌ FALTA | Vista para ver estado de indicadores ONION200 |
| **Boletines** | ❌ FALTA | Vista para ver historial de boletines generados |

### 1.2 Resumen (Dashboard principal)

| Card/Elemento | Estado | Nota |
|---------------|--------|------|
| KPI: Legisladores | ⚠️ Innecesario | Es un admin SaaS, no un monitor de legisladores |
| KPI: Menciones hoy | ✅ Útil | Mantener |
| KPI: Medios monitoreados | ✅ Útil | Mantener |
| KPI: Reportes generados | ✅ Útil | Mantener |
| Distribución por partido | ⚠️ Innecesario | Orientado a legisladores |
| Top 5 legisladores | ⚠️ Innecesario | Orientado a legisladores |
| Últimas menciones | ✅ Útil | Mantener |
| Estado de fuentes | ✅ Útil | Mantener |
| **KPI: Clientes activos** | ❌ FALTA | Cuántos suscriptores premium hay |
| **KPI: Contratos vigentes** | ❌ FALTA | Cuántos contratos activos |
| **KPI: Entregas del día** | ❌ FALTA | Boletines enviados hoy |
| **Card: El Saldo del Día** | ❌ FALTA | Estado del último cierre de jornada |
| **Card: Reporte Semanal** | ❌ FALTA | Estado del último informe |
| **Card: Indicadores ONION200** | ❌ FALTA | Estado de los indicadores |

### 1.3 Modelo de Datos (Prisma)

| Modelo | Estado | Nota |
|--------|--------|------|
| Persona | ✅ | Legisladores — funcional |
| Medio | ✅ | Fuentes — funcional |
| EjeTematico | ✅ | 11 clasificadores — funcional |
| Mencion | ✅ | Capturas — funcional |
| MencionTema | ✅ | Relación — funcional |
| Reporte | ✅ | Reportes generados — funcional |
| Comentario | ✅ | Comentarios — funcional |
| Suscriptor | ✅ | Básico (nombre, email, plan) |
| CapturaLog | ✅ | Logs de captura — funcional |
| Indicador | ✅ | ONION200 — creado v0.6.0 |
| IndicadorValor | ✅ | ONION200 — creado v0.6.0 |
| SuscriptorGratuito | ✅ | ONION200 — creado v0.6.0 |
| **Contrato** | ❌ FALTA | No hay modelo que vincule cliente → productos contratados |
| **Entrega** | ❌ FALTA | No hay tracking de entregas realizadas |
| **Factura** | ❌ FALTA | No hay modelo de facturación |

### 1.4 API Routes

| Ruta | Estado | Nota |
|------|--------|------|
| /api/personas | ✅ | Funcional |
| /api/personas/[id] | ✅ | Funcional |
| /api/medios | ✅ | Funcional |
| /api/menciones | ✅ | Funcional |
| /api/menciones/[id] | ✅ | Funcional |
| /api/ejes | ✅ | Funcional |
| /api/analyze | ✅ | GLM clasificación — funcional |
| /api/analyze/batch | ✅ | GLM batch — funcional |
| /api/capture | ✅ | Captura web — funcional |
| /api/reportes | ✅ | CRUD reportes — funcional |
| /api/reportes/generate | ✅ | Generación — funcional |
| /api/search | ✅ | Búsqueda — funcional |
| /api/stats | ✅ | Estadísticas — funcional |
| /api/seed | ✅ | Seed datos — funcional |
| /api/verify-links | ✅ | Verificación — funcional |
| /api/indicadores/capture | ✅ | ONION200 captura — nuevo v0.6.0 |
| /api/admin/bulletins/generate-saldo | ✅ | ONION200 Saldo — nuevo v0.6.0 |
| **/api/clientes** | ❌ FALTA | CRUD de clientes/suscriptores |
| **/api/contratos** | ❌ FALTA | CRUD de contratos |
| **/api/entregas** | ❌ FALTA | Historial de entregas |

### 1.5 Documentación

| Documento | Estado |
|-----------|--------|
| CONTEXTO.md | ✅ Actualizado v0.6.0 |
| docs/02_Protocolo_Producto_Saldo_Del_Dia.md | ✅ 647 líneas |
| docs/03_Protocolo_Producto_El_Radar.md | ✅ 1,087 líneas |
| docs/04_Indicadores_ONION200.md | ✅ Completo |
| docs/05_Protocolo_Producto_El_Foco.md | ✅ 956 líneas |
| **docs/06_Estrategia_Negocio_SaaS.md** | ❌ FALTA — pricing actualizado con combos ONION200 |

---

## PARTE 2: PLAN DE APLICACIÓN — v0.7.0

### Objetivo: Transformar el dashboard de "monitor de legisladores" a "admin SaaS de inteligencia mediática"

### Fase 1: Modelo de Datos (Sin UI, solo backend)

**Paso 1 — Modelo Contrato**
Crear modelo `Contrato` en Prisma:
- id, clienteId, productos (JSON array de TipoBoletin), ejesTematicos (JSON array de slugs)
- fechaInicio, fechaFin, estado ('activo'/'suspendido'/'cancelado')
- frecuenciaEntrega, canales (JSON: ['whatsapp','email'])
- precioMensual, moneda ('BOB')
- notas, fechaCreacion, fechaActualizacion
- Relación: clienteId → Suscriptor

**Paso 2 — Modelo Entrega**
Crear modelo `Entrega` en Prisma:
- id, contratoId, tipoBoletin, contenido
- fechaProgramada, fechaEnvio, estado ('pendiente'/'enviado'/'fallido')
- canal ('whatsapp'/'email'/'web')
- destinatarios (JSON), error
- Relación: contratoId → Contrato

**Paso 3 — Migrar y seed**

### Fase 2: Sidebar actualizado

**Paso 4 — Nuevo NAV_ITEMS**
```
Resumen → Menciones → Clasificadores → Clientes → Contratos →
Indicadores → Boletines → Reportes → Captura → Configuración
```

**Paso 5 — Vista Clientes**
- Tabla de Suscriptores con columnas: nombre, email, plan, estado, fecha
- Botón: Crear cliente, Ver contratos, Editar
- Filtros: plan (basico/avanzado/institucional), estado (activo/inactivo)

**Paso 6 — Vista Contratos**
- Tabla de Contratos con columnas: cliente, productos, ejes, estado, vigencia
- Botón: Nuevo contrato, Editar, Suspender/Reactivar
- Vista detalle: productos contratados, ejes seleccionados, historial de entregas

**Paso 7 — Vista Indicadores**
- Panel con estado de cada indicador ONION200 (Tier 1)
- Último valor, fecha de captura, estado (fresco/desactualizado/caído)
- Botón: Capturar ahora (llama a /api/indicadores/capture POST)
- Historial mini-gráfico por indicador

**Paso 8 — Vista Boletines**
- Historial de boletines generados (Reporte tipo ONION200)
- Filtros por tipo, fecha, cliente
- Preview del contenido generado
- Botón: Generar boletín (Termómetro, Saldo, Foco)

### Fase 3: Resumen reorientado

**Paso 9 — KPIs de negocio**
Reemplazar/aggiornar KPIs del Resumen:
- Clientes activos (count Suscriptor activo)
- Contratos vigentes (count Contrato activo)
- Entregas hoy (count Entrega envio hoy)
- Menciones hoy (mantener)

**Paso 10 — Cards de productos ONION200**
- Card "El Saldo del Día": último generado, cliente, estado
- Card "Reporte Semanal": último generado, fecha
- Card "Indicadores": resumen rápido de estado (3 indicadores clave)

**Paso 11 — Quitar cards de legisladores del Resumen**
- Eliminar "Distribución por partido"
- Eliminar "Top 5 legisladores"
- Mantener "Últimas menciones" y "Estado de fuentes" (útiles para el admin)

### Fase 4: API Routes

**Paso 12 — /api/clientes**
- GET: listar suscriptores con filtros
- POST: crear suscriptor
- PUT: actualizar suscriptor
- DELETE: desactivar suscriptor

**Paso 13 — /api/contratos**
- GET: listar contratos con filtros
- POST: crear contrato
- PUT: actualizar contrato (estado, productos, ejes)
- GET /api/contratos/[id]: detalle con entregas

**Paso 14 — /api/entregas**
- GET: listar entregas con filtros (contrato, tipo, fecha)
- POST: registrar entrega manual

### Fase 5: Verificación

**Paso 15 — Build + Worklog**
- Verificar `next build` exitoso
- Actualizar worklog.md
- Actualizar CONTEXTO.md sección 14 y 15

---

## RESUMEN DE IMPACTO

| Métrica | Antes (v0.6.0) | Después (v0.7.0) |
|---------|-----------------|-------------------|
| Modelos Prisma | 11 | **13** (+Contrato, +Entrega) |
| Sidebar items | 6 | **10** (+Clientes, Contratos, Indicadores, Boletines) |
| Vistas admin | 6 | **10** |
| API Routes | 17 | **22** (+clientes, +contratos, +entregas, +contratos/[id], +boletines) |
| KPIs Resumen | 4 (legisladores) | **4** (negocio: clientes, contratos, entregas, menciones) |
| Cards Resumen | 6 | **6** (reorientados a SaaS) |

## ORDEN DE EJECUCIÓN

1. Modelo Contrato + Entrega (Prisma) → migrate
2. Sidebar actualizado (NAV_ITEMS)
3. Vista Clientes (tabla CRUD)
4. Vista Contratos (tabla CRUD)
5. Vista Indicadores (panel ONION200)
6. Vista Boletines (historial)
7. KPIs de negocio en Resumen
8. Cards ONION200 en Resumen
9. API Routes (clientes, contratos, entregas)
10. Build + verificación
