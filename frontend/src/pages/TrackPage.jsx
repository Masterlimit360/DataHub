import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Phone, ArrowRight, RefreshCcw } from 'lucide-react'
import OrderTracker from '../components/OrderTracker'
import { useOrderStatus } from '../hooks/useOrderStatus'

// Mock order for demo purposes
const MOCK_ORDER = {
  id: 'mock-001',
  payment_reference: 'AJ-DEMO12345',
  order_type: 'data',
  network_name: 'MTN Ghana',
  amount_ghs: 10.00,
  phone_number: '0244123456',
  status: 'delivered',
}

export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputPhone, setInputPhone] = useState(searchParams.get('phone') || '')
  const [queryPhone, setQueryPhone] = useState(searchParams.get('phone') || '')
  const [submitted, setSubmitted] = useState(!!searchParams.get('phone'))

  const { data, isLoading, isError, refetch } = useOrderStatus(queryPhone, submitted && !!queryPhone)

  // Auto-search if phone is in URL query params
  useEffect(() => {
    const phone = searchParams.get('phone')
    if (phone) {
      setInputPhone(phone)
      setQueryPhone(phone)
      setSubmitted(true)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!inputPhone) return
    setQueryPhone(inputPhone)
    setSubmitted(true)
    setSearchParams({ phone: inputPhone })
  }

  const orders = data?.orders || []
  const hasResults = submitted && !isLoading && orders.length > 0

  // Demo mode: show mock order if no real data
  const showDemo = submitted && !isLoading && !isError && orders.length === 0

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '60px' }}>
      <div className="page-container" style={{ maxWidth: '680px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(245,158,11,0.1))',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Search size={28} color="#a78bfa" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>
            Track Your Order
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Enter the phone number you used at checkout to see your order status
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex', gap: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '8px 8px 8px 16px',
            alignItems: 'center',
          }}>
            <Phone size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              id="track-phone-input"
              type="tel"
              className="input-field"
              placeholder="Enter phone number (e.g. 0244123456)"
              value={inputPhone}
              onChange={e => setInputPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={{
                border: 'none', background: 'transparent',
                padding: '8px 0', fontSize: '16px', flex: 1,
                boxShadow: 'none',
              }}
            />
            <button
              id="track-search-btn"
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 24px', borderRadius: '10px', fontSize: '14px', flexShrink: 0 }}
              disabled={isLoading || inputPhone.length < 10}
            >
              {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Search size={15} /> Track</>}
            </button>
          </div>
        </form>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Looking up your orders...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '16px', padding: '24px', textAlign: 'center',
          }}>
            <p style={{ color: '#fca5a5', marginBottom: '16px' }}>
              Could not connect to server. Please try again.
            </p>
            <button className="btn-ghost" onClick={() => refetch()} style={{ fontSize: '13px' }}>
              <RefreshCcw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                {orders.length} Order{orders.length > 1 ? 's' : ''} Found
              </h2>
              <button className="btn-ghost" onClick={() => refetch()} style={{ fontSize: '13px', padding: '8px 14px' }}>
                <RefreshCcw size={13} /> Refresh
              </button>
            </div>
            {orders.map(order => (
              <OrderTracker key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Demo/empty state */}
        {showDemo && (
          <div className="animate-fade-in">
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '14px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '24px', fontSize: '13px', color: '#fcd34d',
            }}>
              ℹ️ No orders found for that number. Showing a demo order below.
            </div>
            <OrderTracker order={MOCK_ORDER} />
          </div>
        )}

        {/* Not searched yet */}
        {!submitted && (
          <div className="animate-fade-in" style={{
            textAlign: 'center', padding: '48px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📦</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Enter your phone number above to track your order status. <br />
              No account needed — your phone is your receipt.
            </p>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="btn-primary">
                Buy Data or Airtime <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
