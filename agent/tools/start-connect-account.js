import { atomic } from '../../atomic/index.js'

export const startConnectAccount = {
  name: 'start_connect_account',

  description: `Prepare Atomic's Transact SDK so the user can sign in to their account at a merchant. Once connected, Atomic can read the user's subscriptions there, and cancellations for them become available.
- Pass the actionId of a 'connect-account' action from get_actions_for_company. Don't pass a 'cancel-plan' action; use start_cancellation for those.
- The user's app then shows a "Connect <merchant>" button. Nothing happens until the user taps it and signs in to the merchant in the Atomic screen.
- Never ask for the user's merchant password. Atomic collects sign-in details itself.
- After calling, tell the user to tap the button to sign in. When they leave the Atomic screen, you get a transact-finished or transact-closed event.
- The app shows only the newest button, so a new one replaces any earlier button; never tell the user to tap an earlier one.
- If check_events shows the connect-account task completed, call get_actions_for_company again for the merchant to find the cancellations now available. Atomic may still be reading the user's subscriptions for a short while; if get_actions_for_company still returns no cancel-plan action for the subscription, tell the user their subscriptions are still loading rather than asking them to sign in again.`,

  schema: {
    type: "object",
    properties: {
      actionId: {
        type: "string",
        description: "The actionId of the 'connect-account' action, from get_actions_for_company."
      },
      companyName: {
        type: "string",
        description: "The company's name, shown on the button, for example 'Apple'."
      }
    },
    required: ["actionId", "companyName"],
    additionalProperties: false
  },

  // Besides its output for the model, this tool returns a clientAction: the
  // config the app needs to open Atomic's Transact SDK. The public token in it
  // goes to the app only, never to the model.
  returnsClientAction: true,

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ actionId, companyName }, ctx, { newId, sdkEnvironment }) {
    const { data } = await atomic.createAccessToken(ctx.userIdentifier)
    return {
      output: { state: 'ready' },
      clientAction: {
        type: 'launch_transact',
        id: newId(),
        label: `Connect ${companyName}`,
        finishedLabel: `${companyName} connected`,
        config: {
          scope: 'pay-link',
          publicToken: data.publicToken,
          tasks: [{ operation: 'action', action: { id: actionId } }]
        },
        environment: sdkEnvironment
      }
    }
  }
}
