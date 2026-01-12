import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Custom hook to monitor network status and show toast notifications
 * when the user goes offline or comes back online.
 *
 * Automatically handles:
 * - Offline detection with persistent toast
 * - Online recovery with success toast
 * - Toast cleanup on unmount
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useNetworkStatus();
 *   return <YourApp />;
 * }
 * ```
 */
export function useNetworkStatus() {
  const { toast } = useToast();

  useEffect(() => {
    // Track if we're currently showing the offline toast
    let offlineToastId: string | undefined;

    const handleOffline = () => {
      // Show persistent offline toast
      const { id } = toast({
        title: "You're offline",
        description: 'Some features may not work until you reconnect',
        variant: 'destructive',
        duration: Infinity, // Don't auto-dismiss
      });
      offlineToastId = id;
    };

    const handleOnline = () => {
      // Dismiss offline toast if it exists
      if (offlineToastId) {
        toast({
          title: "You're back online!",
          description: 'All features are now available',
          duration: 3000,
        });
      }
    };

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    // Listen for online/offline events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);
}
