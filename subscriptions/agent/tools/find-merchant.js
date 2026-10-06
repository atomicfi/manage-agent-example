import { atomic } from '../../atomic/index.js'
import { toMerchant } from './shared.js'

export const findMerchant = {
  name: 'find_merchant',

  description: `Look up a merchant by name to see whether Atomic can cancel subscriptions there. Call this whenever the user names a merchant, before you say whether Atomic can help with it.
- Search with the name the user used, for example 'Netflix' or 'Spotify'. Typos and partial names work.
- Search by merchant name only. If the user names a category such as 'streaming' or 'gym', ask which merchant they mean.
- Results are candidates. Continue only with a result whose name plainly matches what the user said. If two results could match, ask which one. If none matches, tell the user you couldn't find that merchant, and don't draw conclusions about other merchants.
- canCancel false: Atomic can't cancel subscriptions at this merchant.
- canCancel true: call get_actions_for_company next. It tells you whether this user can cancel there right now, or has to sign in to the merchant first.
- status describes the whole merchant. 'disabled' means it can't be used. For 'under-maintenance', still call get_actions_for_company.`,

  schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "The merchant's name. 50 characters at most."
      }
    },
    required: ["query"],
    additionalProperties: false
  },

  outputSchema: {
    type: "object",
    properties: {
      merchants: {
        type: "array",
        maxItems: 50,
        items: {
          type: "object",
          properties: {
            companyId: {
              type: "string"
            },
            name: {
              type: "string"
            },
            status: {
              enum: ["operational", "under-maintenance", "disabled"]
            },
            canCancel: {
              type: "boolean"
            }
          },
          required: ["companyId", "name", "status", "canCancel"]
        }
      }
    },
    required: ["merchants"]
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ query }, ctx) {
    const { data } = await atomic.searchCompanies(query)
    return { merchants: data.map(toMerchant) }
  }
}
