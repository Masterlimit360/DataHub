import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'
import { NETWORKS } from '../components/NetworkSelector'
import BundleList from '../components/BundleList'
import QuickAirtimeForm from '../components/QuickAirtimeForm'
import { useState } from 'react'

export default function BundlesPage() {
  const { network: slug } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('data')

  const network = NETWORKS.find(n => n.slug === slug)

  if (!network) {
    return (
      <div className="page-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ marginBottom: '12px' }}>Network Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The network "{slug}" doesn't exist.
        </p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Network Hero */}
      <div style={{
        background: `linear-gradient(180deg, ${network.colorBg} 0%, transparent 100%)`,
        borderBottom: `1px solid ${network.colorBorder}`,
        padding: '40px 0 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: '300px', height: '300px',
          background: `radial-gradient(circle, ${network.colorGlow}, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div className="page-container">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="btn-ghost"
            style={{ padding: '8px 14px', fontSize: '13px', marginBottom: '24px' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Network logo */}
            <div style={{
              width: 80, height: 80, borderRadius: '22px',
              background: `linear-gradient(135deg, ${network.color}, ${network.colorDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', fontWeight: 900,
              color: network.id === 'mtn' ? '#1a1200' : 'white',
              boxShadow: `0 12px 40px ${network.colorGlow}`,
              flexShrink: 0,
            }}>
              {network.initial}
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: network.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                {network.tagline}
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: '4px' }}>
                {network.name}
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Choose a data bundle or top up airtime
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: '36px' }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', marginBottom: '32px' }}>
          <div className="tab-switcher">
            <button
              id="bundles-tab-data"
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              📶 Data Bundles
            </button>
            <button
              id="bundles-tab-airtime"
              className={`tab-btn ${activeTab === 'airtime' ? 'active' : ''}`}
              onClick={() => setActiveTab('airtime')}
            >
              📱 Quick Airtime
            </button>
          </div>
        </div>

        {activeTab === 'data' ? (
          <div className="animate-fade-in">
            <BundleList
              networkId={network.id}
              networkSlug={network.slug}
              networkColor={network.color}
              networkColorBg={network.colorBg}
              networkColorBorder={network.colorBorder}
              networkName={network.name}
            />
          </div>
        ) : (
          <div className="animate-fade-in" style={{ maxWidth: '480px' }}>
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
                Quick Airtime Top-Up
              </h3>
              <QuickAirtimeForm defaultNetwork={network} />
            </div>
          </div>
        )}

        {/* Delivery note */}
        <div style={{
          marginTop: '40px',
          padding: '16px 20px',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '12px',
          maxWidth: '480px',
        }}>
          <Zap size={18} color="#a78bfa" fill="#a78bfa" />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Instant delivery</strong> — your data arrives in 0–5 minutes after payment. Need help? <a href="https://wa.me/233000000000" target="_blank" rel="noreferrer" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>Chat with us</a>
          </div>
        </div>
      </div>
    </div>
  )
}
