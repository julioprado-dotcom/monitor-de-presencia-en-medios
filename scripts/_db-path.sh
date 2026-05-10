#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# _db-path.sh — UNICA fuente de verdad para la ruta de la DB
# DECODEX Bolivia / ONION200 Connect App
# ═══════════════════════════════════════════════════════════════
#
# Todos los scripts shell deben hacer:
#   source "$(dirname "$0")/_db-path.sh"
#
# Esto garantiza que si la ruta cambia, solo se actualiza aquí.
# ═══════════════════════════════════════════════════════════════

# DB canónica — trackeada en git, persiste via repo
# Ruta relativa al directorio del proyecto
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DECODEX_DB_PATH="${PROJECT_ROOT}/prisma/db/custom.db"

# Directorio de backups (dentro de prisma/db/ para persistir via git)
DECODEX_BACKUP_DIR="${PROJECT_ROOT}/prisma/db/backups"
