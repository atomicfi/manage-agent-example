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

// Seed one test user so there is someone to chat as.
db.prepare(
  'INSERT OR IGNORE INTO users (id, firstname, lastname) VALUES (?, ?, ?)'
).run('test-user-1', 'Test', 'User')

export function getUser(id) {
  return db.prepare('SELECT id, firstname, lastname FROM users WHERE id = ?').get(id)
}

// No login yet: every request from the app acts as the seeded test user.
export function getCurrentUser() {
  return getUser('test-user-1')
}

// The latest status of each Atomic task, from task-status-updated webhooks.
// action is the webhook's data.flow, such as 'cancel-plan' or 'connect-account'.
db.exec(`
  CREATE TABLE IF NOT EXISTS task_status_update_events (
    task_id TEXT PRIMARY KEY,
    user_identifier TEXT NOT NULL,
    action TEXT,
    company_name TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

// Atomic retries deliveries, so a late 'processing' can arrive after the
// task finished. Once a task is completed or failed, keep that status.
// Returns whether the stored row changed.
export function saveTaskStatusUpdatedEvent({ taskId, userIdentifier, action, companyName, status }) {
  const { changes } = db.prepare(`
    INSERT INTO task_status_update_events (task_id, user_identifier, action, company_name, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (task_id) DO UPDATE SET
      action = COALESCE(excluded.action, action),
      company_name = COALESCE(excluded.company_name, company_name),
      status = excluded.status,
      updated_at = datetime('now')
    WHERE task_status_update_events.status = 'processing'
  `).run(taskId, userIdentifier, action ?? null, companyName ?? null, status)
  return changes > 0
}

// PayLink account changes, from pay-link-accounts-updated webhooks. One row per
// delivery; accounts is the webhook's data.accounts as JSON:
// [{ _id, updateType, bills: [{ _id, changedFields? }] }].
db.exec(`
  CREATE TABLE IF NOT EXISTS pay_link_accounts_updated_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_identifier TEXT NOT NULL,
    event_time TEXT NOT NULL,
    accounts TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_identifier, event_time)
  )
`)

// Atomic retries deliveries; a retry has the same eventTime, so it's ignored.
// Returns whether this was a new event.
export function savePayLinkAccountsUpdatedEvent({ userIdentifier, eventTime, accounts }) {
  const { changes } = db.prepare(`
    INSERT OR IGNORE INTO pay_link_accounts_updated_events (user_identifier, event_time, accounts)
    VALUES (?, ?, ?)
  `).run(userIdentifier, eventTime, JSON.stringify(accounts))
  return changes > 0
}

// The user's most recently updated tasks, newest first.
export function getTaskStatusUpdatedEvents(userIdentifier, limit = 10) {
  return db.prepare(`
    SELECT task_id, action, company_name, status, updated_at
    FROM task_status_update_events
    WHERE user_identifier = ?
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userIdentifier, limit)
}
