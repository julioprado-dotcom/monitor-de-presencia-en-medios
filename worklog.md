---
Task ID: 1
Agent: Backend Agent
Task: FASE 1 - Prisma Schema + Validations + Fallback + API Endpoints

Work Log:
- Added 6 new fields to Medio model in prisma/schema.prisma (naturaleza, ambito, enfoque, credibilidad, ultimaRevisionHumana, ultimoError)
- Updated medioCreateSchema with new classification fields + URL refine validation
- Updated medioUpdateSchema with categoria, naturaleza, ambito, enfoque, credibilidad, frecuenciaOverride + URL refine
- Replaced silent skip in capture/route.ts with domain extraction fallback from medio.url
- Updated POST /api/medios to handle new classification fields
- Updated PUT /api/medios/[id] to sync URL changes to FuenteEstado and auto-set ultimaRevisionHumana
- Created POST /api/medios/[id]/probe (5-step live diagnostic: DNS, HTTP, RSS, sync)
- Created POST /api/medios/batch-fix (auto-create FuenteEstado, reactivate, classify .gob.bo)
- Created POST /api/medios/[id]/ai-analyze (ZAI LLM classification suggestion)
- Ran prisma generate + prisma db push successfully

Stage Summary:
- 4 files modified, 3 new API routes created
- Database schema updated with 6 new columns
- Capture route no longer silently skips medios without mapped domain

---
Task ID: 3
Agent: Frontend Agent
Task: FASE 2 - Create FuentesView.tsx component

Work Log:
- Created /home/z/my-project/src/components/onion200/FuentesView.tsx (~580 lines)
- Fleet status table with Nombre, Naturaleza badge, Estado Tecnico, Ultima Revision, Credibilidad
- Filter buttons: Todos, Solo con errores, Solo inactivos
- Inline probe diagnostic with terminal-style log output
- Inline edit panel with dropdowns for naturaleza/ambito/enfoque and credibilidad slider
- GUARDAR button (PUT), ANALIZAR IA button (AI suggestion), MARCAR REVISADO
- AUTOCORREGIR FALLOS batch action
- All text in Spanish, no traffic light metaphors
- Matches ONION200 dark sci-fi theme

Stage Summary:
- New component: src/components/onion200/FuentesView.tsx
- Integrated into dashboard as FUENTES tab
- Build passed, committed as 91343da, pushed to main
---
Task ID: 1
Agent: Main Agent
Task: AUDITORÍA CRÍTICA — Fallo en Vinculación de Personas (IA devuelve arrays vacíos)

Work Log:
- Audit of src/lib/ai/extractor-menciones.ts: Pipeline A (scrape-fuente) DOES inject 173 personas into prompt
- Audit of src/lib/analyze.ts: analyzeMencion() does NOT extract persons — only classifies treatment
- Audit of /api/analyze/batch/route.ts: Uses analyzeMencion() → cannot link persons in orphan mentions
- Audit of /api/capture/route.ts: personasBatchSize was 10 (only 10/173 persons processed)
- Audit of parseo: filter rejects personaId/persona_nombre variants, only accepts persona_id
- Identified 3 root causes (see report)
- Implemented fixes:
  1. extractor-menciones.ts: added robust parseo with fuzzy name matching, alias support, debug logging
  2. analyze/batch/route.ts: now uses extraerMencionesDeTexto for orphan mentions (personaId=null)
  3. capture/route.ts: increased personasBatchSize from 10 to 173, removed take limit

Stage Summary:
- 3 files modified: extractor-menciones.ts, analyze/batch/route.ts, capture/route.ts
- Root cause: batch endpoint used wrong function (analyzeMencion vs extraerMencionesDeTexto)
- Debug logs persist to logs/extractor-debug/ directory
- Fuzzy matching added: persona_id/personaId/name-based fallback
---
Task ID: 2
Agent: Main Agent
Task: Módulo Descubrimiento Inteligente + Auditoría de Despliegue

Work Log:
- Added SugerenciaInteligencia model to Prisma schema (tipo, datoPropuesto, confianza, estado)
- Ran prisma db push — schema synced, Prisma Client regenerated
- Created src/lib/ai/discovery.ts — full discovery engine:
  - getMencionesHuerfanasDelDia: collects orphan mentions from today
  - extractEntidades: LLM-based entity extraction (persona/org/tema)
  - Agrupar + filtrar anti-duplicados against 173 existing personas
  - Calcular confianza: 10pts per mention + 20pts per distinct medium
  - Only suggest if confidence >= 30 (appears in 2+ media)
  - aprobarSugerenciaPersona: creates Persona record from suggestion
  - rechazarSugerencia: marks as rejected
- Created API /api/sugerencias (GET with filters, POST to run discovery, PATCH to approve/reject, DELETE)
- Created API /api/sugerencias/[id] (PATCH approve/reject with auth, DELETE)
- Integrated discovery into scrape-fuente.ts Pipeline A (runs after capture, best-effort)
- Created InteligenciaView.tsx — ONION200-styled view:
  - Sparkles icon, violet theme
  - KPI counts (pendientes/aprobadas/rechazadas)
  - Card grid with confidence, media tags, frequency
  - Action buttons: Crear Persona / Ignorar / Eliminar
  - Discovery log panel
  - Filters by estado
- Added INTELIGENCIA tab to main dashboard (page.tsx)
- Deployment audit verified:
  - personasBatchSize: 173 (no take limit) ✓
  - extractormenciones timeout: 60s ✓
  - discovery timeout: 45s ✓
  - All new files compile without TS errors ✓

Stage Summary:
- 7 files changed, 1283 insertions
- 4 new files created
- Commit: feat: Modulo Descubrimiento Inteligente + Fix vinculacion personas
- Ready for VPS deploy: git push origin main
