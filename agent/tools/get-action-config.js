import { atomic } from '../../atomic/index.js'

// The button the app shows for each action type.
const BUTTONS = {
  'cancel-plan': (name) => ({
    label: `Cancel ${name}`,
    finishedLabel: `${name} cancellation submitted`
  }),
  'connect-account': (name) => ({
    label: `Connect ${name}`,
    finishedLabel: `${name} connected`
  })
}

export const getActionConfig = {
  name: 'get_action_config',

  description: `
Prepare Atomic's Transact SDK to run one action for the user: a 'cancel-plan' action cancels a
plan, and a 'connect-account' action signs the user in to their account at a company, so Atomic can
read their bills there and offer cancellations for them.
- Pass the action's actionId and type, from get_actions_for_company or get_user_subscriptions,
  and the company's branding.logo as logo, from find_company or list_cancellable_companies, so the
  button shows the company's logo.
- The user's app then shows a "Cancel <company>" or "Connect <company>" button. Nothing reaches the
  company until the user taps it and finishes in the Atomic screen, where they may be asked to sign
  in.
- Never ask for the user's password. Atomic collects sign-in details itself.
- After calling, tell the user to tap the button to continue. When they leave the Atomic screen, you
  get a transact-finished or transact-closed event with a launchId for this button. The webhooks for
  the tasks it starts carry the same launchId.
- The app shows only the newest button, so a new one replaces any earlier button; never tell the
  user to tap an earlier one.
- If check_events shows a connect-account task completed, call get_actions_for_company again for
  the company to find the cancellations now available. Atomic may still be reading the user's bills
  for a short while; if get_actions_for_company still returns no cancel-plan action for the
  subscription, tell the user their subscriptions are still loading rather than asking them to sign
  in again.`,

  schema: {
    type: 'object',
    properties: {
      actionId: {
        type: 'string',
        description: 'The actionId of the action to run.'
      },
      type: {
        enum: ['cancel-plan', 'connect-account'],
        description: "The action's type."
      },
      logo: {
        type: 'object',
        description: "Optional. The company's branding.logo, shown as an icon on the button.",
        properties: {
          url: { type: 'string' },
          backgroundColor: { type: 'string' }
        },
        required: ['url']
      },
      companyName: {
        type: 'string',
        description: "The company's name, shown on the button, for example 'Netflix'."
      }
    },
    required: ['actionId', 'type', 'companyName'],
    additionalProperties: false
  },

  // Besides its output for the model, this tool returns a clientAction: the
  // config the app needs to open Atomic's Transact SDK. The public token in it
  // goes to the app only, never to the model.
  returnsClientAction: true,

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ actionId, type, logo, companyName }, ctx, { newId, sdkEnvironment }) {
    const { data } = await atomic.createAccessToken(ctx.userIdentifier)
    // One id per button. Atomic returns Transact's metadata in the webhooks for
    // every task this launch starts, including the refresh after a cancellation,
    // and the app sends the id back with onFinish and onClose, so results match
    // the launch they came from.
    const launchId = newId()
    return {
      output: { state: 'ready' },
      clientAction: {
        type: 'launch_transact',
        id: launchId,
        ...BUTTONS[type](companyName),
        logo,
        config: {
          scope: 'pay-link',
          publicToken: data.publicToken,
          tasks: [{ operation: 'action', action: { id: actionId } }],
          // https://docs.atomicfi.com/paylink/reference/transact-sdk#metadata
          metadata: { launchId }
        },
        environment: sdkEnvironment
      }
    }
  }
}
