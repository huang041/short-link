import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.register({ name, email, password })
      navigate('/login')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Create account</h2>
      <p style={{ textAlign: 'center', color: '#8b8fa3', fontSize: 14, marginBottom: 24 }}>
        Get started for free
      </p>
      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Create account</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#8b8fa3' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
