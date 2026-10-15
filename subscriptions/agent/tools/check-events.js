import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  description: `
Check where the user's recent Atomic tasks stand, such as a cancellation, the refresh that follows
it, or a sign-in. Call this after a transact-finished or transact-closed event, and when the user
asks whether a cancellation went through. The system prompt explains how to read the result and what
to tell the user.
- now: the current time (UTC), to tell recent tasks from earlier ones. Only count a task as part of
  the cancellation the user just worked on if its company matches and it was updated in the last 15
  minutes; older tasks are from earlier cancellations.
- tasks: the stored task-status-updated webhooks, newest first, one row per task with its latest
  status. Each row has task_id, action (what the task did: 'cancel-plan' is a cancellation,
  'refresh' resyncs the user's data afterwards, 'connect-account' is a sign-in), company_id (pass it
  as companyId to get_user_subscriptions to read that company's account), company_name, status
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
