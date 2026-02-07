import { useState, useEffect } from 'react';
import { generateUuid } from '@/lib/uuid';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * Cache with expiration for API responses
 */
class SimpleCache<T> {
    private cache: Map<string, { data: T; expires: number }> = new Map();

    set(key: string, data: T, ttlMs: number = 5 * 60 * 1000) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttlMs,
        });
    }

    get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return undefined;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }
}

export const apiCache = new SimpleCache<unknown>();

/**
 * Wrapper for localStorage with fallback
 */
export const localStorageWithFallback = {
    getItem(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    setItem(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('localStorage unavailable:', error);
        }
    },

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // Silently fail
        }
    },
};

/**
 * Queue for offline operations
 */
interface QueuedOperation {
    id: string;
    operation: 'save' | 'delete';
    data: unknown;
    timestamp: number;
}

class OfflineQueue {
    private readonly STORAGE_KEY = 'fitwizard_offline_queue';

    getQueue(): QueuedOperation[] {
        const data = localStorageWithFallback.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    add(operation: Omit<QueuedOperation, 'id' | 'timestamp'>) {
        const queue = this.getQueue();
        queue.push({
            ...operation,
            id: `op_${generateUuid()}`,
            timestamp: Date.now(),
        });
        localStorageWithFallback.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }

    remove(id: string) {
        const queue = this.getQueue().filter(op => op.id !== id);
        localStorageWithFallback.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }

    clear() {
        localStorageWithFallback.removeItem(this.STORAGE_KEY);
    }
}

export const offlineQueue = new OfflineQueue();
