import { AlertTriangle, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { WizardSelections, CONSTRAINT_OPTIONS } from '@/types/fitness';
import { motion } from 'framer-motion';

interface ReviewConstraintsCardProps {
    selections: WizardSelections;
    onEdit: () => void;
}

export function ReviewConstraintsCard({ selections, onEdit }: ReviewConstraintsCardProps) {
    const { t } = useTranslation();

    if (selections.constraints.length === 0) return null;

    const getConstraintLabel = (id: string) =>
        CONSTRAINT_OPTIONS.find(c => c.id === id)?.name || id;

    return (
        <Card className="border-warning/50 bg-warning/5 relative group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg text-warning">
                        <AlertTriangle className="h-5 w-5" />
                        {t('wizard.review.constraints_applied')}
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
                    {selections.constraints.map((constraint) => (
                        <Badge key={constraint} variant="outline" className="border-warning text-warning">
                            {getConstraintLabel(constraint)}
                        </Badge>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                    {t('wizard.review.constraints_hint')}
                </p>
            </CardContent>
        </Card>
    );
}
