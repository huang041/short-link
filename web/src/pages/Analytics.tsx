import { useState } from 'react'
import { api } from '../api/client'

type Stats = {
  totalClicks: number
  campaign: string | null
  byDevice: Record<string, number>
  byCountry: Record<string, number>
  byBrowser: Record<string, number>
  byReferrer: Record<string, number>
  byDate: Record<string, number>
}

function StatCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  return (
    <div style={{ marginBottom: 20 }}>
      <h4>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(([key, count]) => {
          const pct = Math.round((count / total) * 100)
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                <span>{key}</span>
                <span style={{ color: '#8b8fa3' }}>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                  borderRadius: 3,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [shortCode, setShortCode] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStats(null)
    try {
      const data = await api.getStats(shortCode)
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h2>Analytics</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Enter short code"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
      {stats && (
        <div>
          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
          }}>
            <div style={{
              flex: 1,
              padding: 16,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              borderRadius: 10,
              color: '#fff',
            }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Total Clicks</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalClicks}</div>
            </div>
            {stats.campaign && (
              <div style={{
                flex: 1,
                padding: 16,
                background: '#f8f9fc',
                borderRadius: 10,
                border: '1px solid #e2e4e9',
              }}>
                <div style={{ fontSize: 13, color: '#8b8fa3' }}>Campaign</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{stats.campaign}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <StatCard title="DEVICE" data={stats.byDevice} />
            <StatCard title="COUNTRY" data={stats.byCountry} />
            <StatCard title="BROWSER" data={stats.byBrowser} />
            <StatCard title="REFERRER" data={stats.byReferrer} />
          </div>
          <StatCard title="DATE" data={stats.byDate} />
        </div>
      )}
    </div>
  )
}
