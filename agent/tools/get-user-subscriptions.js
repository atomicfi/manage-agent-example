import { atomic } from '../../atomic/index.js'

export const getUserSubscriptions = {
  name: 'get_user_subscriptions',

  description: `Show the user's accounts: the companies they have connected through Atomic, with the bills and plans Atomic last read on each. Use it when the user isn't sure what they pay for, or to check a plan's status after a cancellation.
- The data is a snapshot from lastSyncedAt, not live.
- connectionStatus 'connected': Atomic can read this account. 'initial': the user started connecting but never finished, so Atomic has no bills there. 'disconnected': the user's sign-in expired or was revoked, and they must sign in again through Atomic before anything else works there.
- An empty list means the user hasn't connected any accounts. It tells you nothing about what they subscribe to or whether a plan is active, so say that you can't see their subscriptions yet.
- processing true: Atomic is working on this account. Wait before starting anything new there.
- A plan with a pendingChange changes on pendingChange.startDate, for example a cancellation that takes effect at the end of the billing period.`,

  schema: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "Optional. Limit the result to one company, using the company's _id from find_company."
      }
    },
    additionalProperties: false
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ companyId }, ctx) {
    const { accounts } = await atomic.getAccounts(ctx.userIdentifier, { companyId })
    // Atomic's structure and field names, keeping only what the agent needs.
    // Left out: the user's personal details (data), payment history, line items,
    // expenses, suggestions, and actions.
    return {
      accounts: accounts.map(({ _id, company, connectionStatus, processing, lastSyncedAt, bills }) => ({
        _id,
        company,
        connectionStatus,
        processing,
        lastSyncedAt,
        bills: (bills ?? []).map(({ _id, name, amount, billingCycle, dueDate, plans }) => ({
          _id,
          name,
          amount,
          billingCycle,
          dueDate,
          plans
        }))
      }))
    }
  }
}
