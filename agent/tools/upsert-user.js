import { atomic } from '../../atomic/index.js'

export const upsertUser = {
  name: 'upsert_user',

  description: `
Make sure Atomic knows this user, registering them if it doesn't. Call this once at the start of
every conversation, before any other tool.
- It takes no input. The user is identified by the server, never by you.
- Call it again if another tool fails with code 40011 (Atomic doesn't know the user), then retry
  that tool.
- Don't mention this step to the user.`,

  schema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    // Creating an access token registers the user with Atomic, or finds the
    // existing one. The token itself is discarded; get_action_config makes
    // its own when the app needs one.
    await atomic.createAccessToken(ctx.userIdentifier)
    return { state: 'ready' }
  }
}
