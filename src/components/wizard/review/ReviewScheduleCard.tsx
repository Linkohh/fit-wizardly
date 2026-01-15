import { Calendar, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WizardSelections } from '@/types/fitness';

interface ReviewScheduleCardProps {
    selections: WizardSelections;
    onEdit: () => void;
}

export function ReviewScheduleCard({ selections, onEdit }: ReviewScheduleCardProps) {
    const { t } = useTranslation();

    const getSplitType = (days: number): string => {
        if (days <= 3) return t('wizard.schedule.split_full_body');
        if (days === 4) return t('wizard.schedule.split_upper_lower');
        return t('wizard.schedule.split_ppl');
    };

    return (
        <Card className="h-full relative group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t('wizard.review.schedule')}
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
                    <span className="text-muted-foreground">{t('wizard.review.days_per_week')}</span>
                    <Badge variant="default" className="gradient-primary text-primary-foreground">
                        {selections.daysPerWeek} {t('wizard.review.days')}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('wizard.review.session_length')}</span>
                    <Badge variant="secondary">
                        {selections.sessionDuration} {t('wizard.review.min')}
                    </Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t('wizard.review.split_type')}</span>
                    <Badge variant="outline">
                        {getSplitType(selections.daysPerWeek)}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
