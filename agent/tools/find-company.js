import { atomic } from '../../atomic/index.js'

export const findCompany = {
  name: 'find_company',

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler({ query }, ctx) {
    return atomic.searchCompanies(query)
  }
}
