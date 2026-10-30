// Single-file SQLite database using Node's built-in node:sqlite.
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const dbPath = fileURLToPath(new URL('../data.db', import.meta.url))

export const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL
  )
`)

// Seed the user from USER_IDENTIFIER so there is someone to chat as.
db.prepare(
  'INSERT OR IGNORE INTO users (id, firstname, lastname) VALUES (?, ?, ?)'
).run(process.env.USER_IDENTIFIER, 'Test', 'User')

export function getUser(id) {
  return db.prepare('SELECT id, firstname, lastname FROM users WHERE id = ?').get(id)
}

// No login yet: every request from the app acts as the seeded test user.
export function getCurrentUser() {
  return getUser(process.env.USER_IDENTIFIER)
}

// The latest status of each Atomic task, from task-status-updated webhooks.
// launch_id is the Transact launch that started the task, from the webhook's
// metadata. action is the webhook's data.flow, such as 'cancel-plan' or
// 'connect-account'.
db.exec(`
  CREATE TABLE IF NOT EXISTS task_status_update_events (
    task_id TEXT PRIMARY KEY,
    user_identifier TEXT NOT NULL,
    launch_id TEXT,
    action TEXT,
    company_id TEXT,
    company_name TEXT,
    status TEXT NOT NULL,
    reason TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// These columns were added later; databases created before then don't have them.
const taskColumns = db.prepare('PRAGMA table_info(task_status_update_events)').all()
for (const column of ['company_id', 'reason', 'launch_id']) {
  if (!taskColumns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE task_status_update_events ADD COLUMN ${column} TEXT`)
  }
}

// Atomic retries deliveries, so a late 'processing' can arrive after the
// task finished. Once a task is completed or failed, keep that status.
// reason says why a failed task failed. Returns whether the stored row changed.
export function saveTaskStatusUpdatedEvent({
  taskId,
  userIdentifier,
  launchId,
  action,
  companyId,
  companyName,
  status,
  reason
}) {
  const { changes } = db.prepare(`
    INSERT INTO task_status_update_events
      (task_id, user_identifier, launch_id, action, company_id, company_name, status, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (task_id) DO UPDATE SET
      launch_id = COALESCE(excluded.launch_id, launch_id),
      action = COALESCE(excluded.action, action),
      company_id = COALESCE(excluded.company_id, company_id),
      company_name = COALESCE(excluded.company_name, company_name),
      status = excluded.status,
      reason = excluded.reason,
      updated_at = datetime('now')
    WHERE task_status_update_events.status = 'processing'
  `).run(
    taskId,
    userIdentifier,
    launchId ?? null,
    action ?? null,
    companyId ?? null,
    companyName ?? null,
    status,
    reason ?? null
  )
  return changes > 0
}

// The user's most recently updated tasks, newest first. With launchId, only
// the tasks that Transact launch started.
export function getTaskStatusUpdatedEvents(userIdentifier, { launchId, limit = 10 } = {}) {
  return db.prepare(`
    SELECT task_id, launch_id, action, company_id, company_name, status, reason, updated_at
    FROM task_status_update_events
    WHERE user_identifier = ? AND (? IS NULL OR launch_id = ?)
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userIdentifier, launchId ?? null, launchId ?? null, limit)
}
