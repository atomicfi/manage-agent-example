import { atomic } from '../../atomic/index.js'

export const getActionsForCompany = {
  name: 'get_actions_for_company',

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
