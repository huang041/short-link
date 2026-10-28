import { useEffect, useState } from 'react'
import { api, type UrlItem } from '../api/client'

const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  flexShrink: 0,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#64748b',
  cursor: 'pointer',
  ...extra,
})

const input: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 13,
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  width: '100%',
  boxSizing: 'border-box',
}

// datetime-local 需要 "YYYY-MM-DDTHH:mm" 的本地時間
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function UrlList() {
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    api.listUrls()
      .then(setUrls)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ longUrl: '', campaign: '', expiresAt: '' })
  const [busy, setBusy] = useState(false)

  const replace = (u: UrlItem) => setUrls((list) => list.map((x) => (x.id === u.id ? u : x)))

  const startEdit = (url: UrlItem) => {
    setEditing(url.id)
    setForm({
      longUrl: url.longUrl,
      campaign: url.campaign ?? '',
      expiresAt: toLocalInput(url.expiresAt),
    })
  }

  const saveEdit = async (url: UrlItem) => {
    setBusy(true)
    try {
      const updated = await api.updateUrl(url.shortCode, {
        longUrl: form.longUrl,
        campaign: form.campaign.trim() || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      replace(updated)
      setEditing(null)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (url: UrlItem) => {
    try {
      replace(await api.updateUrl(url.shortCode, { isActive: !url.isActive }))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const remove = async (url: UrlItem) => {
    if (!confirm(`Delete /${url.shortCode}? Its click history will be deleted too.`)) return
    try {
      await api.deleteUrl(url.shortCode)
      setUrls((list) => list.filter((x) => x.id !== url.id))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const shortBase = window.location.origin

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) return <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
  if (error) return <p style={{ color: '#ef4444' }}>{error}</p>

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
        Short URLs
        <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>
          ({urls.length})
        </span>
      </h2>

      {urls.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>No URLs yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {urls.map((url) => {
            const shortUrl = `${shortBase}/${url.shortCode}`
            const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date()
            return (
              <div key={url.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                overflow: 'hidden',
                opacity: isExpired || !url.isActive ? 0.5 : 1,
              }}>
                {/* OG Preview */}
                {(url.ogTitle || url.ogImage) && (
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}>
                    {url.ogImage && (
                      <img
                        src={url.ogImage}
                        alt=""
                        style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      {url.ogTitle && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {url.ogTitle}
                        </p>
                      )}
                      {url.ogDescription && (
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {url.ogDescription}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* URL Info */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#6366f1', fontWeight: 600, fontSize: 15 }}
                      >
                        /{url.shortCode}
                      </a>
                      {url.campaign && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(99,102,241,0.08)',
                          color: '#6366f1',
                        }}>
                          {url.campaign}
                        </span>
                      )}
                      {!url.isActive && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#f1f5f9',
                          color: '#64748b',
                        }}>
                          disabled
                        </span>
                      )}
                      {isExpired && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#fef2f2',
                          color: '#ef4444',
                        }}>
                          expired
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 13,
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                    }}>
                      {url.longUrl}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                      {new Date(url.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => copy(shortUrl, url.id)}
                      style={btn(copied === url.id ? { background: '#f0fdf4', color: '#16a34a' } : {})}
                    >
                      {copied === url.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => startEdit(url)} style={btn()}>Edit</button>
                    <button onClick={() => toggleActive(url)} style={btn()}>
                      {url.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => remove(url)} style={btn({ color: '#ef4444' })}>Delete</button>
                  </div>
                </div>

                {editing === url.id && (
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <input
                      style={input}
                      type="url"
                      placeholder="Long URL"
                      value={form.longUrl}
                      onChange={(e) => setForm({ ...form, longUrl: e.target.value })}
                    />
                    <input
                      style={input}
                      placeholder="Campaign (optional)"
                      value={form.campaign}
                      onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                    />
                    <input
                      style={input}
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditing(null)} style={btn()}>Cancel</button>
                      <button
                        onClick={() => saveEdit(url)}
                        disabled={busy || !form.longUrl}
                        style={btn({ background: '#6366f1', color: '#fff', border: '1px solid #6366f1' })}
                      >
                        {busy ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
