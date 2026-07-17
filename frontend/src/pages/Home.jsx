import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Shield, Clock, TrendingUp, ChevronRight, Star, ArrowRight } from 'lucide-react'
import NetworkSelector from '../components/NetworkSelector'
import QuickAirtimeForm from '../components/QuickAirtimeForm'

const STATS = [
  { value: '10,000+', label: 'Orders Completed', icon: TrendingUp, color: '#a78bfa' },
  { value: '99.9%',   label: 'Uptime',           icon: Shield,     color: '#34d399' },
  { value: '0–5min',  label: 'Delivery Time',    icon: Clock,      color: '#fcd34d' },
  { value: '24/7',    label: 'Support Available', icon: Star,       color: '#fb923c' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('data') // 'data' | 'airtime'

  return (
    <div>
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section style={{
        padding: '80px 0 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background blobs */}
        <div style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            {/* Pill badge */}
            <div className="animate-fade-in-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: '100px', padding: '8px 18px',
              marginBottom: '28px',
            }}>
              <Zap size={14} color="#a78bfa" fill="#a78bfa" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#c4b5fd' }}>
                Instant Data & Airtime — No Account Needed
              </span>
            </div>

            <h1
              className="animate-fade-in-up"
              style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', animationDelay: '0.05s' }}
            >
              Ghana's{' '}
              <span className="gradient-text">Fastest Data</span>
              <br />& Airtime Store
            </h1>

            <p className="animate-fade-in-up" style={{
              fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7,
              marginBottom: '36px', animationDelay: '0.1s',
            }}>
              MTN, Telecel & AirtelTigo data bundles and airtime — delivered to your phone in 0–5 minutes. Pay with Mobile Money.
            </p>

            <div className="animate-fade-in-up" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.15s' }}>
              <a href="#buy-section" className="btn-primary" style={{ fontSize: '16px', padding: '16px 32px' }}>
                <Zap size={17} fill="white" />
                Buy Data Now
              </a>
              <Link to="/track" className="btn-ghost" style={{ fontSize: '16px', padding: '16px 32px' }}>
                Track My Order <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="page-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            {STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="glass-card animate-fade-in-up" style={{ padding: '20px', animationDelay: `${i * 0.08}s`, textAlign: 'center' }}>
                  <Icon size={22} color={stat.color} style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '24px', fontWeight: 900, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '4px' }}>{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Main Buy Section ──────────────────────────────────── */}
      <section id="buy-section" style={{ padding: '20px 0 80px' }}>
        <div className="page-container">
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
              Choose What You Need
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Select a network to buy data bundles, or top up airtime instantly
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <div className="tab-switcher" style={{ width: 'fit-content' }}>
              <button
                id="tab-data"
                className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => setActiveTab('data')}
              >
                📶 Buy Data
              </button>
              <button
                id="tab-airtime"
                className={`tab-btn ${activeTab === 'airtime' ? 'active' : ''}`}
                onClick={() => setActiveTab('airtime')}
              >
                📱 Buy Airtime
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'data' ? (
            <div className="animate-fade-in">
              <NetworkSelector />
            </div>
          ) : (
            <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
                  Quick Airtime Top-Up
                </h3>
                <QuickAirtimeForm />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px' }}>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)' }}>3 simple steps — done in under a minute</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', title: 'Choose Your Bundle',  desc: 'Pick a network and select a data plan or enter an airtime amount.',  icon: '📶' },
              { step: '02', title: 'Enter Phone & Pay',   desc: 'Type the recipient number and pay securely with Mobile Money.',        icon: '💳' },
              { step: '03', title: 'Instant Delivery',    desc: 'Your data or airtime lands in 0–5 minutes. Get an SMS confirmation.', icon: '⚡' },
            ].map((item, i) => (
              <div key={item.step} className="glass-card animate-fade-in-up" style={{ padding: '28px', animationDelay: `${i * 0.1}s`, position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.08)',
                  fontFamily: 'monospace', letterSpacing: '0.05em',
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ─────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="page-container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(245,158,11,0.06))',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '28px', padding: '48px 40px',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent)',
            }} />

            <Shield size={40} color="#a78bfa" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
              Safe & Secure Payments
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '500px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              All payments are processed by <strong style={{ color: 'white' }}>Paystack</strong> — Ghana's most trusted payment gateway. We support MTN Mobile Money, Telecel Cash, and AirtelTigo Money.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money', 'Card'].map(m => (
                <span key={m} style={{
                  padding: '8px 16px', borderRadius: '100px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500,
                }}>
                  ✓ {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="page-container">
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 50%, #1e1b4b 100%)',
            borderRadius: '28px', padding: '56px 40px',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(245,158,11,0.15), transparent 50%)',
            }} />
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', position: 'relative' }}>
              Ready to stay connected?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '32px', position: 'relative' }}>
              Thousands of Ghanaians trust JB DataHub for their daily data needs.
            </p>
            <a href="#buy-section" className="btn-gold" style={{ fontSize: '16px', padding: '16px 36px', position: 'relative' }}>
              Get Started <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
