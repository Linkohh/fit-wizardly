import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PlanSkeleton() {
    return (
        <main className="container max-w-5xl mx-auto px-4 py-8 animate-fade-in">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton variant="shimmer" className="h-8 w-56 rounded-lg" />
                <div className="flex gap-2">
                    <Skeleton variant="shimmer" className="h-10 w-32 rounded-xl" />
                    <Skeleton variant="shimmer" className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Summary skeleton */}
            <Card className="mb-6">
                <CardContent className="p-6 flex flex-wrap gap-6">
                    <Skeleton variant="shimmer" className="h-10 w-32 rounded-md" />
                    <Skeleton variant="shimmer" className="h-10 w-40 rounded-md" />
                    <Skeleton variant="shimmer" className="h-10 w-36 rounded-md" />
                </CardContent>
            </Card>

            {/* Workout days skeleton */}
            <div className="space-y-6">
                {[1, 2, 3].map(dayIndex => (
                    <Card key={dayIndex}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <Skeleton variant="shimmer" className="h-6 w-32 rounded-md" />
                                <Skeleton variant="shimmer" className="h-9 w-36 rounded-lg" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3, 4].map(exerciseIndex => (
                                <div key={exerciseIndex} className="flex gap-4 p-3 rounded-lg border border-border/50">
                                    {/* Exercise details skeleton */}
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="shimmer" className="h-5 w-40 rounded-md" />
                                        <Skeleton variant="shimmer" className="h-4 w-32 rounded-md" />
                                    </div>

                                    {/* Badges skeleton */}
                                    <div className="flex gap-2">
                                        <Skeleton variant="shimmer" className="h-6 w-16 rounded-full" />
                                        <Skeleton variant="shimmer" className="h-6 w-16 rounded-full" />
                                        <Skeleton variant="shimmer" className="h-6 w-16 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
}
