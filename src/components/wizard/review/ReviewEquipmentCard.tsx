import { Dumbbell, Pencil, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WizardSelections, EQUIPMENT_OPTIONS } from '@/types/fitness';

interface ReviewEquipmentCardProps {
    selections: WizardSelections;
    onEdit: () => void;
}

export function ReviewEquipmentCard({ selections, onEdit }: ReviewEquipmentCardProps) {
    const { t } = useTranslation();

    const getEquipmentLabel = (id: string) =>
        EQUIPMENT_OPTIONS.find(e => e.id === id)?.name || id;

    return (
        <Card className="h-full relative group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        {t('wizard.review.equipment')} <span className="text-muted-foreground text-sm font-normal ml-1">({selections.equipment.length})</span>
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
                    {selections.equipment.map((eq) => (
                        <Badge key={eq} variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 transition-colors">
                            <Check className="h-3 w-3 text-success" />
                            {getEquipmentLabel(eq)}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
