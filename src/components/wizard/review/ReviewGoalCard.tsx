import { Target, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WizardSelections } from '@/types/fitness';

interface ReviewGoalCardProps {
    selections: WizardSelections;
    onEdit: () => void;
}

export function ReviewGoalCard({ selections, onEdit }: ReviewGoalCardProps) {
    const { t } = useTranslation();

    const goalLabels: Record<string, string> = {
        strength: t('goals.strength'),
        hypertrophy: t('goals.hypertrophy'),
        general: t('goals.general'),
    };

    const experienceLabels: Record<string, string> = {
        beginner: t('experience.beginner'),
        intermediate: t('experience.intermediate'),
        advanced: t('experience.advanced'),
    };

    return (
        <Card className="h-full relative group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5 text-primary" />
                        {t('wizard.review.goal_experience')}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        aria-label={t('common.edit')}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('wizard.review.training_goal')}</span>
                    <Badge variant="default" className="gradient-primary text-primary-foreground">
                        {goalLabels[selections.goal]}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('wizard.review.experience')}</span>
                    <Badge variant="secondary">
                        {experienceLabels[selections.experienceLevel]}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
