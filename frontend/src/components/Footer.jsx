import { Link } from 'react-router-dom'
import { Wifi, MessageCircle, Shield, Clock, ChevronRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.3)',
      marginTop: 'auto',
    }}>
      <div className="page-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          padding: '60px 0 40px',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                borderRadius: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wifi size={18} color="white" />
              </div>
              <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
                JB DataHub
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, maxWidth: '240px' }}>
              Ghana's trusted data & airtime store. Instant delivery, secure payments.
            </p>
            <a
              href="https://wa.me/233000000000"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                marginTop: '16px', padding: '10px 16px',
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.25)',
                borderRadius: '10px', color: '#4ade80',
                textDecoration: 'none', fontSize: '13px', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <MessageCircle size={15} /> WhatsApp Support
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Buy Data', to: '/' },
                { label: 'Buy Airtime', to: '/' },
                { label: 'Track Order', to: '/track' },
                { label: 'Admin Login', to: '/admin/login' },
              ].map(link => (
                <Link key={link.label} to={link.to} style={{
                  color: 'var(--text-secondary)', textDecoration: 'none',
                  fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={13} /> {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Networks */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Networks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['MTN Ghana', 'Telecel Ghana', 'AirtelTigo'].map(n => (
                <Link key={n} to="/" style={{
                  color: 'var(--text-secondary)', textDecoration: 'none',
                  fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <ChevronRight size={13} /> {n}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Why JB DataHub?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: Clock, text: '0–5 min delivery' },
                { icon: Shield, text: '100% secure payments' },
                { icon: MessageCircle, text: '24/7 support via WhatsApp' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <Icon size={15} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            © {new Date().getFullYear()} JB DataHub. All rights reserved.
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Powered by <span style={{ color: 'var(--color-primary-light)' }}>Paystack</span> · <span style={{ color: 'var(--color-primary-light)' }}>Arkesel</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
