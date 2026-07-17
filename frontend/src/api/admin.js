import client from './client'

// Admin login
export const adminLogin = (credentials) =>
  client.post('/admin/login', credentials).then((r) => r.data)

// Orders (admin)
export const getAdminOrders = (params) =>
  client.get('/admin/orders', { params }).then((r) => r.data)

export const retryOrder = (id) =>
  client.post(`/admin/orders/${id}/retry`).then((r) => r.data)

export const refundOrder = (id) =>
  client.post(`/admin/orders/${id}/refund`).then((r) => r.data)

// Bundles (admin)
export const getAdminBundles = () =>
  client.get('/admin/bundles').then((r) => r.data)

export const createBundle = (payload) =>
  client.post('/admin/bundles', payload).then((r) => r.data)

export const updateBundle = (id, payload) =>
  client.put(`/admin/bundles/${id}`, payload).then((r) => r.data)

export const toggleBundle = (id, is_active) =>
  client.patch(`/admin/bundles/${id}`, { is_active }).then((r) => r.data)

// Stats
export const getAdminStats = (period = 'week') =>
  client.get('/admin/stats', { params: { period } }).then((r) => r.data)
