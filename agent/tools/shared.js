// Helpers shared by the subscription tools.

export const toMerchant = (c) => ({
  companyId: c._id,
  name: c.name,
  status: c.status,
  canCancel: (c.availableActions ?? []).includes('cancel-plan')
})

