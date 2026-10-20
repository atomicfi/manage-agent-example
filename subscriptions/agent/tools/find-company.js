import { atomic } from '../../atomic/index.js'

export const findCompany = {
  name: 'find_company',

  description: `
Look up a merchant by name to see whether Atomic can cancel subscriptions there. Call this whenever
the user names a merchant, before you say whether Atomic can help with it.
- Search with the name the user used, for example 'Netflix' or 'Spotify'. Typos and partial names
  work.
- Search by merchant name only. If the user names a category such as 'streaming' or 'gym', ask which
  merchant they mean.
- Results are candidates. Continue only with a result whose name plainly matches what the user said.
  If two results could match, ask which one. If none matches, tell the user you couldn't find that
  merchant, and don't draw conclusions about other merchants.
- Returns Atomic's company search response; the companies are in data.
- availableActions without 'cancel-plan': Atomic can't cancel subscriptions at this company.
- managedBy lists the companies that can manage this company's subscriptions. If it includes any
  provider other than the company itself, ask the user where they pay for it before going further,
  as the system prompt describes.
- availableActions with 'cancel-plan': once you know the user pays the company directly, call
  get_actions_for_company next with the company's _id. It tells you whether this user can cancel
  there right now, or has to sign in first.
- status describes the whole company. 'disabled' means it can't be used. For 'under-maintenance',
  check underMaintenanceProductsAndActions, as the system prompt describes: if 'cancel-plan' or
  'connect-account' isn't under maintenance, still call get_actions_for_company.`,

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

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ query }, ctx) {
    return atomic.searchCompanies(query)
  }
}
