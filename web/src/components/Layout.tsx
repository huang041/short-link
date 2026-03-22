import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const navStyle = (path: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    color: location.pathname === path ? '#6366f1' : '#64748b',
    background: location.pathname === path ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
    transition: 'all 0.2s',
  })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 32,
        padding: '8px 8px',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <Link to="/" style={navStyle('/')}>Create</Link>
        <Link to="/analytics" style={navStyle('/analytics')}>Analytics</Link>
        <Link to="/referrals" style={navStyle('/referrals')}>Referrals</Link>
        <div style={{ marginLeft: 'auto' }}>
          {token ? (
            <button onClick={logout} style={{
              background: 'transparent',
              color: '#64748b',
              fontSize: 13,
              padding: '6px 12px',
            }}>
              Logout
            </button>
          ) : (
            <Link to="/login" style={navStyle('/login')}>Login</Link>
          )}
        </div>
      </nav>
      <main style={{
        background: '#fff',
        borderRadius: 12,
        padding: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
