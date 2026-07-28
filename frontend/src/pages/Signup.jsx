import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/api`
        : '/api'

      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || err.error || 'Signup failed')
      }

      const { token, user } = await res.json()
      localStorage.setItem('aj_user_token', token)
      localStorage.setItem('aj_user_info', JSON.stringify(user))
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '80px 24px 40px',
      background: `
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.15), transparent),
        var(--bg-primary)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 30px rgba(124,58,237,0.4)',
          }}>
            <UserPlus size={28} color="white" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            Create an Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign up with a username to track your orders</p>
        </div>

        <div className="glass-card" style={{ padding: '36px' }}>
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="input-label" htmlFor="signup-username">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={17} />
                </span>
                <input
                  id="signup-username"
                  type="text"
                  className="input-field"
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="signup-password">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={17} />
                </span>
                <input
                  id="signup-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !username || !password}
              style={{ width: '100%', fontSize: '16px', padding: '16px', marginTop: '4px' }}
            >
              {loading
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
                : 'Sign Up'
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary-light)', textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
