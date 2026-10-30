import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  description: `
Check where the user's Atomic tasks stand, such as a cancellation, the refresh that follows it, or a
sign-in. Call this after a transact-finished or transact-closed event, passing its launchId, and
when the user asks whether a cancellation went through. The system prompt explains how to read the
result and what to tell the user.
- launchId: the launchId from the transact-finished or transact-closed event. With it, tasks lists
  only the tasks that Transact launch started: the cancellation or sign-in, and the refresh after a
  cancellation. Without it, tasks lists the user's latest tasks from any launch.
- tasks: the stored task-status-updated webhooks, newest first, one row per task with its latest
  status. Each row has task_id, launch_id (the Transact launch that started it), action (what the
  task did: 'cancel-plan' is a cancellation, 'refresh' resyncs the user's data afterwards,
  'connect-account' is a sign-in), company_id (pass it as companyId to get_user_subscriptions to
  read that company's account), company_name, status ('processing', 'completed', or 'failed'),
  reason (why it failed), and updated_at (UTC). Once a refresh has completed, the user's new data is
  ready to read with get_user_subscriptions.`,

  schema: {
    type: "object",
    properties: {
      launchId: {
        type: "string",
        description: "The launchId from the transact-finished or transact-closed event."
      }
    },
    additionalProperties: false
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ launchId }, ctx) {
    return {
      tasks: getTaskStatusUpdatedEvents(ctx.userIdentifier, { launchId })
    }
  }
}
