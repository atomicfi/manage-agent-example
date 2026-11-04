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

  // Besides its output for the model, this tool returns a clientAction: the
  // config the app needs to open Atomic's Transact SDK. The public token in it
  // goes to the app only, never to the model.
  returnsClientAction: true,

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ actionId, type, logo, companyName }, ctx, { newId, sdkEnvironment }) {
    const { data } = await atomic.createAccessToken(ctx.userIdentifier)
    return {
      output: { state: 'ready' },
      clientAction: {
        type: 'launch_transact',
        id: newId(),
        ...BUTTONS[type](companyName),
        logo,
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
