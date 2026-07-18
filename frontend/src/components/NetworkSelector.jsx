import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wifi } from 'lucide-react'

import mtnLogo from '../assets/mtn.webp'
import telecelLogo from '../assets/telecel.webp'
import airteltigoLogo from '../assets/airteltigo.webp'

// Network config — logos, colors, slugs
const NETWORKS = [
  {
    id: 'mtn',
    name: 'MTN Ghana',
    slug: 'mtn',
    tagline: 'Everywhere You Go',
    color: '#ffcc00',
    colorDark: '#b38f00',
    colorBg: 'rgba(255,204,0,0.08)',
    colorBorder: 'rgba(255,204,0,0.2)',
    colorGlow: 'rgba(255,204,0,0.15)',
    emoji: '🟡',
    initial: 'M',
    logo: mtnLogo,
  },
  {
    id: 'telecel',
    name: 'Telecel Ghana',
    slug: 'telecel',
    tagline: 'Together We Can',
    color: '#e8001d',
    colorDark: '#a80015',
    colorBg: 'rgba(232,0,29,0.08)',
    colorBorder: 'rgba(232,0,29,0.2)',
    colorGlow: 'rgba(232,0,29,0.12)',
    emoji: '🔴',
    initial: 'T',
    logo: telecelLogo,
  },
  {
    id: 'airteltigo',
    name: 'AirtelTigo',
    slug: 'airteltigo',
    tagline: 'Limitless Possibilities',
    color: '#0099cc',
    colorDark: '#006e94',
    colorBg: 'rgba(0,153,204,0.08)',
    colorBorder: 'rgba(0,153,204,0.2)',
    colorGlow: 'rgba(0,153,204,0.12)',
    emoji: '🔵',
    initial: 'A',
    logo: airteltigoLogo,
  },
]

export { NETWORKS }

export default function NetworkSelector({ onSelectNetwork }) {
  const navigate = useNavigate()

  const handleSelect = (network) => {
    if (onSelectNetwork) {
      onSelectNetwork(network)
    } else {
      navigate(`/bundles/${network.slug}`)
    }
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {NETWORKS.map((network, i) => (
          <NetworkCard
            key={network.id}
            network={network}
            onSelect={handleSelect}
            delay={i * 0.1}
          />
        ))}
      </div>
    </div>
  )
}

function NetworkCard({ network, onSelect, delay }) {
  return (
    <button
      id={`network-card-${network.slug}`}
      onClick={() => onSelect(network)}
      style={{
        background: network.colorBg,
        border: `1px solid ${network.colorBorder}`,
        borderRadius: '24px',
        padding: '32px 28px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${delay}s`,
        width: '100%',
        fontFamily: 'inherit',
      }}
      className="animate-fade-in-up"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
        e.currentTarget.style.boxShadow = `0 24px 60px ${network.colorGlow}, 0 0 0 1px ${network.colorBorder}`
        e.currentTarget.style.borderColor = network.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = network.colorBorder
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(0.99)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)' }}
    >
      {/* Background shimmer decoration */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 80% 20%, ${network.colorGlow}, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      {/* Network logo circle */}
      <div style={{
        width: 72, height: 72,
        background: `linear-gradient(135deg, ${network.color}, ${network.colorDark})`,
        borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: `0 8px 24px ${network.colorGlow}`,
        fontSize: '28px',
        fontWeight: 900,
        color: network.id === 'mtn' ? '#1a1200' : 'white',
        letterSpacing: '-0.03em',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {network.logo ? (
          <img 
            src={network.logo} 
            alt={network.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
            }} 
          />
        ) : (
          network.initial
        )}
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          width: 22, height: 22,
          background: 'var(--bg-primary)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${network.colorBorder}`,
          zIndex: 10,
        }}>
          <Wifi size={11} color={network.color} />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          {network.name}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {network.tagline}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: '13px', fontWeight: 600,
            color: network.color,
            background: `${network.colorBg}`,
            padding: '6px 12px',
            borderRadius: '8px',
            border: `1px solid ${network.colorBorder}`,
          }}>
            View Plans
          </span>
          <div style={{
            width: 36, height: 36,
            background: `linear-gradient(135deg, ${network.color}22, ${network.color}11)`,
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${network.colorBorder}`,
          }}>
            <ArrowRight size={16} color={network.color} />
          </div>
        </div>
      </div>
    </button>
  )
}
