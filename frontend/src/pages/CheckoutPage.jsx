import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Phone, Shield, Zap, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Build API URL properly — uses the backend host in prod, relative /api in dev
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

// Format phone to E.164 Ghana format
function toGhanaE164(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233')) return '+' + digits
  if (digits.startsWith('0'))   return '+233' + digits.slice(1)
  return '+233' + digits
}

function isValidGhanaPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 && digits.startsWith('0')
}

export default function CheckoutPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [phone, setPhone] = useState(state?.phone || '')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'processing'

  // Guard: if landed here without state, redirect home
  if (!state) {
    return (
      <div className="page-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ marginBottom: '12px' }}>No Order Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Please choose a bundle first.</p>
        <Link to="/" className="btn-primary">Go to Home</Link>
      </div>
    )
  }

  const { type, bundle, amount, networkSlug, networkName, networkColor } = state
  const displayAmount = type === 'data' ? bundle?.price_ghs : amount
  const displayLabel  = type === 'data' ? bundle?.label : `GH₵${parseFloat(amount).toFixed(2)} Airtime`

  const handlePay = async () => {
    if (!isValidGhanaPhone(phone)) {
      toast.error('Please enter a valid Ghana phone number (e.g. 0244123456)')
      return
    }

    setLoading(true)
    setStep('processing')

    try {
      // 1. Create order in backend
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: toGhanaE164(phone),
          network_id: networkSlug,
          bundle_id: type === 'data' ? bundle?.id : null,
          order_type: type,
          amount_ghs: displayAmount,
        }),
      })

      if (!orderRes.ok) throw new Error('Failed to create order')
      const { order } = await orderRes.json()

      // 2. Initialize Paystack payment
      const payRes = await fetch(`${API_BASE}/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          email: `${phone.replace(/\D/g,'')}@jbdatahub.com`, // Paystack requires email
          amount: Math.round(displayAmount * 100), // kobo
          phone_number: toGhanaE164(phone),
          reference: order.payment_reference,
        }),
      })

      if (!payRes.ok) throw new Error('Failed to initialize payment')
      const { authorization_url } = await payRes.json()

      // 3. Redirect to Paystack checkout
      window.location.href = authorization_url

    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
      setStep('form')
    }
  }


  // --- Inline Paystack handler (for when we have the popup SDK) ---
  const handlePaystackInline = () => {
    if (!isValidGhanaPhone(phone)) {
      toast.error('Please enter a valid Ghana phone number (e.g. 0244123456)')
      return
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      toast.error('Payment configuration missing. Please contact support.')
      return
    }

    // Use Paystack inline
    const handler = window.PaystackPop?.setup({
      key: publicKey,
      email: `${phone.replace(/\D/g, '')}@jbdatahub.com`,
      amount: Math.round(displayAmount * 100),
      currency: 'GHS',
      ref: `JB-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Phone', variable_name: 'phone', value: toGhanaE164(phone) },
          { display_name: 'Network', variable_name: 'network', value: networkSlug },
          { display_name: 'Bundle', variable_name: 'bundle', value: displayLabel },
        ]
      },
      callback: (response) => {
        navigate(`/track?ref=${response.reference}&phone=${encodeURIComponent(phone)}`)
      },
      onClose: () => {
        toast('Payment cancelled', { icon: '⚠️' })
      },
    })
    handler?.openIframe()
  }

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '40px' }}>
      <div className="page-container" style={{ maxWidth: '560px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          style={{ padding: '8px 14px', fontSize: '13px', marginBottom: '28px' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Confirm Order</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Review your purchase and complete payment
        </p>

        {/* Order summary card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${networkColor || 'rgba(255,255,255,0.08)'}44`,
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
            Order Summary
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SummaryRow label="Type"    value={type === 'data' ? '📶 Data Bundle' : '📱 Airtime'} />
            <SummaryRow label="Network" value={networkName} valueColor={networkColor} />
            {type === 'data' && (
              <>
                <SummaryRow label="Bundle"   value={bundle?.label} />
                <SummaryRow label="Validity" value={bundle?.validity_days === 1 ? '1 Day' : bundle?.validity_days === 7 ? '1 Week' : `${bundle?.validity_days} Days`} />
              </>
            )}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '24px', color: networkColor || 'var(--color-primary-light)' }}>
                GH₵{parseFloat(displayAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Phone number input */}
        <div style={{ marginBottom: '24px' }}>
          <label className="input-label" htmlFor="checkout-phone">
            Recipient Phone Number
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}>
              <Phone size={17} />
            </span>
            <input
              id="checkout-phone"
              type="tel"
              className="input-field"
              placeholder="0244 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={{ paddingLeft: '48px', fontSize: '18px', letterSpacing: '0.05em' }}
            />
            {phone.length === 10 && isValidGhanaPhone(phone) && (
              <CheckCircle2
                size={18} color="#10b981"
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}
              />
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Data/airtime will be sent to this number · Ghana format (0XXXXXXXXX)
          </p>
        </div>

        {/* Pay button */}
        <button
          id="pay-now-btn"
          onClick={handlePay}
          disabled={loading || !isValidGhanaPhone(phone)}
          className="btn-primary"
          style={{ width: '100%', fontSize: '17px', padding: '18px', borderRadius: '14px', marginBottom: '16px' }}
        >
          {loading ? (
            <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
          ) : (
            <><Shield size={17} /> Pay GH₵{parseFloat(displayAmount).toFixed(2)} with Paystack</>
          )}
        </button>

        {/* Trust badges */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap',
          fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px',
        }}>
          <span>🔒 SSL Secured</span>
          <span>⚡ 0–5 min delivery</span>
          <span>✅ 100% Money-Back Guarantee</span>
        </div>

        {/* Payment methods */}
        <div style={{
          padding: '16px', borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Accepted payment methods</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money', 'Card'].map(m => (
              <span key={m} style={{
                padding: '5px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
