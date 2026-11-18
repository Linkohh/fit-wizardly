import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePlanStore } from '@/stores/planStore';

interface WorkoutEmptyStateProps {
    icon: LucideIcon;
    message: string;
    testId?: string;
}

/**
 * First-run empty state for screens that fill up from workout logs.
 * Points to today's workout when a plan exists, otherwise to the wizard.
 */
export function WorkoutEmptyState({ icon: Icon, message, testId }: WorkoutEmptyStateProps) {
    const { t } = useTranslation();
    const hasPlan = usePlanStore((state) => state.currentPlan !== null);

    return (
        <Card data-testid={testId} className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                <p className="max-w-xs text-base text-foreground">{message}</p>
                <Button asChild>
                    {hasPlan ? (
                        <Link to="/plan">{t('emptyStates.start_workout', "Start today's workout")}</Link>
                    ) : (
                        <Link to="/wizard">{t('emptyStates.create_plan', 'Create a plan')}</Link>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
