import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  description: `Check how the user's recent Atomic tasks went, such as a cancellation or a sign-in to a merchant. Call this after a transact-finished or transact-closed event, to see where the task stands, and when the user asks whether a cancellation went through.
- Returns the stored task-status-updated webhooks as database rows, newest first: one row per task with its latest status. Each row has task_id, action (what the task did: 'cancel-plan' is a cancellation, 'connect-account' is a sign-in), company_name, status, and updated_at (UTC).
- Use the newest event for the merchant the user was cancelling.
- status 'completed' with action 'cancel-plan': the cancellation went through. Tell the user, and mention that some merchants keep the plan running until the end of the billing period.
- status 'failed': the task didn't succeed. Say so, and offer to try again or to connect the user with your support team.
- status 'processing': Atomic is still working on it. Tell the user it's in progress, and that you'll let them know when it finishes.
- If you already told the user this outcome, don't repeat it; acknowledge briefly.
- No event for that merchant: Atomic hasn't reported on it yet, which can take a moment after the screen closes. Say you're waiting to hear back and will let them know as soon as you do. Don't say it failed.`,

  schema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    return { events: getTaskStatusUpdatedEvents(ctx.userIdentifier, 10) }
  }
}
