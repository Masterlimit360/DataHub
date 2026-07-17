import { useQuery } from '@tanstack/react-query'
import { getBundles } from '../api/orders'

export function useBundles(networkId) {
  return useQuery({
    queryKey: ['bundles', networkId],
    queryFn: () => getBundles(networkId),
    enabled: !!networkId,
    staleTime: 5 * 60_000,
  })
}
