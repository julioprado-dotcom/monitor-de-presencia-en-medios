---
Task ID: 1
Agent: main
Task: Auditoría Externa de Fuentes con Z.ai — Crear, corregir y ejecutar script

Work Log:
- Encontré que `scripts/audit-fuentes-zai.ts` ya existía de una sesión anterior
- Corregí errores de TypeScript: campo `dbFallos` no estaba en interfaz `AuditResult`, `medio.ultimoError` no estaba en select
- Verificé DB: `prisma/db/custom.db` tiene 54 medios, `db/custom.db` está vacío
- Ejecuté DRY RUN exitosamente: 54 medios (51 con URL, 3 sin URL, 30 con FuenteEstado)
- Ejecuté prueba rápida con --limit 3: confirmó conectividad parcial desde el servidor
- Test de conectividad: Google/BBC/Reuters OK, algunos .bo fallan (ABI, El Deber), otros .bo OK (ERBOL, Los Tiempos)
- Ejecuté auditoría completa en 6 batches de 9 medios cada uno (setsid + wait)
- Agregué parámetro `--batch N` al script para generar archivos separados por batch
- Creé `scripts/consolidar-auditoria.ts` para merge de resultados
- Creé `scripts/run-auditoria-completa.ts` para ejecución automatizada

Stage Summary:
- Reporte consolidado: `logs/auditoria-fuentes-20260518-consolidado.json`
- 54 medios auditados: 15 OK, 30 DEAD (19 probablemente vivos pero inalcanzables desde este servidor), 3 sin URL
- 4 RSS encontrados: Bolivia Verifica, ERBOL, Los Tiempos, eju.tv
- 10 sitios con Cloudflare/protección anti-bot (necesitan ZAI_READER)
- 7 redirecciones detectadas, incluyendo La Patria -> ufacup88.co (CRÍTICO: posible takeover)
- 3 medios sin URL: La Estrella, La Lupa Bolivia, Norte de Potosí
- 60 sentencias SQL sugeridas en el reporte consolidado
- Scripts modificados: `scripts/audit-fuentes-zai.ts` (fix TypeScript + --batch flag)
- Scripts nuevos: `scripts/consolidar-auditoria.ts`, `scripts/run-auditoria-completa.ts`
