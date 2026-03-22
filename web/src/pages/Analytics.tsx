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

type LongUrlStats = {
  longUrl: string
  totalClicks: number
  shortUrls: { shortCode: string; campaign: string | null }[]
  byCampaign: Record<string, number>
  byDevice: Record<string, number>
  byCountry: Record<string, number>
  byBrowser: Record<string, number>
  byReferrer: Record<string, number>
  byDate: Record<string, number>
}

type Mode = 'shortCode' | 'longUrl'

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
  const [mode, setMode] = useState<Mode>('shortCode')
  const [query, setQuery] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [longUrlStats, setLongUrlStats] = useState<LongUrlStats | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStats(null)
    setLongUrlStats(null)
    try {
      if (mode === 'shortCode') {
        const data = await api.getStats(query)
        setStats(data)
      } else {
        const data = await api.getStatsByLongUrl(query)
        setLongUrlStats(data)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const tabStyle = (m: Mode): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    color: mode === m ? '#6366f1' : '#64748b',
    background: mode === m ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
    transition: 'all 0.2s',
  })

  const currentStats = mode === 'shortCode' ? stats : longUrlStats

  return (
    <div>
      <h2>Analytics</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button style={tabStyle('shortCode')} onClick={() => { setMode('shortCode'); setStats(null); setLongUrlStats(null); setQuery('') }}>
          By Short Code
        </button>
        <button style={tabStyle('longUrl')} onClick={() => { setMode('longUrl'); setStats(null); setLongUrlStats(null); setQuery('') }}>
          By Long URL
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          placeholder={mode === 'shortCode' ? 'Enter short code' : 'Enter destination URL'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
      {currentStats && (
        <div>
          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{
              flex: 1,
              minWidth: 140,
              padding: 16,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              borderRadius: 10,
              color: '#fff',
            }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Total Clicks</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{currentStats.totalClicks}</div>
            </div>
            {mode === 'shortCode' && stats?.campaign && (
              <div style={{
                flex: 1,
                minWidth: 140,
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

          {mode === 'longUrl' && longUrlStats && (
            <>
              {longUrlStats.shortUrls.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4>SHORT URLS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {longUrlStats.shortUrls.map((u) => (
                      <div key={u.shortCode} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#f8f9fc',
                        borderRadius: 6,
                        fontSize: 13,
                      }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.shortCode}</span>
                        {u.campaign && (
                          <span style={{
                            fontSize: 12,
                            color: '#8b8fa3',
                            background: 'rgba(99, 102, 241, 0.08)',
                            padding: '1px 8px',
                            borderRadius: 4,
                          }}>{u.campaign}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <StatCard title="CAMPAIGN" data={longUrlStats.byCampaign} />
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <StatCard title="DEVICE" data={currentStats.byDevice} />
            <StatCard title="COUNTRY" data={currentStats.byCountry} />
            <StatCard title="BROWSER" data={currentStats.byBrowser} />
            <StatCard title="REFERRER" data={currentStats.byReferrer} />
          </div>
          <StatCard title="DATE" data={currentStats.byDate} />
        </div>
      )}
    </div>
  )
}
