// backup-scheduler.ts — Backup automático de DB a GitHub (4 veces al día)
// DECODEX Bolivia / ONION200 Connect App
//
// Regla FIRME: Los backups NUNCA se borran.
// Cada snapshot se commita en prisma/db/backups/ y git preserva todo.
//
// Horarios Bolivia:
//   06:00 AM (mañana)   → UTC 10:00
//   12:00 PM (mediodía) → UTC 16:00
//   18:00 PM (tarde)    → UTC 22:00
//   23:00 PM (noche)    → UTC 03:00

import cron from 'node-cron'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

interface BackupSchedulerState {
  running: boolean
  tasks: ReturnType<typeof cron.schedule>[]
  lastBackup: string | null
  backupCount: number
}

const _bs = globalThis as unknown as { __decodex_backup_scheduler__: BackupSchedulerState | undefined }

function getBackupState(): BackupSchedulerState {
  if (!_bs.__decodex_backup_scheduler__) {
    _bs.__decodex_backup_scheduler__ = {
      running: false,
      tasks: [],
      lastBackup: null,
      backupCount: 0,
    }
  }
  return _bs.__decodex_backup_scheduler__
}

// Rutas
const PROJECT_ROOT = process.cwd()
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'backup-db-github.sh')
const DB_PATH = path.join(PROJECT_ROOT, 'prisma', 'db', 'custom.db')

// Horarios de backup (horas UTC) — 4 veces al día
const BACKUP_SCHEDULES: { utcHour: number; periodo: string }[] = [
  { utcHour: 3,  periodo: '23-noche' },   // Bolivia 23:00
  { utcHour: 10, periodo: '06-mañana' },   // Bolivia 06:00
  { utcHour: 16, periodo: '12-mediodía' }, // Bolivia 12:00
  { utcHour: 22, periodo: '18-tarde' },    // Bolivia 18:00
]

// Lock para evitar backups simultáneos
let backupInProgress = false

export function startBackupScheduler(): void {
  const state = getBackupState()
  if (state.running) {
    console.log('[BackupScheduler] Ya está corriendo')
    return
  }
  state.running = true

  console.log('[BackupScheduler] Iniciando backup automático 4x/día a GitHub...')
  console.log('[BackupScheduler] REGLA: Los backups NUNCA se borran.')

  for (const schedule of BACKUP_SCHEDULES) {
    const expression = `0 ${schedule.utcHour} * * *`

    if (!cron.validate(expression)) {
      console.warn(`[BackupScheduler] Expresión cron inválida: ${expression}`)
      continue
    }

    const task = cron.schedule(expression, async () => {
      if (backupInProgress) {
        console.log('[BackupScheduler] Backup en progreso, saltando...')
        return
      }

      // Verificar que la DB exista
      if (!fs.existsSync(DB_PATH) || fs.statSync(DB_PATH).size === 0) {
        console.warn(`[BackupScheduler] DB no encontrada o vacía: ${DB_PATH}`)
        return
      }

      try {
        backupInProgress = true
        const startMs = Date.now()

        console.log(`[BackupScheduler] Ejecutando backup ${schedule.periodo}...`)

        // Ejecutar script de backup
        execSync(`bash "${SCRIPT_PATH}" --force`, {
          cwd: PROJECT_ROOT,
          timeout: 120_000, // 2 min max
          stdio: 'pipe',
          env: {
            ...process.env,
            FORCE_BACKUP: 'true',
          },
        })

        const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
        state.lastBackup = new Date().toISOString()
        state.backupCount++

        console.log(
          `[BackupScheduler] Backup ${schedule.periodo} completado en ${elapsed}s ` +
          `(total: ${state.backupCount})`
        )
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`[BackupScheduler] Error en backup ${schedule.periodo}: ${msg}`)
      } finally {
        backupInProgress = false
      }
    })

    state.tasks.push(task)
    console.log(`[BackupScheduler] Programado: ${schedule.periodo} (UTC ${String(schedule.utcHour).padStart(2, '0')}:00)`)
  }

  console.log(`[BackupScheduler] ${state.tasks.length} tareas programadas. Backups NUNCA se borran.`)
}

export function stopBackupScheduler(): void {
  const state = getBackupState()
  for (const task of state.tasks) {
    task.stop()
  }
  state.tasks.length = 0
  state.running = false
  console.log('[BackupScheduler] Detenido')
}

export function getBackupSchedulerStatus(): {
  running: boolean
  lastBackup: string | null
  backupCount: number
  schedules: { utcHour: number; periodo: string }[]
} {
  const state = getBackupState()
  return {
    running: state.running,
    lastBackup: state.lastBackup,
    backupCount: state.backupCount,
    schedules: BACKUP_SCHEDULES,
  }
}
