# DECODEX v0.13.0 — Nota de Sesión

## Estado Actual

- Build: Sin errores
- Servidor Next.js (3000): Corriendo
- Caddy Proxy (81): Ya configurado por el sistema, redirige a 3000
- Base de datos: 173 personas, 30 medios, 47 ejes, 45 indicadores
- Git push: Commit dba6f61 en main (PUSHED OK)

## Credenciales de Acceso

| Rol | Email | Password |
|---|---|---|
| Admin | admin@decodex.bo | admin123 |
| Agente | agente@decodex.bo | agente123 |

## URLs

- Preview: https://preview-ws-c6cd3734-d3a5-446e-821a-93091b145b41.space.chatglm.site/
- Login: /login
- Dashboard Admin: /dashboard
- Dashboard Agente: /agente

## Cómo Levantar el Servidor (en nueva sesión)

```bash
cd /home/z/my-project/connect
DATABASE_URL="file:/home/z/my-project/db/custom.db" \
AUTH_TRUST_HOST=true \
AUTH_SECRET="decodex-prod-secret-v013-2025-stable" \
NEXTAUTH_URL="http://localhost:3000" \
node node_modules/next/dist/bin/next start -p 3000
```

Caddy ya corre en puerto 81 y redirige a 3000 automáticamente.
El servidor Next.js se debe mantener vivo en port 3000 para que el preview funcione.

## Cambios en Esta Sesión

1. **next.config.ts**: Desactivado `output: 'standalone'` (causaba crashes)
2. **middleware.ts**: Agregado `/api/seed` y `/api/indicadores/capture` a rutas públicas
3. **Caddyfile**: Configuración de reverse proxy (port 81 -> 3000), copiado de verinews
4. **deploy.sh**: Script de inicio de producción
5. **Usuarios creados**: admin + agente en la base de datos SQLite
6. **Seed ejecutado**: 173 personas, 30 medios, 47 ejes temáticos, 45 indicadores
7. **Captura de datos**: 12 indicadores con datos reales (LME + commodities)

## Indicadores con Datos Reales (12/45)

- LME Cobre, Zinc, Estaño, Plata, Plomo
- Café, Soya, y otros commodities
- Faltan por implementar: macro_bcb (7), ine (4), salud (3), social (6), economico (1)

## Pendientes para Próxima Sesión

- Probar dashboard completo con usuario admin
- Agregar indicadores del Banco Central de Bolivia (BCB API)
- Agregar indicadores del INE
- Agregar indicadores de Salud
- Expandir indicadores de commodities (quinua, arroz)
- Estabilizar el servidor (investigar por qué se cae entre llamadas del shell)
