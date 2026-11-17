import { useState, type ReactNode } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useStoresHydrated } from '@/hooks/useStoresHydrated';

interface HydrationGateProps {
  children: ReactNode;
}

/**
 * Shows the loading screen until saved data has loaded, so pages never flash
 * empty states on start-up. It only gates the first render: once open it stays
 * open, so a store that registers later (from a lazily loaded page) never
 * sends the user back to the loading screen.
 */
export function HydrationGate({ children }: HydrationGateProps) {
  const hydrated = useStoresHydrated();
  const [hasOpened, setHasOpened] = useState(hydrated);

  if (hydrated && !hasOpened) {
    setHasOpened(true);
  }

  if (!hydrated && !hasOpened) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
