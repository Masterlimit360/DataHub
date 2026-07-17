import { useQuery } from '@tanstack/react-query'
import { getNetworks } from '../api/orders'

export function useNetworks() {
  return useQuery({
    queryKey: ['networks'],
    queryFn: getNetworks,
    staleTime: 5 * 60_000, // 5 minutes
  })
}
