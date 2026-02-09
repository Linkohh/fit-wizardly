
import React from 'react';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
                {/* Simple CSS-only spinner to avoid heavy imports */}
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground text-sm animate-pulse font-medium">Loading...</p>
            </div>
        </div>
    );
};
