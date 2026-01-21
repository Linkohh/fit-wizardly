/**
 * Circle Context
 *
 * Provides circle data and utilities to all child components within CircleLayout.
 * This enables URL-based routing while sharing circle state across tabs.
 */

import { createContext, useContext } from 'react';
import type { CircleWithMembers } from '@/types/supabase';

export interface CircleContextValue {
    circle: CircleWithMembers;
    isAdmin: boolean;
    isMember: boolean;
    refetch: () => Promise<void>;
}

export const CircleContext = createContext<CircleContextValue | null>(null);

export function useCircle() {
    const context = useContext(CircleContext);
    if (!context) {
        throw new Error('useCircle must be used within a CircleLayout');
    }
    return context;
}

export function useCircleOptional() {
    return useContext(CircleContext);
}
