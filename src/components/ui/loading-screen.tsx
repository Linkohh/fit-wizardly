
import React from 'react';
import { StateCard } from '@/components/ui/state-card';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
            <StateCard
                variant="loading"
                title="Loading"
                description="Preparing your FitWizard experience..."
                className="w-[min(92vw,28rem)]"
            />
        </div>
    );
};
