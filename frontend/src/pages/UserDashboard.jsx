import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import OrderTracker from '../components/OrderTracker'

export default function UserDashboard() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const userInfo = JSON.parse(localStorage.getItem('aj_user_info') || '{}')
  const token = localStorage.getItem('aj_user_token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [token])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/api`
        : '/api'

      const res = await fetch(`${API_BASE}/user/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout()
        }
        throw new Error('Failed to load orders')
      }
      const data = await res.json()
      setOrders(data.orders || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('aj_user_token')
    localStorage.removeItem('aj_user_info')
    navigate('/')
  }

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '40px' }}>
      <div className="page-container" style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>
              Hi, @{userInfo.username}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome to your dashboard</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px', padding: '8px 14px' }}>
            <LogOut size={14} /> Log out
          </button>
        </div>

        {/* Orders Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Your Orders</h2>
          <button onClick={fetchOrders} className="btn-ghost" style={{ fontSize: '13px', padding: '6px 12px' }} disabled={loading}>
            <RefreshCcw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '60px 24px', textAlign: 'center'
          }}>
            <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You haven't made any purchases yet.</p>
            <button onClick={() => navigate('/')} className="btn-primary">Buy Data or Airtime</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map(order => (
              <OrderTracker key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
