import { useState } from 'react';
import { useTrainerStore } from '@/stores/trainerStore';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignPlanDialogProps {
    clientId: string;
    clientName: string;
    trigger?: React.ReactNode;
}

export function AssignPlanDialog({ clientId, clientName, trigger }: AssignPlanDialogProps) {
    const { templates, assignPlan } = useTrainerStore();
    const [open, setOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const handleAssign = () => {
        if (!selectedTemplateId) return;

        assignPlan(clientId, selectedTemplateId);
        toast.success(`Plan assigned to ${clientName}`);
        setOpen(false);
        setSelectedTemplateId(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Plan
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Training Plan</DialogTitle>
                    <DialogDescription>
                        Select a template to assign to {clientName}. They will receive it immediately.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {templates.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">No templates available</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Create a plan and save it as a template first.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            <RadioGroup value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                                <div className="space-y-3">
                                    {templates.map((template) => (
                                        <div key={template.id} className="relative flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 cursor-pointer">
                                            <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                                            <Label htmlFor={template.id} className="font-normal cursor-pointer flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold">{template.name}</span>
                                                    <div className="flex gap-1">
                                                        {template.tags?.map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground line-clamp-2">
                                                    {template.planSnapshot.workoutDays.length} days • {template.planSnapshot.splitType.replace('_', ' ')}
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedTemplateId || templates.length === 0}>
                        Assign Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
