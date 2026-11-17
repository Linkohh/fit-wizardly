import { useSyncExternalStore } from 'react';
import { getHydrationSnapshot, subscribeToHydration } from '@/lib/storage/hydration';

/**
 * True once every persisted store has loaded from device storage
 * (or the safety timeout has passed). Contract #2 in docs/project/CONTRACTS.md.
 */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribeToHydration, getHydrationSnapshot, getHydrationSnapshot);
}
