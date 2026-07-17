import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Zap, ChevronRight } from 'lucide-react'
import { NETWORKS } from './NetworkSelector'

const QUICK_AMOUNTS = [1, 2, 5, 10, 20, 50]

export default function QuickAirtimeForm() {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0])
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || !phone) return
    navigate('/checkout', {
      state: {
        type: 'airtime',
        amount: parseFloat(amount),
        phone,
        networkSlug: selectedNetwork.slug,
        networkName: selectedNetwork.name,
        networkColor: selectedNetwork.color,
      }
    })
  }

  const formatPhone = (val) => {
    // strip non-digits
    const digits = val.replace(/\D/g, '').slice(0, 10)
    return digits
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Network Tabs */}
      <div>
        <label className="input-label">Network</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {NETWORKS.map(network => (
            <button
              key={network.id}
              type="button"
              id={`airtime-network-${network.slug}`}
              onClick={() => setSelectedNetwork(network)}
              style={{
                padding: '14px 10px',
                border: `2px solid ${selectedNetwork.id === network.id ? network.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                background: selectedNetwork.id === network.id ? network.colorBg : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: `linear-gradient(135deg, ${network.color}, ${network.colorDark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 900,
                color: network.id === 'mtn' ? '#1a1200' : 'white',
                boxShadow: selectedNetwork.id === network.id ? `0 4px 15px ${network.colorGlow}` : 'none',
              }}>
                {network.initial}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700,
                color: selectedNetwork.id === network.id ? network.color : 'var(--text-muted)',
                letterSpacing: '0.02em',
              }}>
                {network.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Amount Chips */}
      <div>
        <label className="input-label">Quick Amount (GH₵)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              style={{
                padding: '8px 16px',
                borderRadius: '100px',
                border: `1px solid ${amount === String(a) ? selectedNetwork.color : 'rgba(255,255,255,0.1)'}`,
                background: amount === String(a) ? `${selectedNetwork.color}22` : 'transparent',
                color: amount === String(a) ? selectedNetwork.color : 'var(--text-secondary)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              GH₵{a}
            </button>
          ))}
        </div>
        {/* Custom amount input */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600,
          }}>GH₵</span>
          <input
            id="airtime-amount"
            type="number"
            className="input-field"
            placeholder="Or enter amount (0.50 – 500)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0.50"
            max="500"
            step="0.50"
            style={{ paddingLeft: '52px' }}
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="input-label" htmlFor="airtime-phone">Recipient Phone Number</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: '14px',
          }}>
            <Phone size={16} />
          </span>
          <input
            id="airtime-phone"
            type="tel"
            className="input-field"
            placeholder="0XX XXX XXXX"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            style={{ paddingLeft: '48px' }}
          />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Ghana number (e.g. 0244123456)
        </p>
      </div>

      {/* Submit */}
      <button
        id="airtime-submit"
        type="submit"
        className="btn-gold"
        disabled={!amount || !phone || phone.length < 10}
        style={{ width: '100%', fontSize: '16px', padding: '16px' }}
      >
        <Zap size={17} />
        Top Up GH₵{amount || '0.00'} Airtime
        <ChevronRight size={17} />
      </button>

      {/* Trust note */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        ⚡ Delivered in 0–5 minutes · 🔒 Secured by Paystack
      </p>
    </form>
  )
}
