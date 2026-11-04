import { atomic } from '../../atomic/index.js'

export const upsertUser = {
  name: 'upsert_user',

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler(input, ctx) {
    // Creating an access token registers the user with Atomic, or finds the
    // existing one. The token itself is discarded; get_action_config makes
    // its own when the app needs one.
    await atomic.createAccessToken(ctx.userIdentifier)
    return { state: 'ready' }
  }
}
