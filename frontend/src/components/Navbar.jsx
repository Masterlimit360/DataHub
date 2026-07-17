import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Wifi, Menu, X, Search, LayoutDashboard, LogOut } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = !!localStorage.getItem('jb_admin_token')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('jb_admin_token')
    navigate('/admin/login')
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled
          ? 'rgba(10, 9, 20, 0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <div className="page-container">
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
            }}>
              <Wifi size={20} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <span style={{
                fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #a78bfa, #f59e0b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>JB DataHub</span>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '-2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Ghana's Data Store
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="desktop-nav">
            <NavLink to="/"      label="Home"       current={location.pathname} />
            <NavLink to="/track" label="Track Order" current={location.pathname} />
            {isAdmin && (
              <>
                <NavLink to="/admin" label="Dashboard" current={location.pathname} />
                <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: '13px' }}>
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
            {!isAdmin && (
              <Link to="/admin/login" className="btn-ghost" style={{ padding: '8px 14px', fontSize: '13px', textDecoration: 'none' }}>
                <LayoutDashboard size={14} /> Admin
              </Link>
            )}
            <Link to="/track" className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              <Search size={14} /> Track Order
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', padding: '8px',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(10,9,20,0.97)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px 24px',
          backdropFilter: 'blur(20px)',
        }} className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <MobileNavLink to="/" label="Home" />
            <MobileNavLink to="/track" label="Track Order" />
            {isAdmin && <MobileNavLink to="/admin" label="Dashboard" />}
            {isAdmin && (
              <button className="btn-ghost" onClick={handleLogout} style={{ width: '100%', marginTop: '8px' }}>
                <LogOut size={15} /> Logout
              </button>
            )}
            {!isAdmin && <MobileNavLink to="/admin/login" label="Admin Login" />}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  )
}

function NavLink({ to, label, current }) {
  const active = current === to || (to !== '/' && current.startsWith(to))
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500,
        color: active ? 'white' : 'var(--text-secondary)',
        background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { if (!active) e.target.style.color = 'white' }}
      onMouseLeave={e => { if (!active) e.target.style.color = 'var(--text-secondary)' }}
    >
      {label}
    </Link>
  )
}

function MobileNavLink({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none', padding: '14px 16px',
        borderRadius: '10px', fontSize: '15px', fontWeight: 500,
        color: 'var(--text-primary)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'block',
      }}
    >
      {label}
    </Link>
  )
}
