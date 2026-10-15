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
// action is the webhook's data.flow, such as 'cancel-plan' or 'connect-account'.
db.exec(`
  CREATE TABLE IF NOT EXISTS task_status_update_events (
    task_id TEXT PRIMARY KEY,
    user_identifier TEXT NOT NULL,
    action TEXT,
    company_id TEXT,
    company_name TEXT,
    status TEXT NOT NULL,
    reason TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// company_id and reason were added later; databases created before then don't have them.
const taskColumns = db.prepare('PRAGMA table_info(task_status_update_events)').all()
for (const column of ['company_id', 'reason']) {
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
  action,
  companyId,
  companyName,
  status,
  reason
}) {
  const { changes } = db.prepare(`
    INSERT INTO task_status_update_events
      (task_id, user_identifier, action, company_id, company_name, status, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (task_id) DO UPDATE SET
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
    action ?? null,
    companyId ?? null,
    companyName ?? null,
    status,
    reason ?? null
  )
  return changes > 0
}

// The user's most recently updated tasks, newest first.
export function getTaskStatusUpdatedEvents(userIdentifier, limit = 10) {
  return db.prepare(`
    SELECT task_id, action, company_id, company_name, status, reason, updated_at
    FROM task_status_update_events
    WHERE user_identifier = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userIdentifier, limit)
}
