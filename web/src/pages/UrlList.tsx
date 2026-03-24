import { useEffect, useState } from 'react'
import { api } from '../api/client'

type UrlItem = {
  id: string
  shortCode: string
  longUrl: string
  campaign: string | null
  createdAt: string
  expiresAt: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
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
                opacity: isExpired ? 0.5 : 1,
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
                  <button
                    onClick={() => copy(shortUrl, url.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      background: copied === url.id ? '#f0fdf4' : '#f8fafc',
                      color: copied === url.id ? '#16a34a' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copied === url.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
