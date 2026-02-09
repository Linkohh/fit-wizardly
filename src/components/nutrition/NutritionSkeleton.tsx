import { Skeleton } from '@/components/ui/skeleton';

export function NutritionSkeleton() {
    return (
        <div className="container-full py-8 space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                </div>
                <Skeleton className="h-12 w-48 rounded-xl" />
            </div>

            {/* Dashboard Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-12 w-full max-w-md rounded-xl" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary Rings */}
                        <div className="p-6 rounded-3xl border border-muted bg-muted/10 h-[200px]">
                            <div className="flex justify-between mb-8">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <Skeleton className="h-24 w-24 rounded-full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-[300px] rounded-3xl" />
                            <Skeleton className="h-[300px] rounded-3xl" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Skeleton className="h-40 rounded-3xl" />
                        <Skeleton className="h-96 rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
