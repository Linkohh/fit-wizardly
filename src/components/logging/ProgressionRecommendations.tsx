import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    RefreshCw,
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import type { ProgressionRecommendation, ProgressionAction } from '@/types/fitness';
import { cn } from '@/lib/utils';

interface ProgressionRecommendationsProps {
    onApply?: () => void;
}

export function ProgressionRecommendations({ onApply }: ProgressionRecommendationsProps) {
    const {
        getProgressionRecommendations,
        applyProgressionRecommendations,
        preferredWeightUnit,
    } = usePlanStore();

    const [applied, setApplied] = useState(false);

    const recommendations = getProgressionRecommendations();

    const getActionIcon = (action: ProgressionAction) => {
        switch (action) {
            case 'increase': return TrendingUp;
            case 'decrease': return TrendingDown;
            case 'maintain': return Minus;
            case 'swap': return RefreshCw;
            default: return Minus;
        }
    };

    const getActionColor = (action: ProgressionAction) => {
        switch (action) {
            case 'increase': return 'text-green-600 bg-green-500/10 border-green-500/30';
            case 'decrease': return 'text-red-600 bg-red-500/10 border-red-500/30';
            case 'maintain': return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
            case 'swap': return 'text-purple-600 bg-purple-500/10 border-purple-500/30';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
        switch (confidence) {
            case 'high': return { label: 'High Confidence', className: 'bg-green-500/20 text-green-700' };
            case 'medium': return { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-700' };
            case 'low': return { label: 'Low', className: 'bg-gray-500/20 text-gray-700' };
        }
    };

    const handleApply = () => {
        const increaseRecs = recommendations.filter(r => r.action === 'increase');
        applyProgressionRecommendations(increaseRecs);
        setApplied(true);
        onApply?.();
    };

    // Group recommendations by action
    const grouped: Record<ProgressionAction, ProgressionRecommendation[]> = {
        increase: [],
        maintain: [],
        decrease: [],
        swap: [],
    };

    recommendations.forEach(rec => {
        grouped[rec.action].push(rec);
    });

    if (recommendations.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Recommendations Yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Log a few workouts and I'll analyze your performance to suggest smart progressions.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full gradient-primary">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Smart Progressions</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                AI-powered recommendations based on your performance
                            </p>
                        </div>
                    </div>

                    {!applied && grouped.increase.length > 0 && (
                        <Button
                            onClick={handleApply}
                            size="sm"
                            className="gradient-primary text-white gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Apply {grouped.increase.length} Increases
                        </Button>
                    )}

                    {applied && (
                        <Badge className="bg-green-500 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Applied
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-6">
                {/* Increase Recommendations */}
                {grouped.increase.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            Increase Load ({grouped.increase.length})
                        </h4>
                        <div className="space-y-3">
                            {grouped.increase.map((rec) => (
                                <RecommendationCard
                                    key={rec.exerciseId}
                                    rec={rec}
                                    unit={preferredWeightUnit}
                                    applied={applied}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Maintain Recommendations */}
                {grouped.maintain.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-blue-600">
                            <Minus className="h-4 w-4" />
                            Maintain Load ({grouped.maintain.length})
                        </h4>
                        <div className="space-y-3">
                            {grouped.maintain.map((rec) => (
                                <RecommendationCard
                                    key={rec.exerciseId}
                                    rec={rec}
                                    unit={preferredWeightUnit}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Decrease Recommendations */}
                {grouped.decrease.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-orange-600">
                            <TrendingDown className="h-4 w-4" />
                            Consider Reducing ({grouped.decrease.length})
                        </h4>
                        <div className="space-y-3">
                            {grouped.decrease.map((rec) => (
                                <RecommendationCard
                                    key={rec.exerciseId}
                                    rec={rec}
                                    unit={preferredWeightUnit}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Individual recommendation card component
function RecommendationCard({
    rec,
    unit,
    compact = false,
    applied = false,
}: {
    rec: ProgressionRecommendation;
    unit: string;
    compact?: boolean;
    applied?: boolean;
}) {
    const Icon = rec.action === 'increase' ? TrendingUp :
        rec.action === 'decrease' ? TrendingDown : Minus;

    const changeText = rec.changePercentage > 0
        ? `+${rec.changePercentage.toFixed(1)}%`
        : rec.changePercentage < 0
            ? `${rec.changePercentage.toFixed(1)}%`
            : 'No change';

    return (
        <div className={cn(
            'p-3 rounded-lg border transition-all',
            rec.action === 'increase' && 'bg-green-500/5 border-green-500/20',
            rec.action === 'maintain' && 'bg-blue-500/5 border-blue-500/20',
            rec.action === 'decrease' && 'bg-orange-500/5 border-orange-500/20',
            applied && rec.action === 'increase' && 'ring-2 ring-green-500/50',
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{rec.exerciseName}</span>
                        {rec.confidence === 'high' && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                                High Confidence
                            </Badge>
                        )}
                    </div>

                    {!compact && (
                        <p className="text-sm text-muted-foreground mb-2">
                            {rec.rationale}
                        </p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{rec.currentLoad} {unit}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={cn(
                            'font-semibold',
                            rec.action === 'increase' && 'text-green-600',
                            rec.action === 'decrease' && 'text-orange-600',
                            rec.action === 'maintain' && 'text-blue-600',
                        )}>
                            {rec.recommendedLoad} {unit}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {changeText}
                        </Badge>
                    </div>
                </div>

                <div className={cn(
                    'p-2 rounded-lg',
                    rec.action === 'increase' && 'bg-green-500/10',
                    rec.action === 'maintain' && 'bg-blue-500/10',
                    rec.action === 'decrease' && 'bg-orange-500/10',
                )}>
                    <Icon className={cn(
                        'h-5 w-5',
                        rec.action === 'increase' && 'text-green-600',
                        rec.action === 'maintain' && 'text-blue-600',
                        rec.action === 'decrease' && 'text-orange-600',
                    )} />
                </div>
            </div>
        </div>
    );
}
