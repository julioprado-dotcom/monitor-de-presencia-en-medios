---
Task ID: 1
Agent: main
Task: Construir Monitor de Pipeline con datos en tiempo real y acciones correctivas para el administrador

Work Log:
- Revision exhaustiva del dashboard existente (1302 lineas DashboardCommandCenter.tsx, 9 archivos en /dashboard/)
- Mapeo completo de APIs existentes: /api/jobs/stats, /api/jobs/worker, /api/jobs/scheduler, /api/jobs/[id], /api/jobs
- Identificacion de campos reales del API (diferentes de types teoricos): jobsPerHour, lastJobTime, running, totalTasks, tasks
- Creacion de API endpoint POST /api/jobs/maintenance con 4 acciones: purge_completados, purge_fallidos, reclaim_huerfanos, estado_cola
- Creacion de componente PipelineMonitor.tsx (~820 lineas) con:
  - Vista compacta: 6 metricas (pendientes, en_progreso, completados 24h, fallidos 24h, promedio, worker) + 5 botones de accion
  - Vista expandida: 3 columnas (cola, worker+check-first, fuentes+scheduler) + acciones admin + jobs fallidos recientes + tareas programadas
  - Sistema de feedback visual (toasts) con auto-dismiss
  - Botones con confirmacion para acciones destructivas
  - Border lateral color segun salud del pipeline
- Integracion en DashboardCommandCenter como FILA 3 (entre Entregas Hoy y Category Cards)
- Polling cada 15s con pausa por visibility
- Registro en proxy.ts para proteccion API key
- Commit a85ac69 → rebased a d71e837, pushed a origin/main

Stage Summary:
- PipelineMonitor.tsx creado e integrado en dashboard
- /api/jobs/maintenance route creado con 4 acciones correctivas
- proxy.ts actualizado con ruta protegida
- Todo compilado sin errores TypeScript

---
Task ID: 2
Agent: main
Task: Rediseñar Pipeline Monitor con 3 dimensiones temporales (Pasado, Presente, Futuro)

Work Log:
- Mapeo completo de datos disponibles: Job, FuenteEstado, Entrega, Reporte models
- Identificación de gaps: no API unificado, no próximo-run computation, CapturaLog no expuesto
- Creación de API unificado GET /api/dashboard/pipeline (~450 lineas)
  - PASADO: jobs completados/fallidos con duración, entregas hoy, productos IA
  - PRESENTE: jobs en ejecución, worker status, fuentes con diagnóstico, scheduler
  - FUTURO: próximos checks (computados desde horariosOptimos+frecuencia), boletines programados, mantenimiento, entregas, cola
- Rediseño completo de PipelineMonitor.tsx (~820 lineas)
  - Vista compacta: 3 columnas (Pasado/Presente/Futuro) + acciones rápidas
  - Vista expandida: tabs para cada dimensión con detalle rastreable
  - Fuentes con color por estado (verde/amarillo/rojo)
  - Próximo check resalta "AHORA" si <30 min
  - Jobs fallidos con botón cancelar individual
- Actualización de DashboardCommandCenter: fetch desde /api/dashboard/pipeline
- Registro en proxy.ts como ruta pública GET
- Commit 4402fe1 pushed a origin/main

Stage Summary:
- Pipeline Monitor ahora cubre Pasado + Presente + Futuro
- API unificado en un solo endpoint con datos agregados
- Fuentes monitoreadas con degradación, muerte, errores
- Próximos checks computados con tiempo estimado
- Boletines y entregas programadas visibles
- Cada job fallido tiene diagnóstico (por qué, para quién, acción)
- TypeScript compila limpio, API responde correctamente


---
Task ID: 3
Agent: main
Task: Solución estructural para pérdida de datos al reiniciar servidor

Work Log:
- Investigación exhaustiva de por qué se pierden fuentes, personas al reiniciar
- DESCUBRIMIENTO: Dos BD SQLite distintas — .env apuntaba a prisma/db/custom.db (VACÍA, 0 filas)
  mientras los datos reales estaban en /home/z/my-project/db/custom.db (173 personas, 33 medios, 35 ejes)
- El archivo prisma/db/custom.db era byte-idéntico a custom.db.vacio (plantilla vacía)
- deploy.sh, start.sh, backup-db.sh, restore-db.sh todos apuntaban a /home/z/my-project/db/custom.db
- Solo .env apuntaba a la ruta incorrecta prisma/db/custom.db
- SOLUCIÓN IMPLEMENTADA:
  1. Copiado datos de BD poblada a prisma/db/custom.db (servidor actual ahora tiene datos)
  2. .env actualizado: DATABASE_URL → /home/z/my-project/db/custom.db
  3. scripts/_db-path.sh creado — UNICA fuente de verdad para ruta de DB
  4. start.sh, deploy.sh, backup-db.sh, restore-db.sh actualizados para source _db-path.sh
  5. src/lib/db.ts — health check con alerta si DB está vacía al conectar
  6. src/instrumentation.ts — verificación de conteo de datos al arrancar servidor
