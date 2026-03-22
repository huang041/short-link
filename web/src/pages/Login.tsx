import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const { token } = await api.login({ email, password })
      localStorage.setItem('token', token)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Welcome back</h2>
      <p style={{ textAlign: 'center', color: '#8b8fa3', fontSize: 14, marginBottom: 24 }}>
        Sign in to your account
      </p>
      {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Sign in</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#8b8fa3' }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
