import { atomic } from '../../atomic/index.js'

export const getUserSubscriptions = {
  name: 'get_user_subscriptions',

  description: `Show the merchants this user has connected through Atomic, with the subscriptions and plans Atomic last read there. Use it when the user isn't sure what they pay for, or when get_cancellation_outcome says check_subscription.
- The data is a snapshot from lastSyncedAt, not live.
- connectionStatus 'connected': Atomic can read this merchant. 'initial': the user started connecting but never finished, so Atomic has no subscriptions there. 'disconnected': the user's sign-in expired or was revoked, and they must sign in again through Atomic before anything else works there.
- An empty list means the user hasn't connected any merchants. It tells you nothing about what they subscribe to or whether a plan is active, so say that you can't see their subscriptions yet.
- processing true: Atomic is working on this account. Wait before starting anything new there.
- A plan with a pendingChange changes on pendingChange.startDate, for example a cancellation that takes effect at the end of the billing period.`,

  schema: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "Optional. Limit the result to one merchant, using the companyId from find_merchant."
      }
    },
    additionalProperties: false
  },

  outputSchema: {
    type: "object",
    properties: {
      accounts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            companyId: {
              type: "string"
            },
            merchant: {
              type: "string"
            },
            connectionStatus: {
              enum: ["initial", "connected", "disconnected"]
            },
            lastSyncedAt: {
              type: ["string", "null"],
              format: "date-time"
            },
            processing: {
              type: "boolean",
              description: "True while Atomic is working on this account. Wait before starting anything new here."
            },
            subscriptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string"
                  },
                  amount: {
                    type: ["number", "null"]
                  },
                  plans: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: {
                          type: "string"
                        },
                        status: {
                          enum: ["active", "inactive", "paused", "cancelled"]
                        },
                        pendingChange: {
                          type: ["object", "null"],
                          description: "Present when the merchant has a change scheduled, such as a cancellation that takes effect at the end of the billing period. startDate is when the change takes effect."
                        }
                      },
                      required: ["description", "status"]
                    }
                  }
                },
                required: ["name", "plans"]
              }
            }
          },
          required: ["companyId", "merchant", "connectionStatus", "lastSyncedAt", "processing", "subscriptions"]
        }
      }
    },
    required: ["accounts"]
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ companyId }, ctx) {
    const { accounts } = await atomic.getAccounts(ctx.userIdentifier, { companyId })
    return {
      accounts: accounts.map((a) => ({
        companyId: a.company?._id,
        merchant: a.company?.name,
        connectionStatus: a.connectionStatus,
        lastSyncedAt: a.lastSyncedAt ?? null,
        processing: a.processing,
        subscriptions: (a.bills ?? []).map((b) => ({
          name: b.name,
          amount: b.amount ?? null,
          plans: (b.plans ?? []).map((p) => ({
            description: p.description,
            status: p.status,
            pendingChange: p.pendingChange ?? null
          }))
        }))
      }))
    }
  }
}
