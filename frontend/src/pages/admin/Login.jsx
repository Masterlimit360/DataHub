import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Wifi, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/api`
        : '/api'

      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Invalid credentials')
      }

      const { token } = await res.json()
      localStorage.setItem('jb_admin_token', token)
      toast.success('Welcome back!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: `
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.15), transparent),
        var(--bg-primary)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 30px rgba(124,58,237,0.4)',
          }}>
            <Wifi size={28} color="white" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            JB DataHub Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to manage orders & settings</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label className="input-label" htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                type="text"
                className="input-field"
                placeholder="admin@jbdatahub.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="input-label" htmlFor="admin-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '4px',
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              className="btn-primary"
              disabled={loading || !email || !password}
              style={{ width: '100%', fontSize: '16px', padding: '16px', marginTop: '4px' }}
            >
              {loading
                ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Signing In...</>
                : <><Lock size={16} /> Sign In</>
              }
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Admin access only · <a href="/" style={{ color: 'var(--color-primary-light)', textDecoration: 'none' }}>Back to Store</a>
        </p>
      </div>
    </div>
  )
}
