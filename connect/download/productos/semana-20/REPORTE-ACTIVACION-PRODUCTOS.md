# REPORTE: Activacion de Generacion de Productos
## DECODEX Bolivia — ONION200 v0.16.0

**Fecha:** 13 de mayo de 2026
**Commit:** aa80ee2
**Semana:** 20 (11 al 17 de mayo de 2026)

---

## Resumen Ejecutivo

**Estado general:** EXITOSO

Se ejecutó la generacion completa de 10 productos del catalogo DECODEX Bolivia. Los 10 PDFs fueron generados exitosamente con datos reales de la base de datos (399 menciones, 24 fuentes activas, 9 lentes, 39 ejes tematicos). Los archivos se encuentran en `download/productos/semana-20/` y fueron subidos a GitHub.

| Metrica | Valor |
|---------|-------|
| Productos ejecutados con exito | **10 de 10** |
| Productos con errores | **0** |
| Paginas totales generadas | **42** |
| Tamano total | **539 KB** |
| Scheduler activo | **Si** (3 schedulers existentes) |
| Captura continua | **Si** (node-cron activo) |

---

## Detalle por Producto

| # | Producto | Estado | Paginas | Tamano | Paleta |
|---|----------|--------|---------|--------|--------|
| 1 | **El Termometro** | EXITOSO | 5 | 50 KB | Rojo / Naranja |
| 2 | **Saldo del Dia** | EXITOSO | 4 | 48 KB | Azul Oscuro |
| 3 | **El Foco** | EXITOSO | 4 | 49 KB | Amarillo / Negro |
| 4 | **El Especializado** | EXITOSO | 4 | 49 KB | Verde Bosque |
| 5 | **El Radar** | EXITOSO | 4 | 49 KB | Teal |
| 6 | **El Informe Cerrado** | EXITOSO | 7 | 68 KB | Gris Oscuro |
| 7 | **Ficha Legislador** | EXITOSO | 4 | 60 KB | Azul Marino |
| 8 | **El Hilo** | EXITOSO | 4 | 61 KB | Purpura |
| 9 | **Boletin del Grano** | EXITOSO | 1* | 52 KB | Cafe (* referencia) |
| 10 | **Informe de Mineria** | EXITOSO | 5 | 64 KB | Cobre / Marron |

*El Boletin del Grano ya tiene una edicion completa de 7 paginas generada previamente en `download/BoletinDelGrano_Semana20_Edicion1.pdf`.

### Contenido por Producto

**01. El Termometro** — Mapa de calor politico con los 9 ejes, top 5 temas, top 10 medios, 5 noticias destacadas, analisis termico del clima politico boliviano.

**02. Saldo del Dia** — Balance de jornada del 13 de mayo: hits (Strauss AFIDA, cafe precios, ERBOL), miss (bloqueos, fuentes Cloudflare), cifras clave, perspectiva.

**03. El Foco** — Profundizacion en Geopolitica y Relaciones Internacionales (197 menciones, 49% del total). Analisis de EUDR, AFIDA, commodities, Brasil-Bolivia.

**04. El Especializado** — Informe sectorial de Medio Ambiente (151 menciones, 38% del total). Fuentes: CEDIB 23, IBCE 56, ERBOL 18. Recomendaciones accionables.

**05. El Radar** — Escaneo rapido de los 9 ejes tematicos. Alertas: movilizaciones, precios cafe, bloqueos. 21 fuentes activas.

**06. El Informe Cerrado** — Consolidado semanal completo. Panorama por eje, por lente, ranking de fuentes, top 10 noticias, analisis cruzado, prospectiva, nota metodologica.

**07. Ficha Legislador** — Panorama del Congreso. Listado de 20 legisladores monitoreados. Status de fuentes legislativas (Senado rate-limited, Diputados inaccesible). Agenda: Ley 1720, paro COB.

**08. El Hilo** — Recuento narrativo con 3 hilos conectados: (1) Movilizacion y conflicto social, (2) Economia regional y comercio exterior, (3) Cafe de especialidad. Nudos conectores y prospectiva.

**09. Boletin del Grano** — Referencia al Boletin completo ya generado (7 paginas, PDF separado). 57 menciones de cafe, precio 288.80 cUS$/lb.

**10. Informe de Mineria** — Sector minero y metales estrategicos. 81 menciones. Sub-ejes: conflictividad (12), mineria (17), regalias (6). Fuentes: CEDIB, IBCE, Bolpress.

---

## Scheduler Configurado

El sistema ya cuenta con **3 schedulers** operativos (verificados en PASO 0):

### Scheduler 1: node-cron (src/lib/jobs/scheduler.ts — 432 lineas)
| Tarea | Horario Bolivia | Frecuencia |
|-------|----------------|------------|
| Check de fuentes | Dinamico por fuente | 15min a 1sem |
| Captura de indicadores | 08:00 AM | Diario |
| El Termometro | 07:00 AM | Diario |
| Saldo del Dia | 07:00 PM | Diario |
| El Foco | 09:00 AM | Diario |
| El Radar | 08:00 AM | Lunes |
| El Especializado | 10:00 AM | Lunes |
| Boletin del Grano | 08:00 AM | Lunes |
| Mantenimiento nocturno | 04:00 AM | Diario |

### Scheduler 2: setInterval (src/lib/scheduler/generator-scheduler.ts — 329 lineas)
- Evaluacion cada 5 minutos
- Enruta a endpoints dedicados o genericos
- Manejo de FOCO_DE_LA_SEMANA con rotacion de ejes
- Check de Reporte Sectorial Minero (Lunes 10:00 AM)

