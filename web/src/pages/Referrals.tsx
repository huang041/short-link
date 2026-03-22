import { useState, useEffect } from 'react'
import { api } from '../api/client'

type Referral = { id: string; code: string; createdAt: string }

export default function Referrals() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.listReferrals()
      setReferrals(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setError('')
    try {
      await api.createReferral()
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Referral Codes</h2>
        <button onClick={handleCreate}>Create New Code</button>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
      {referrals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#8b8fa3',
          background: '#f8f9fc',
          borderRadius: 10,
        }}>
          <p style={{ fontSize: 15 }}>No referral codes yet. Create one to start tracking.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {referrals.map((r) => (
            <div key={r.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: '#f8f9fc',
              borderRadius: 10,
              border: '1px solid #e2e4e9',
            }}>
              <div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1e293b',
                }}>{r.code}</span>
                <span style={{
                  marginLeft: 12,
                  fontSize: 12,
                  color: '#8b8fa3',
                  background: 'rgba(99, 102, 241, 0.08)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}>?ref={r.code}</span>
              </div>
              <span style={{ fontSize: 13, color: '#8b8fa3' }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
