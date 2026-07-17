import { useQuery } from '@tanstack/react-query'
import { trackOrder } from '../api/orders'

const POLLING_STATUSES = ['pending', 'paid', 'processing']

export function useOrderStatus(phone, enabled = true) {
  return useQuery({
    queryKey: ['order-status', phone],
    queryFn: () => trackOrder(phone),
    enabled: enabled && !!phone,
    // Poll every 5s only while order is in a transient state
    refetchInterval: (query) => {
      const orders = query.state.data?.orders
      if (!orders || orders.length === 0) return false
      const latest = orders[0]
      return POLLING_STATUSES.includes(latest.status) ? 5000 : false
    },
  })
}
