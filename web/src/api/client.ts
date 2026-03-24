const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(data) },
    ),

  // URLs
  listUrls: () =>
    request<{
      id: string
      shortCode: string
      longUrl: string
      campaign: string | null
      createdAt: string
      expiresAt: string | null
      ogTitle: string | null
      ogDescription: string | null
      ogImage: string | null
    }[]>('/urls'),

  createUrl: (data: { longUrl: string; campaign?: string }) =>
    request<{ id: string; shortCode: string; longUrl: string; campaign: string | null }>(
      '/urls/shorten', { method: 'POST', body: JSON.stringify(data) },
    ),

  // Analytics
  getStats: (shortCode: string) =>
    request<{
      totalClicks: number
      campaign: string | null
      byDevice: Record<string, number>
      byCountry: Record<string, number>
      byBrowser: Record<string, number>
      byReferrer: Record<string, number>
      byDate: Record<string, number>
    }>(`/analytics/${shortCode}`),

  getStatsByLongUrl: (longUrl: string) =>
    request<{
      longUrl: string
      totalClicks: number
      shortUrls: { shortCode: string; campaign: string | null }[]
      byCampaign: Record<string, number>
      byDevice: Record<string, number>
      byCountry: Record<string, number>
      byBrowser: Record<string, number>
      byReferrer: Record<string, number>
      byDate: Record<string, number>
    }>(`/analytics/url?longUrl=${encodeURIComponent(longUrl)}`),

  // Referrals
  createReferral: () =>
    request<{ id: string; code: string }>('/referrals', { method: 'POST' }),

  listReferrals: () =>
    request<{ id: string; code: string; createdAt: string }[]>('/referrals'),
}