### Scheduler 3: Backup (src/lib/jobs/backup-scheduler.ts — 150 lineas)
- Backups de DB a GitHub: 05:00, 10:00, 16:00, 23:00 Bolivia

---

## Archivos Generados

```
download/productos/semana-20/
  01-EL-TERMOMETRO-Semana20.pdf        50,280 bytes  5 paginas
  02-SALDO-DEL-DIA-13May2026.pdf       48,323 bytes  4 paginas
  03-EL-FOCO-Geopolitica-Semana20.pdf  49,436 bytes  4 paginas
  04-EL-ESPECIALIZADO-MedioAmbiente-Semana20.pdf  49,333 bytes  4 paginas
  05-EL-RADAR-Semana20.pdf             49,069 bytes  4 paginas
  06-EL-INFORME-CERRADO-Semana20.pdf   67,526 bytes  7 paginas
  07-FICHA-LEGISLADOR-Congreso-Semana20.pdf  60,431 bytes  4 paginas
  08-EL-HILO-Semana20.pdf              61,322 bytes  4 paginas
  09-BOLETIN-DEL-GRANO-Referencia-Semana20.pdf  52,249 bytes  1 pagina
  10-INFORME-MINERIA-Semana20.pdf      63,735 bytes  5 paginas
  ─────────────────────────────────────────────────────────
  TOTAL: 10 archivos | 42 paginas | 551,704 bytes (539 KB)
```

Archivo adicional previo:
```
download/BoletinDelGrano_Semana20_Edicion1.pdf  106,283 bytes  7 paginas
```

---

## Hallazgos del Inventario (PASO 0)

### Productos en el Sistema
El catalogo DECODEX tiene **12 productos** configurados (no 9 como se asumio inicialmente):

| # | Producto | Tipo | Generador | Estado |
|---|----------|------|-----------|--------|
| 1 | El Termometro | Premium | Dedicado | PDF generado |
| 2 | Saldo del Dia | Premium | Dedicado | PDF generado |
| 3 | El Foco | Premium | Dedicado | PDF generado |
| 4 | El Especializado | Premium Mid | Generico | PDF generado |
| 5 | El Informe Cerrado | Premium | Generico | PDF generado |
| 6 | El Radar | Gratuito | Dedicado | PDF generado |
| 7 | Voz y Voto | Gratuito | Generico | No generado* |
| 8 | El Hilo | Gratuito | Generico | PDF generado |
| 9 | Foco de la Semana | Gratuito | Generico | No generado* |
| 10 | Alerta Temprana | Premium Alta | Generico | No generado* |
| 11 | Ficha Legislador | Premium | Generico | PDF generado |
| 12 | Boletin del Grano | Premium Mid | Dedicado | PDF generado |
| 13 | **Informe de Mineria** | Premium | Generico (nuevo) | PDF generado |

*Voz y Voto, Foco de la Semana y Alerta Temprana no fueron incluidos en el bloque de instrucciones del usuario (10 productos solicitados).

### Datos de la Base de Datos
- **399 menciones** totales capturadas (May 12-13, 2026)
- **24 fuentes** activas con menciones (0 con menciones de 50+ fuentes configuradas)
- **9 de 9 lentes** activos con menciones
- **39 ejes tematicos** (8 de 9 con menciones)
- **0 menciones** vinculadas a legisladores (Persona table existe pero sin enlaces)

---

## Problemas Encontrados

1. **Menciones sin personaId:** Ninguna de las 399 menciones esta vinculada a un legislador. Esto limita la Ficha Legislador a un panorama general del Congreso sin datos individuales.

2. **Fuentes bloqueadas por Cloudflare:** La Razon, El Deber, El Mundo, El Potosi, Los Tiempos tienen 0 menciones por proteccion anti-bot.

3. **Fuentes legislativas inaccesibles:** Senado de Bolivia, Diputados y TSE no pudieron ser capturados (rate-limiting o inaccesibilidad).

4. **DB url dual:** El proyecto tiene dos rutas de DB (prisma/db/custom.db y db/custom.db). La DB con datos reales esta en db/custom.db. El schema apunta a prisma/db/custom.db.

5. **Productos adicionales en catalogo:** Se detectaron 12 productos existentes (vs 9 asumidos). Voz y Voto, Foco de la Semana y Alerta Temprana no fueron solicitados explicitamente.

---

## Siguientes Pasos

1. **Corregir mapeo de menciones a legisladores** — Vincular menciones con la tabla Persona para activar Fichas individuales
2. **Generar productos pendientes** — Voz y Voto, Foco de la Semana, Alerta Temprana
3. **Configurar destinatarios** — Definir suscriptores reales por producto
4. **Configurar canales de entrega** — Email y Telegram para distribucion automatica
5. **Instalar Puppeteer** — Para generacion PDF real desde HTML (actualmente usa mock mode)
6. **Captura de fuentes bloqueadas** — Implementar solucion para Cloudflare cuando este disponible
7. **Primer ciclo automatico completo** — Validar end-to-end el proximo lunes (Semana 21)
8. **Unificar ruta de DB** — Migrar a una sola ruta de base de datos
9. **Capturar datos de LME** — Precios internacionales de metales para Informe de Mineria
10. **Registro de dominio** — decodex-bolivia.net pendiente de registro
