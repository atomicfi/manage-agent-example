import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  description: `Check how the user's recent Atomic tasks went, such as a cancellation or a sign-in to a merchant. Call this after a transact-finished or transact-closed event, to see where the task stands, and when the user asks whether a cancellation went through.
- Each event is one task, newest first, with its latest status. action is what the task did: 'cancel-plan' is a cancellation, 'connect-account' is a sign-in to the merchant. companyName is the merchant.
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

  outputSchema: {
    type: "object",
    properties: {
      events: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          properties: {
            taskId: {
              type: "string"
            },
            action: {
              type: ["string", "null"],
              description: "What the task did, such as 'cancel-plan' or 'connect-account'."
            },
            companyName: {
              type: ["string", "null"],
              description: "The merchant, such as 'Netflix'."
            },
            status: {
              enum: ["processing", "completed", "failed"]
            },
            updatedAt: {
              type: "string",
              description: "When Atomic last reported on this task, in UTC."
            }
          },
          required: ["taskId", "action", "companyName", "status", "updatedAt"]
        }
      }
    },
    required: ["events"]
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    const rows = getTaskStatusUpdatedEvents(ctx.userIdentifier, 10)
    return {
      events: rows.map((r) => ({
        taskId: r.task_id,
        action: r.action,
        companyName: r.company_name,
        status: r.status,
        updatedAt: r.updated_at
      }))
    }
  }
}
