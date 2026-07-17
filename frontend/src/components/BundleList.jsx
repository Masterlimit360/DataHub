import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock, ShoppingCart, ChevronRight, Wifi } from 'lucide-react'
import { useBundles } from '../hooks/useBundles'

// Skeleton loader for bundle card
function BundleSkeleton() {
  return (
    <div className="skeleton" style={{ height: 160, borderRadius: '18px' }} />
  )
}

export default function BundleList({ networkId, networkSlug, networkColor, networkColorBg, networkColorBorder, networkName }) {
  const { data, isLoading, isError } = useBundles(networkId || networkSlug)
  const [filter, setFilter] = useState('all') // 'all' | 'daily' | 'weekly' | 'monthly'
  const navigate = useNavigate()

  // Mock bundles for demo while backend isn't connected
  const mockBundles = [
    { id: '1', label: '1GB', size_mb: 1024,  validity_days: 1,  price_ghs: 2.50,  is_active: true },
    { id: '2', label: '2GB', size_mb: 2048,  validity_days: 3,  price_ghs: 5.00,  is_active: true },
    { id: '3', label: '5GB', size_mb: 5120,  validity_days: 7,  price_ghs: 10.00, is_active: true },
    { id: '4', label: '10GB',size_mb: 10240, validity_days: 30, price_ghs: 18.00, is_active: true },
    { id: '5', label: '20GB',size_mb: 20480, validity_days: 30, price_ghs: 30.00, is_active: true },
    { id: '6', label: '50GB',size_mb: 51200, validity_days: 30, price_ghs: 60.00, is_active: true },
  ]

  const bundles = data?.bundles || mockBundles

  const filteredBundles = bundles.filter(b => {
    if (!b.is_active) return false
    if (filter === 'daily')   return b.validity_days <= 1
    if (filter === 'weekly')  return b.validity_days >= 2 && b.validity_days <= 7
    if (filter === 'monthly') return b.validity_days > 7
    return true
  })

  const handleBuy = (bundle) => {
    navigate('/checkout', {
      state: {
        type: 'data',
        bundle,
        networkSlug,
        networkName,
        networkColor,
      }
    })
  }

  return (
    <div>
      {/* Validity filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'daily', 'weekly', 'monthly'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px',
              borderRadius: '100px',
              border: `1px solid ${filter === f ? networkColor || 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f ? `${networkColor || 'var(--color-primary)'}22` : 'transparent',
              color: filter === f ? (networkColor || 'var(--color-primary-light)') : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bundle grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <BundleSkeleton key={i} />)
          : isError
          ? <ErrorState />
          : filteredBundles.length === 0
          ? <EmptyState filter={filter} />
          : filteredBundles.map((bundle, i) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                networkColor={networkColor}
                networkColorBg={networkColorBg}
                networkColorBorder={networkColorBorder}
                delay={i * 0.05}
                onBuy={() => handleBuy(bundle)}
              />
            ))
        }
      </div>
    </div>
  )
}

function BundleCard({ bundle, networkColor, networkColorBg, networkColorBorder, delay, onBuy }) {
  const isPopular = bundle.label === '5GB' || bundle.label === '10GB'
  const validityLabel =
    bundle.validity_days === 1 ? '1 Day' :
    bundle.validity_days === 7 ? '1 Week' :
    `${bundle.validity_days} Days`

  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: networkColorBg || 'rgba(255,255,255,0.04)',
        border: `1px solid ${networkColorBorder || 'rgba(255,255,255,0.08)'}`,
        borderRadius: '18px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        animationDelay: `${delay}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 16px 40px ${networkColorBg || 'rgba(124,58,237,0.15)'}`
        e.currentTarget.style.borderColor = networkColor || 'var(--color-primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = networkColorBorder || 'rgba(255,255,255,0.08)'
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#1a0a00', fontSize: '10px', fontWeight: 800,
          padding: '3px 10px', borderRadius: '100px',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Popular
        </div>
      )}

      {/* Size badge */}
      <div style={{
        width: 56, height: 56,
        background: `linear-gradient(135deg, ${networkColor || '#7c3aed'}, ${networkColor ? networkColor + 'aa' : '#5b21b6'})`,
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
        fontSize: '18px', fontWeight: 900,
        color: networkColor === '#ffcc00' ? '#1a1200' : 'white',
      }}>
        <Wifi size={24} color={networkColor === '#ffcc00' ? '#1a1200' : 'white'} />
      </div>

      <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {bundle.label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Clock size={13} />
          {validityLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <Zap size={13} />
          Instant
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '24px', fontWeight: 800, color: networkColor || 'var(--color-primary-light)', letterSpacing: '-0.02em' }}>
            GH₵{bundle.price_ghs.toFixed(2)}
          </span>
        </div>

        <button
          id={`buy-bundle-${bundle.id}`}
          onClick={onBuy}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px',
            background: `linear-gradient(135deg, ${networkColor || '#7c3aed'}, ${networkColor ? networkColor + 'cc' : '#5b21b6'})`,
            border: 'none', borderRadius: '10px',
            color: networkColor === '#ffcc00' ? '#1a1200' : 'white',
            fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
            boxShadow: `0 4px 15px ${networkColor || '#7c3aed'}44`,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 8px 25px ${networkColor || '#7c3aed'}66` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 15px ${networkColor || '#7c3aed'}44` }}
        >
          <ShoppingCart size={13} />
          Buy
        </button>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div style={{
      gridColumn: '1 / -1', textAlign: 'center', padding: '48px',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
      <p>Could not load bundles. Please try again.</p>
    </div>
  )
}

function EmptyState({ filter }) {
  return (
    <div style={{
      gridColumn: '1 / -1', textAlign: 'center', padding: '48px',
      color: 'var(--text-secondary)',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
      <p>No {filter !== 'all' ? filter : ''} bundles available right now.</p>
    </div>
  )
}