- Commit 65e5880 pushed a origin/main

Stage Summary:
- RAÍZ DEL PROBLEMA: DATABASE_URL en .env apuntaba a DB vacía diferente de la BD canónica
- Todos los scripts shell ahora leen de scripts/_db-path.sh (fuente única de verdad)
- db.ts e instrumentation.ts verifican integridad de datos al iniciar
- Para cambiar ruta de BD en el futuro: actualizar solo _db-path.sh + .env

---
Task ID: 4
Agent: sub-agent (general-purpose)
Task: Fix DB URLs and Fase 1 config

Work Log:
- Fixed La Razón medio URL: https://la-razon.com → https://larazon.bo/
- Fixed La Razón FuenteEstado URL: https://la-razon.com → https://larazon.bo/
- Verified ATB medio URL: https://www.atb.com.bo/feed/ (correct base URL)
- Fixed El Deber medio URL: https://eldeber.com.bo/noticias → https://eldeber.com.bo/
- Fixed El Deber FuenteEstado URL: https://eldeber.com.bo/noticias → https://eldeber.com.bo/
- Updated Fase 1 fuentesEspecificas in src/app/api/scraping/phase/route.ts:
  ['ABI', 'ATB', 'El Deber', 'RTP'] → ['ABI', 'ATB', 'La Razón', 'El Deber']
- Deactivated RTP FuenteEstado (activo: true → false)
- No server restart — all changes via HMR

Stage Summary:
- La Razón now points to correct domain (larazon.bo)
- El Deber URL simplified to root (per user request)
- RTP removed from Fase 1 and deactivated
- Fase 1 now uses: ABI, ATB, La Razón, El Deber

---
Task ID: 5
Agent: sub-agent (general-purpose)
Task: Fix scrape results bug (false "completado") and improve monitor display

Work Log:
- Bug 1 Fixed (route.ts — ejecutarScrapeSecuencial):
  - After `esperarProcesamiento` returns true, now fetches the actual job from DB
  - Reads `resultado` JSON to check `cambiado` field
  - If `cambiado === true` → true success (completado, no error)
  - If `cambiado === false` → completado but error set to `detalle` (e.g., "Check demasiado reciente")
  - If job `estado === 'fallido'` → completado with error set to job's error message
  - If job not found in DB → marks as error
  - Added `detalle?: string` field to scrapeResultados in-memory array
- Bug 2 Fixed (ScrapingPhaseControl.tsx):
  - Updated `ScrapeResultado` interface: added optional `detalle?: string`
  - Results icons now differentiate 4 states for "completado":
    1. completado + no error + menciones > 0 → green CheckCircle2 (real success)
    2. completado + error + menciones > 0 → amber AlertTriangle (scrape ok but check failed)
    3. completado + error + menciones = 0 → amber AlertTriangle (check warning)
    4. completado + no error + menciones = 0 → dimmed green CheckCircle2 (ran OK, no changes)
  - Error text color: amber for completado-with-warning, red for real errors
  - Mini-summary counts split into: `completados` (true success), `sinCambios` (dimmed), `conError` (amber warning)
  - Expanded "Resultados" header also shows sinCambios and conError counts
- No server restart — all changes via HMR

Stage Summary:
- Scrape results now correctly reflect actual job outcome instead of blindly marking "completado"
- Monitor visually distinguishes between true success, warnings, and no-change checks
- Error messages from failed checks are now visible with amber styling instead of being hidden
---
Task ID: 1
Agent: main
Task: Configurar ABI con RSS + Rotación automática de estrategias + Fix dashboard

Work Log:
- Verificado estado actual de DB: ABI tenía tipoCheck=head, ATB y El Deber ya con URLs correctas, La Razón ya registrada
- Actualizado ABI en DB: url → https://abi.bo/rss-abi/, tipoCheck → rss
- Recalculado scheduler para recoger nuevos cambios
- Reescrito strategies.ts con sistema de rotación automática de estrategias
- Corregido bug en phase/route.ts: jobs fallidos se marcaban como 'completado'
- Mejorado ScrapingPhaseControl.tsx con visualización diferenciada por estado
- Verificado: 0 errores TypeScript
- Commit: b79d573

Stage Summary:
- ABI ahora usa RSS (https://abi.bo/rss-abi/)
- Sistema de rotación automática: si una estrategia falla, prueba la siguiente (rss → head → fingerprint → api)
- Si una estrategia diferente funciona, esa se convierte en default para ese sitio
- Dashboard ahora muestra errores reales (no más "4 OK" falsos)
- Cada resultado muestra: estado con color, detalle de estrategia, icono de rotación
