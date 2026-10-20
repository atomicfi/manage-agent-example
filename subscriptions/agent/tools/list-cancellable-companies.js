import { atomic } from "../../atomic/index.js";

export const listCancellableCompanies = {
  name: "list_cancellable_companies",

  description: `
List the companies where Atomic supports cancellation. Use this when the user asks what you can
cancel. For a merchant the user named, use find_company.
- Returns Atomic's company list response; the companies are in data.
- A company on this list supports cancellation in general. Call get_actions_for_company to see
  whether this user can cancel there right now.
- status 'under-maintenance': underMaintenanceProductsAndActions says what's temporarily unavailable
  there, as the system prompt describes. 'disabled': it can't be used.`,

  schema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler() {
    // Few merchants support cancel-plan (<100 in production), so one page of 100
    // holds them all.
    return atomic.listCompanies({ actions: "cancel-plan", limit: 100 });
  },
};
