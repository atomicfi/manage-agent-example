import { atomic } from '../../atomic/index.js'

// The two action types this app uses, as in get_actions_for_company.
const filterActions = (actions) =>
  (actions ?? []).filter((a) => a.type === 'cancel-plan' || a.type === 'connect-account')

export const getUserSubscriptions = {
  name: 'get_user_subscriptions',

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ companyId }, ctx) {
    const { accounts } = await atomic.getAccounts(ctx.userIdentifier, { companyId })
    // Atomic's structure and field names, keeping only what the agent needs.
    // Left out: the user's personal details (data), payment history, line items,
    // expenses, and suggestions.
    return {
      accounts: accounts.map(
        ({ _id, company, connectionStatus, processing, lastSyncedAt, actions, bills }) => ({
          _id,
          company,
          connectionStatus,
          processing,
          lastSyncedAt,
          actions: filterActions(actions),
          bills: (bills ?? []).map(
            ({ _id, name, amount, billingCycle, dueDate, plans, actions }) => ({
              _id,
              name,
              amount,
              billingCycle,
              dueDate,
              plans,
              actions: filterActions(actions)
            })
          )
        })
      )
    }
  }
}
