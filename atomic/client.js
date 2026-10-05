// Thin client for the Atomic API. Credentials stay on the server.

export class AtomicApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.name = 'AtomicApiError'
    this.status = status
    this.code = code
  }
}

// Atomic has never seen this user identifier.
export const UNKNOWN_USER = 40011

export function createAtomicClient({
  baseUrl = process.env.ATOMIC_API_BASE_URL,
  apiKey = process.env.ATOMIC_API_KEY,
  apiSecret = process.env.ATOMIC_API_SECRET,
  fetch: fetchImpl = globalThis.fetch
} = {}) {
  if (!baseUrl) throw new Error('ATOMIC_API_BASE_URL is not set')
  baseUrl = baseUrl.replace(/\/+$/, '')

  async function request(method, path, { body, identifier } = {}) {
    const headers = { 'x-api-key': apiKey, 'x-api-secret': apiSecret }
    if (body) headers['content-type'] = 'application/json'
    if (identifier) headers['user-identifier'] = identifier
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new AtomicApiError(json.message || `Atomic API ${res.status}`, {
        status: res.status,
        code: json.code
      })
    }
    return json
  }

  return {
    request,

    // POST /company/search
    searchCompanies(query) {
      return request('POST', '/company/search', { body: { query, scopes: ['pay-link'] } })
    },

    // GET /company/list
    listCompanies({ actions, limit = 100, skip = 0 } = {}) {
      const qs = new URLSearchParams({ scope: 'pay-link', limit, skip })
      if (actions) qs.set('actions', actions)
      return request('GET', `/company/list?${qs}`)
    },

    // GET /pay-link/actions-for-company/:companyId
    getActionsForCompany(companyId, identifier) {
      return request('GET', `/pay-link/actions-for-company/${encodeURIComponent(companyId)}`, {
        identifier
      })
    },

    // GET /pay-link/accounts[?companyId=]
    getAccounts(identifier, { companyId } = {}) {
      const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
      return request('GET', `/pay-link/accounts${qs}`, { identifier })
    },

    // POST /access-token. Also registers the user with Atomic.
    createAccessToken(identifier) {
      return request('POST', '/access-token', { body: { identifier } })
    }
  }
}
