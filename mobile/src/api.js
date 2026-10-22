// Backend client. The simulator shares the Mac's network, so localhost works
// there; a physical device needs the Mac's LAN IP in EXPO_PUBLIC_API_URL.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// Sends the user's message and resolves to the agent's reply: { reply, action }.
// action is something for the app to do, such as { type: 'launch_transact', ... }, or null.
export function sendMessage(message) {
  return post('/user-message', { message })
}

// Sends a task's status from Transact's onTaskStatusUpdate event to the
// backend, which saves it for the agent to read when the user asks for an update.
export function sendTaskStatusUpdate(update) {
  return post('/task-status-update', update)
}

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)
  return data
}
