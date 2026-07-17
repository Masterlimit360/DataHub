import client from './client'

export const getNetworks = () =>
  client.get('/networks').then((r) => r.data)

export const getBundles = (networkId) =>
  client.get('/bundles', { params: { network_id: networkId } }).then((r) => r.data)

export const createOrder = (payload) =>
  client.post('/orders', payload).then((r) => r.data)

export const initializePayment = (payload) =>
  client.post('/payments/initialize', payload).then((r) => r.data)

export const trackOrder = (phone) =>
  client.get('/orders/track', { params: { phone } }).then((r) => r.data)

export const getOrderById = (id) =>
  client.get(`/orders/${id}`).then((r) => r.data)
