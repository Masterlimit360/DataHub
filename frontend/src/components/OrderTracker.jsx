import { CheckCircle2, Clock, Loader2, XCircle, RefreshCcw, Package } from 'lucide-react'

const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: Package,       desc: 'We received your order' },
  { key: 'paid',       label: 'Payment Confirmed', icon: CheckCircle2, desc: 'Payment verified by Paystack' },
  { key: 'processing', label: 'Processing',    icon: Loader2,       desc: 'Sending to your number' },
  { key: 'delivered',  label: 'Delivered',     icon: CheckCircle2,  desc: 'Data sent successfully!' },
]

const STATUS_ORDER = ['pending', 'paid', 'processing', 'delivered']

function getStepIndex(status) {
  if (status === 'failed' || status === 'refunded') return -1
  return STATUS_ORDER.indexOf(status)
}

export default function OrderTracker({ order }) {
  if (!order) return null

  const currentIndex = getStepIndex(order.status)
  const isFailed = order.status === 'failed'
  const isRefunded = order.status === 'refunded'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px',
      padding: '28px',
    }}>
      {/* Order info header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            Order Reference
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
            {order.payment_reference || order.id?.slice(0, 12).toUpperCase() || 'JB-XXXXXX'}
          </div>
        </div>
        <div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Order details */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px', marginBottom: '32px',
      }}>
        <DetailItem label="Type"    value={order.order_type === 'data' ? '📶 Data' : '📱 Airtime'} />
        <DetailItem label="Network" value={order.network_name || order.network_id?.toUpperCase()} />
        <DetailItem label="Amount"  value={`GH₵${parseFloat(order.amount_ghs || 0).toFixed(2)}`} />
        <DetailItem label="Phone"   value={maskPhone(order.phone_number)} />
      </div>

      {/* Failed / Refunded state */}
      {(isFailed || isRefunded) ? (
        <div style={{
          background: isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
          border: `1px solid ${isFailed ? 'rgba(239,68,68,0.25)' : 'rgba(156,163,175,0.25)'}`,
          borderRadius: '14px', padding: '20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {isFailed
            ? <XCircle size={28} color="#ef4444" />
            : <RefreshCcw size={28} color="#9ca3af" />
          }
          <div>
            <div style={{ fontWeight: 700, color: isFailed ? '#fca5a5' : '#d1d5db', marginBottom: '4px' }}>
              {isFailed ? 'Order Failed' : 'Refund Processed'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isFailed
                ? 'Something went wrong. Contact support via WhatsApp if payment was deducted.'
                : 'Your refund has been processed. It may take 1–3 business days.'
              }
            </div>
          </div>
        </div>
      ) : (
        /* Stepper */
        <div style={{ position: 'relative' }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute',
            left: '20px', top: '20px', bottom: '20px',
            width: '2px',
            background: 'rgba(255,255,255,0.06)',
            zIndex: 0,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {STEPS.map((step, i) => {
              const isDone    = i < currentIndex
              const isCurrent = i === currentIndex
              const isPending = i > currentIndex

              const Icon = step.icon

              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1 }}>
                  {/* Step indicator */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: isDone
                      ? 'rgba(16,185,129,0.15)'
                      : isCurrent
                      ? 'rgba(124,58,237,0.2)'
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${
                      isDone ? '#10b981' :
                      isCurrent ? 'var(--color-primary)' :
                      'rgba(255,255,255,0.08)'
                    }`,
                    transition: 'all 0.3s ease',
                  }}>
                    <Icon
                      size={18}
                      color={isDone ? '#10b981' : isCurrent ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.2)'}
                      style={{ animation: isCurrent && step.key === 'processing' ? 'spin 1s linear infinite' : 'none' }}
                    />
                  </div>

                  {/* Step text */}
                  <div style={{ paddingTop: '8px' }}>
                    <div style={{
                      fontSize: '15px', fontWeight: isDone || isCurrent ? 700 : 500,
                      color: isDone ? '#6ee7b7' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginBottom: '3px',
                    }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delivery estimate for active orders */}
      {!isFailed && !isRefunded && currentIndex < 3 && (
        <div style={{
          marginTop: '24px', padding: '14px 16px',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', color: 'var(--color-primary-light)',
        }}>
          <Clock size={15} />
          <span>Estimated delivery: <strong>0–5 minutes</strong> after payment confirmation</span>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '14px',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending:    { label: 'Pending',    cls: 'badge-pending' },
    paid:       { label: 'Paid',       cls: 'badge-paid' },
    processing: { label: 'Processing', cls: 'badge-processing' },
    delivered:  { label: 'Delivered',  cls: 'badge-delivered' },
    failed:     { label: 'Failed',     cls: 'badge-failed' },
    refunded:   { label: 'Refunded',   cls: 'badge-refunded' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge-pending' }
  return <span className={`badge ${cls}`}>{label}</span>
}

function maskPhone(phone) {
  if (!phone) return '—'
  const s = String(phone)
  return s.slice(0, 3) + '****' + s.slice(-3)
}
