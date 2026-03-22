import { useState } from 'react'
import { api } from '../api/client'

export default function CreateUrl() {
  const [longUrl, setLongUrl] = useState('')
  const [campaign, setCampaign] = useState('')
  const [result, setResult] = useState<{ shortCode: string } | null>(null)
  const [error, setError] = useState('')

  const baseUrl = window.location.origin

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    try {
      const url = await api.createUrl({ longUrl, campaign: campaign || undefined })
      setResult(url)
      setLongUrl('')
      setCampaign('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h2>Create Short URL</h2>
      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>
            Destination URL
          </label>
          <input placeholder="https://example.com/your-long-url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 4, display: 'block' }}>
            Campaign (optional)
          </label>
          <input placeholder="e.g. summer_sale" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </div>
        <button type="submit">Shorten URL</button>
      </form>
      {result && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: '#f0f0ff',
          borderRadius: 8,
          border: '1px solid #e0e0ff',
        }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Your short URL</p>
          <a
            href={`${baseUrl}/${result.shortCode}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 18, fontWeight: 600 }}
          >
            {baseUrl}/{result.shortCode}
          </a>
        </div>
      )}
    </div>
  )
}
