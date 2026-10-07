import { atomic } from '../../atomic/index.js'

export const getActionsForCompany = {
  name: 'get_actions_for_company',

  description: `List what this user can do at one merchant right now: cancel a plan, or connect (sign in to) their account there. Call it every time before you propose a cancellation, because actions change as plans change. Offer only actions it returns.
- type 'cancel-plan': a cancellation. Name each one by its bill.name, the subscription it cancels. When there's no bill, Atomic can't see the user's subscriptions there yet, so call it 'your <merchant> account'. Start it with start_cancellation.
- type 'connect-account': a sign-in, not a cancellation. Signing in lets Atomic read the user's subscriptions at this merchant, which can unlock cancellations it can't offer yet, as at Apple or Amazon. Start it with start_connect_account. Never pass it to start_cancellation.
- Both types returned: offer the cancel-plan action that matches the subscription the user means. Offer connect-account only when none matches, explaining that signing in may let Atomic find it.
- Only connect-account returned: explain that the user needs to sign in to the merchant through Atomic before a cancellation is possible, and ask if they'd like to.
- automated false: tell the user Atomic will open the merchant's own page and they'll finish it there.
- disabled true (the merchant is under maintenance): leave it out, and offer to connect the user with your support team.
- Several cancel-plan actions: list them and ask which one the user means.
- No actions: the plan may already be cancelled. Call get_user_subscriptions with the same companyId and check the plan's status and pendingChange. If the plan is cancelled or inactive, or has a cancellation pending, tell the user that. Otherwise, say cancellation isn't available for this account right now and that you don't know why, then offer to connect the user with your support team.`,

  schema: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "The company's _id, from find_company."
      }
    },
    required: ["companyId"],
    additionalProperties: false
  },

  // The cancel-plan and connect-account actions from Atomic's
  // GET /pay-link/actions-for-company/:companyId.
  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ companyId }, ctx) {
    const { actions } = await atomic.getActionsForCompany(companyId, ctx.userIdentifier)
    // Some merchants, such as Apple and Amazon, have cancel-plan only on the
    // user's own bills. Until the user signs in and Atomic reads those bills,
    // the merchant's only action is connect-account.
    return {
      actions: actions.filter((a) => a.type === 'cancel-plan' || a.type === 'connect-account')
    }
  }
}
