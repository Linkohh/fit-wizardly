import { User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WizardSelections } from '@/types/fitness';
import { useState } from 'react';

interface ReviewCoachCardProps {
    selections: WizardSelections;
}

export function ReviewCoachCard({ selections }: ReviewCoachCardProps) {
    const [showCoachNotes, setShowCoachNotes] = useState(false);

    if (!selections.isTrainer) return null;

    return (
        <Card className="border-neon-purple/30 bg-neon-purple/5">
            <CardHeader className="pb-3 border-b border-neon-purple/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg text-neon-purple">
                        <User className="h-5 w-5" />
                        Coach Mode
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="coach-notes"
                            checked={showCoachNotes}
                            onCheckedChange={setShowCoachNotes}
                        />
                        <Label htmlFor="coach-notes" className="text-sm cursor-pointer">Show Notes</Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {showCoachNotes ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 rounded bg-background/40 border border-neon-purple/20">
                            <p className="text-sm font-semibold text-neon-purple mb-1">Periodization Note:</p>
                            <p className="text-sm text-muted-foreground">
                                User selected {selections.goal} with {selections.experienceLevel} experience.
                                Recommend starting with 2 weeks of accumulation volume.
                            </p>
                        </div>
                        <div className="p-3 rounded bg-background/40 border border-neon-purple/20">
                            <p className="text-sm font-semibold text-neon-purple mb-1">Cues Focus:</p>
                            <p className="text-sm text-muted-foreground">
                                Emphasize tempo (3-0-1-0) for the first mesocycle to build control.
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Toggle "Show Notes" to view programming recommendations.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
