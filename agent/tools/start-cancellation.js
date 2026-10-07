import { atomic } from '../../atomic/index.js'

export const startCancellation = {
  name: 'start_cancellation',

  description: `Prepare Atomic's Transact SDK to run one action, such as cancelling a plan, for the user.
- Pass the actionId of a 'cancel-plan' action from get_actions_for_company. For a 'connect-account' action, use start_connect_account.
- The user's app then shows a "Cancel <merchant>" button. Nothing reaches the merchant until the user taps it and finishes in the Atomic screen, where they may be asked to sign in to the merchant.
- Never ask for the user's merchant password. Atomic collects sign-in details itself.
- After calling, tell the user to tap the button to continue. When they leave the Atomic screen, you get a transact-finished or transact-closed event.
- The app shows only the newest button, so a new one replaces any earlier button; never tell the user to tap an earlier one.`,

  schema: {
    type: "object",
    properties: {
      actionId: {
        type: "string",
        description: "The actionId of the action to run, from get_actions_for_company."
      },
      companyName: {
        type: "string",
        description: "The company's name, shown on the button, for example 'Netflix'."
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
        label: `Cancel ${companyName}`,
        finishedLabel: `${companyName} cancellation submitted`,
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
