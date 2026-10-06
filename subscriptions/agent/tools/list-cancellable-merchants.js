import { atomic } from "../../atomic/index.js";
import { toMerchant } from "./shared.js";

export const listCancellableMerchants = {
  name: "list_cancellable_merchants",

  description: `List the merchants where Atomic supports cancellation, sorted by name. Use this when the user asks what you can cancel. For a merchant the user named, use find_merchant.
- A merchant on this list supports cancellation in general. Call get_actions_for_company to see whether this user can cancel there right now.
- status 'under-maintenance': cancellation there is temporarily unavailable. 'disabled': it can't be used.`,

  schema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  outputSchema: {
    type: "object",
    properties: {
      merchants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            companyId: {
              type: "string",
            },
            name: {
              type: "string",
            },
            status: {
              enum: ["operational", "under-maintenance", "disabled"],
            },
            canCancel: {
              type: "boolean",
            },
          },
          required: ["companyId", "name", "status", "canCancel"],
        },
      },
    },
    required: ["merchants"],
  },

  // ctx ({ userIdentifier, conversationId }) comes from the server, never the model.
  async handler() {
    // Few merchants support cancel-plan (<100 in production), so one page of 100
    // holds them all.
    const { data } = await atomic.listCompanies({
      actions: "cancel-plan",
      limit: 100,
    });
    return {
      merchants: data
        .map(toMerchant)
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
};
