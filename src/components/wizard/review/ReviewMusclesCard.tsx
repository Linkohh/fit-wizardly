import { Target, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WizardSelections, MUSCLE_DATA } from '@/types/fitness';

interface ReviewMusclesCardProps {
    selections: WizardSelections;
    onEdit: () => void;
}

export function ReviewMusclesCard({ selections, onEdit }: ReviewMusclesCardProps) {
    const { t } = useTranslation();

    const getMuscleLabel = (id: string) =>
        MUSCLE_DATA.find(m => m.id === id)?.name || id;

    return (
        <Card className="h-full relative group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5 text-primary" />
                        {t('wizard.review.target_muscles')} <span className="text-muted-foreground text-sm font-normal ml-1">({selections.targetMuscles.length})</span>
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
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {selections.targetMuscles.length > 0 ? (
                        selections.targetMuscles.map((muscle) => (
                            <Badge key={muscle} variant="default" className="bg-muscle-highlight text-primary-foreground hover:bg-muscle-highlight/90">
                                {getMuscleLabel(muscle)}
                            </Badge>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('wizard.review.no_muscles')}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
