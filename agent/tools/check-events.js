import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  description: `
Check where the user's recent Atomic tasks stand, such as a cancellation or a sign-in. Call this
when the app asks for an update (such as "provide cancel-plan of Netflix update") or the user asks
for a status update, such as how their last task went or whether a cancellation went through. The
system prompt explains how to read the result and what to tell the user.
- now: the current time (UTC), so you can tell how long ago a task was updated.
- tasks: the task status updates the app saved from Transact, newest first, one row per task with
  its latest status. Each row has task_id, action (what the task did: 'cancel-plan' is a
  cancellation, 'connect-account' is a sign-in, 'refresh' resyncs the user's data), company_id (pass
  it as companyId to get_user_subscriptions to read that company's account), company_name, status
  ('processing', 'completed', or 'failed'), reason (why it failed), and updated_at (UTC). Once a
  refresh has completed, the user's new data is ready to read with get_user_subscriptions.`,

  schema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    return {
      now: new Date().toISOString(),
      tasks: getTaskStatusUpdatedEvents(ctx.userIdentifier, 10)
    }
  }
}
