import { getTaskStatusUpdatedEvents } from '../../server/db.js'

export const checkEvents = {
  name: 'check_events',

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    return {
      now: new Date().toISOString(),
      tasks: getTaskStatusUpdatedEvents(ctx.userIdentifier, 10)
    }
  }
}
