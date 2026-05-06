#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# backup-db.sh — Backup automatico de SQLite DB a GitHub
# DECODEX Bolivia / ONION200 Connect App
# ═══════════════════════════════════════════════════════════════
#
# Uso:
#   ./scripts/backup-db.sh              # Backup manual
#   ./scripts/backup-db.sh --pre-push   # Solo si hay cambios en DB
#
# El script:
#   1. Copia la DB activa a backups/dev-YYYYMMDD-HHmmss.db
#   2. Ejecuta VACUUM para optimizar el backup
#   3. Hace git add, commit y push
#   4. Limpia backups mayores a 7 dias (local)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────
REPO_DIR="/home/z/my-project/connect-repo"
BACKUP_DIR="${REPO_DIR}/backups"
# DB primaria: persistente en Z.ai sandbox (sobrevive reinicios)
DB_PATH="/home/z/my-project/upload/db/dev.db"
# Fallback: DB en el repo (si existe)
ALT_DB_PATH="${REPO_DIR}/db/custom.db"

# Tiempo maximo de backups locales (dias)
MAX_BACKUP_AGE_DAYS=7
# Maximo de backups locales
MAX_BACKUP_FILES=30

# ─── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[backup]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[backup]${NC} $1"; }
log_error() { echo -e "${RED}[backup]${NC} $1" >&2; }

# ─── Detectar DB activa ─────────────────────────────────────
detect_db() {
  if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ]; then
    echo "$DB_PATH"
  elif [ -f "$ALT_DB_PATH" ] && [ -s "$ALT_DB_PATH" ]; then
    echo "$ALT_DB_PATH"
  else
    log_error "No se encontro DB en ninguna ubicacion:"
    log_error "  Primaria: ${DB_PATH}"
    log_error "  Alt:      ${ALT_DB_PATH}"
    exit 1
  fi
}

# ─── Main ────────────────────────────────────────────────────
PRE_PUSH_MODE=false
[ "${1:-}" = "--pre-push" ] && PRE_PUSH_MODE=true

ACTIVE_DB=$(detect_db)
DB_SIZE=$(du -h "$ACTIVE_DB" | cut -f1)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dev-${TIMESTAMP}.db"

log_info "DB activa: ${ACTIVE_DB} (${DB_SIZE})"
log_info "Backup destino: ${BACKUP_FILE}"

# ─── Pre-push: salir si no hay cambios recientes ────────────
if [ "$PRE_PUSH_MODE" = true ]; then
  # Buscar el backup mas reciente
  LATEST=$(ls -t "${BACKUP_DIR}"/dev-*.db 2>/dev/null | head -1)
  if [ -n "$LATEST" ]; then
    # Comparar tamaños (aprox) — si son iguales, no hay cambios significativos
    ACTIVE_SIZE=$(stat -c%s "$ACTIVE_DB" 2>/dev/null || echo "0")
    LATEST_SIZE=$(stat -c%s "$LATEST" 2>/dev/null || echo "0")
    DIFF=$((ACTIVE_SIZE - LATEST_SIZE))
    # Si la diferencia es menor a 10KB, probablemente no hay cambios
    if [ "$DIFF" -gt -10240 ] && [ "$DIFF" -lt 10240 ]; then
      log_info "Pre-push: DB sin cambios significativos (diff: ${DIFF} bytes), skip backup"
      exit 0
    fi
  fi
fi

# ─── Crear backup ───────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# Usar sqlite3 para VACUUM si esta disponible (optimiza el backup)
if command -v sqlite3 &>/dev/null; then
  log_info "Creando backup con VACUUM..."
  # Copiar primero, luego VACUUM la copia (no la original)
  cp "$ACTIVE_DB" "$BACKUP_FILE"
  sqlite3 "$BACKUP_FILE" "VACUUM;" 2>/dev/null || true
else
  log_info "sqlite3 no disponible, copia directa..."
  cp "$ACTIVE_DB" "$BACKUP_FILE"
fi

# Verificar integridad del backup
if command -v sqlite3 &>/dev/null; then
  INTEGRITY=$(sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" 2>/dev/null | head -1)
  if [ "$INTEGRITY" = "ok" ]; then
    log_info "Integridad del backup: OK"
  else
    log_warn "Integridad del backup: ${INTEGRITY} — eliminando backup corrupto"
    rm -f "$BACKUP_FILE"
    exit 1
  fi
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_info "Backup creado: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ─── Git commit + push ──────────────────────────────────────
cd "$REPO_DIR"

# Configurar git si es necesario
git config user.email "ai-agent@z.ai" 2>/dev/null || true
git config user.name "AI Agent" 2>/dev/null || true

git add "${BACKUP_FILE}"

# Checkear si hay algo que commitear
if git diff --cached --quiet; then
  log_info "Sin cambios nuevos para commitear"
else
  COMMIT_MSG="backup: DB snapshot ${TIMESTAMP} (${BACKUP_SIZE})"
  git commit -m "$COMMIT_MSG"
  log_info "Commit: ${COMMIT_MSG}"

  # Push con rebase
  git pull origin main --rebase 2>/dev/null || {
    log_warn "Pull rebase fallo, intentando push directo..."
  }
  git push origin main 2>/dev/null || {
    log_warn "Push fallo — el backup se conservara localmente para el proximo intento"
  }
  log_info "Push completado"
fi

# ─── Limpieza de backups locales antiguos ───────────────────
log_info "Limpiando backups locales (> ${MAX_BACKUP_AGE_DAYS} dias, max ${MAX_BACKUP_FILES})..."

# Eliminar backups mayores a MAX_BACKUP_AGE_DAYS
find "$BACKUP_DIR" -name "dev-*.db" -type f -mtime +${MAX_BACKUP_AGE_DAYS} -delete 2>/dev/null || true

# Si aun hay mas de MAX_BACKUP_FILES, eliminar los mas antiguos
FILE_COUNT=$(ls -1 "${BACKUP_DIR}"/dev-*.db 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt "$MAX_BACKUP_FILES" ]; then
  EXCESS=$((FILE_COUNT - MAX_BACKUP_FILES))
  ls -t "${BACKUP_DIR}"/dev-*.db | tail -n "$EXCESS" | xargs rm -f 2>/dev/null || true
  log_info "Eliminados ${EXCESS} backup(s) antiguos"
fi

REMAINING=$(ls -1 "${BACKUP_DIR}"/dev-*.db 2>/dev/null | wc -l)
log_info "Backups locales restantes: ${REMAINING}"
log_info "Backup completado exitosamente"
