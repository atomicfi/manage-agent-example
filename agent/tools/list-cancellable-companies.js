import { atomic } from "../../atomic/index.js";

export const listCancellableCompanies = {
  name: "list_cancellable_companies",

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler() {
    // Few merchants support cancel-plan (<100 in production), so one page of 100
    // holds them all.
    return atomic.listCompanies({ actions: "cancel-plan", limit: 100 });
  },
};
