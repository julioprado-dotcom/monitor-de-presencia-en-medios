---
Task ID: 1
Agent: Main Agent
Task: Corregir falso positivo Worker sin actividad

Work Log:
- Identificado bug en diagnoseWorker(): umbral 30 min causaba falso positivo
- Reescrita logica: worker+scheduler activo = esperando (ok), sin limite de tiempo
- Migrado initialized a globalThis para evitar doble init entre contextos Turbopack
- Build exitoso, servidor reiniciado, diagnostico verificado

Stage Summary:
- diagnoseWorker() devuelve Worker esperando (ok) cuando scheduler tiene tareas
- initJobSystem() usa globalThis para compartir estado entre modulos
- Verificado: worker=esperando(ok), scheduler=22 tareas, healthScore=70

