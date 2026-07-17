import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp,
  RefreshCcw, RotateCcw, Filter, Search, ChevronDown,
  CheckCircle2, XCircle, Clock, Loader2, Edit2, ToggleLeft, ToggleRight,
  Plus, Wifi, BarChart2, DollarSign, Users,
} from 'lucide-react'
import { getAdminOrders, getAdminStats, retryOrder, refundOrder, getAdminBundles, updateBundle, toggleBundle } from '../../api/admin'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// Mock stats for demo
const MOCK_STATS = {
  total_orders: 1284,
  delivered_orders: 1201,
  total_revenue: 18430.50,
  today_revenue: 842.00,
  weekly_chart: [
    { day: 'Mon', revenue: 1200 },
    { day: 'Tue', revenue: 1800 },
    { day: 'Wed', revenue: 980 },
    { day: 'Thu', revenue: 2400 },
    { day: 'Fri', revenue: 2100 },
    { day: 'Sat', revenue: 3200 },
    { day: 'Sun', revenue: 750 },
  ],
}

const MOCK_ORDERS = [
  { id: '1', phone_number: '0244123456', network_id: 'mtn',        order_type: 'data',    amount_ghs: 10.00, status: 'delivered',  created_at: new Date(Date.now() - 300000).toISOString(), payment_reference: 'JB-001ABC' },
  { id: '2', phone_number: '0554987321', network_id: 'telecel',    order_type: 'airtime', amount_ghs: 5.00,  status: 'processing', created_at: new Date(Date.now() - 600000).toISOString(), payment_reference: 'JB-002DEF' },
  { id: '3', phone_number: '0271654897', network_id: 'airteltigo', order_type: 'data',    amount_ghs: 18.00, status: 'failed',     created_at: new Date(Date.now() - 900000).toISOString(), payment_reference: 'JB-003GHI' },
  { id: '4', phone_number: '0202458963', network_id: 'mtn',        order_type: 'data',    amount_ghs: 30.00, status: 'paid',      created_at: new Date(Date.now() - 1200000).toISOString(), payment_reference: 'JB-004JKL' },
  { id: '5', phone_number: '0244000111', network_id: 'telecel',    order_type: 'airtime', amount_ghs: 2.50,  status: 'delivered', created_at: new Date(Date.now() - 1500000).toISOString(), payment_reference: 'JB-005MNO' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'orders' | 'bundles'
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const queryClient = useQueryClient()

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminStats(),
    placeholderData: { stats: MOCK_STATS },
    retry: false,
  })

  // Orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, searchQuery],
    queryFn: () => getAdminOrders({ status: statusFilter !== 'all' ? statusFilter : undefined, search: searchQuery || undefined }),
    placeholderData: { orders: MOCK_ORDERS },
    retry: false,
  })

  // Bundles
  const { data: bundlesData } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: getAdminBundles,
    retry: false,
  })

  // Mutations
  const retryMut = useMutation({
    mutationFn: retryOrder,
    onSuccess: () => { toast.success('Order queued for retry'); queryClient.invalidateQueries(['admin-orders']) },
    onError: () => toast.error('Retry failed'),
  })
  const refundMut = useMutation({
    mutationFn: refundOrder,
    onSuccess: () => { toast.success('Refund initiated'); queryClient.invalidateQueries(['admin-orders']) },
    onError: () => toast.error('Refund failed'),
  })

  const stats = statsData?.stats || MOCK_STATS
  const orders = ordersData?.orders || MOCK_ORDERS

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (searchQuery && !o.phone_number.includes(searchQuery) && !o.payment_reference?.includes(searchQuery)) return false
    return true
  })

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
        padding: '28px 0',
        marginBottom: '32px',
      }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Admin Dashboard</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>JB DataHub · Manage orders, bundles & revenue</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" style={{ fontSize: '13px', padding: '9px 16px' }}
                onClick={() => { queryClient.invalidateQueries(); toast.success('Refreshed') }}>
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '24px' }}>
            {[
              { key: 'overview', label: 'Overview',  icon: LayoutDashboard },
              { key: 'orders',   label: 'Orders',    icon: ShoppingBag },
              { key: 'bundles',  label: 'Bundles',   icon: Package },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={`admin-tab-${key}`}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 18px', borderRadius: '10px', border: 'none',
                  background: activeTab === key ? 'rgba(124,58,237,0.2)' : 'transparent',
                  color: activeTab === key ? '#c4b5fd' : 'var(--text-muted)',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  borderBottom: activeTab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container">

        {/* ── OVERVIEW TAB ──────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Total Orders',     value: stats.total_orders?.toLocaleString(),  icon: ShoppingBag,   color: '#a78bfa', bg: 'rgba(124,58,237,0.1)'  },
                { label: 'Delivered',        value: stats.delivered_orders?.toLocaleString(), icon: CheckCircle2, color: '#34d399', bg: 'rgba(16,185,129,0.1)'  },
                { label: "Today's Revenue",  value: `GH₵${stats.today_revenue?.toFixed(2)}`, icon: DollarSign,  color: '#fcd34d', bg: 'rgba(245,158,11,0.1)'  },
                { label: 'Total Revenue',    value: `GH₵${stats.total_revenue?.toFixed(2)}`, icon: TrendingUp,  color: '#fb923c', bg: 'rgba(249,115,22,0.1)'  },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} style={{
                    background: s.bg,
                    border: `1px solid ${s.color}22`,
                    borderRadius: '18px', padding: '22px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={s.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>
                      {s.value}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Revenue chart */}
            <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart2 size={20} color="#a78bfa" /> Weekly Revenue
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.weekly_chart}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₵${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1a1730', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f0ff', fontSize: '13px' }}
                    formatter={(v) => [`GH₵${v}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#7c3aed', strokeWidth: 0, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent orders */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Orders</h2>
                <button className="btn-ghost" onClick={() => setActiveTab('orders')} style={{ fontSize: '13px', padding: '7px 14px' }}>
                  View All
                </button>
              </div>
              <OrdersTable
                orders={MOCK_ORDERS.slice(0, 5)}
                onRetry={id => retryMut.mutate(id)}
                onRefund={id => refundMut.mutate(id)}
                compact
              />
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="orders-search"
                  className="input-field"
                  placeholder="Search phone or reference..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px', padding: '10px 14px 10px 40px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'pending', 'paid', 'processing', 'delivered', 'failed', 'refunded'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '8px 14px', borderRadius: '100px', border: `1px solid ${statusFilter === s ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                    background: statusFilter === s ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: statusFilter === s ? '#c4b5fd' : 'var(--text-muted)',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              {ordersLoading
                ? <div style={{ textAlign: 'center', padding: '48px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                : <OrdersTable
                    orders={filteredOrders}
                    onRetry={id => retryMut.mutate(id)}
                    onRefund={id => refundMut.mutate(id)}
                  />
              }
            </div>
          </div>
        )}

        {/* ── BUNDLES TAB ───────────────────────────────────── */}
        {activeTab === 'bundles' && (
          <div className="animate-fade-in">
            <BundlesManager bundles={bundlesData?.bundles} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Orders Table Component ─────────────────────────────────────── */
function OrdersTable({ orders, onRetry, onRefund, compact }) {
  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <Package size={32} style={{ margin: '0 auto 12px' }} />
        No orders found
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            {['Reference', 'Phone', 'Network', 'Type', 'Amount', 'Status', 'Time', ''].map(h => (
              <th key={h} style={{
                padding: '10px 12px', textAlign: 'left',
                fontSize: '11px', color: 'var(--text-muted)',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{ transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '14px 12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {order.payment_reference?.slice(0, 12) || '—'}
              </td>
              <td style={{ padding: '14px 12px', fontWeight: 600 }}>{order.phone_number}</td>
              <td style={{ padding: '14px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{order.network_id}</td>
              <td style={{ padding: '14px 12px' }}>
                <span style={{ fontSize: '12px' }}>{order.order_type === 'data' ? '📶' : '📱'} {order.order_type}</span>
              </td>
              <td style={{ padding: '14px 12px', fontWeight: 700 }}>GH₵{parseFloat(order.amount_ghs).toFixed(2)}</td>
              <td style={{ padding: '14px 12px' }}><StatusBadge status={order.status} /></td>
              <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                {timeAgo(order.created_at)}
              </td>
              {!compact && (
                <td style={{ padding: '14px 12px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {order.status === 'failed' && (
                      <button
                        onClick={() => onRetry(order.id)}
                        style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RotateCcw size={11} /> Retry
                      </button>
                    )}
                    {['paid', 'delivered', 'failed'].includes(order.status) && (
                      <button
                        onClick={() => onRefund(order.id)}
                        style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCcw size={11} /> Refund
                      </button>
                    )}
                  </div>
                </td>
              )}
              {compact && <td />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Bundles Manager ────────────────────────────────────────────── */
function BundlesManager({ bundles }) {
  const MOCK_BUNDLES = [
    { id: '1', network_id: 'mtn',        label: '1GB',  validity_days: 1,  price_ghs: 2.50,  cost_price_ghs: 1.80, is_active: true },
    { id: '2', network_id: 'mtn',        label: '5GB',  validity_days: 7,  price_ghs: 10.00, cost_price_ghs: 7.50, is_active: true },
    { id: '3', network_id: 'telecel',    label: '2GB',  validity_days: 3,  price_ghs: 5.00,  cost_price_ghs: 3.80, is_active: true },
    { id: '4', network_id: 'airteltigo', label: '10GB', validity_days: 30, price_ghs: 18.00, cost_price_ghs: 14.00, is_active: false },
  ]

  const data = bundles || MOCK_BUNDLES

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Bundle Management</h2>
        <button className="btn-primary" style={{ fontSize: '13px', padding: '10px 18px' }}>
          <Plus size={15} /> Add Bundle
        </button>
      </div>

      <div style={{ overflowX: 'auto' }} className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr>
              {['Network', 'Bundle', 'Validity', 'Cost Price', 'Sale Price', 'Margin', 'Active', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '14px 16px', textAlign: 'left',
                  fontSize: '11px', color: 'var(--text-muted)',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(bundle => {
              const margin = ((bundle.price_ghs - bundle.cost_price_ghs) / bundle.cost_price_ghs * 100).toFixed(0)
              return (
                <tr key={bundle.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px', textTransform: 'capitalize', fontWeight: 600 }}>{bundle.network_id}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '16px' }}>{bundle.label}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{bundle.validity_days}d</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>GH₵{bundle.cost_price_ghs}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>GH₵{bundle.price_ghs}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700,
                      background: 'rgba(16,185,129,0.12)', color: '#34d399',
                    }}>
                      +{margin}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: bundle.is_active ? '#34d399' : 'var(--text-muted)' }}>
                      {bundle.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'var(--text-secondary)',
                      fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:    'badge-pending',
    paid:       'badge-paid',
    processing: 'badge-processing',
    delivered:  'badge-delivered',
    failed:     'badge-failed',
    refunded:   'badge-refunded',
  }
  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
