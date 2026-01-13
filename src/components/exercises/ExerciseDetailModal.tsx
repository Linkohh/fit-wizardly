import { Exercise } from '@/types/fitness';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlayCircle, Info, List, Network, Heart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFavoritesStore } from '@/stores/favorites-store';

interface ExerciseDetailModalProps {
    exercise: Exercise | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ExerciseDetailModal({ exercise, isOpen, onClose }: ExerciseDetailModalProps) {
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    if (!exercise) return null;
    const favorite = isFavorite(exercise.id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-black/95 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden h-[90vh] md:h-[80vh] flex flex-col">
                {/* Header / Hero */}
                <div className="relative h-48 md:h-64 shrink-0 bg-gradient-to-b from-primary/10 to-black/50 overflow-hidden">
                    {/* Background Image Logic */}
                    {exercise.imageUrl ? (
                        <img src={exercise.imageUrl} alt={exercise.name} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Network className="w-32 h-32" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex gap-2 mb-2">
                            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/20 uppercase tracking-widest text-[10px]">{exercise.category}</Badge>
                            <Badge variant="outline" className="border-white/20 text-white/70 uppercase tracking-widest text-[10px]">{exercise.difficulty}</Badge>
                        </div>
                        <DialogTitle className="text-3xl md:text-4xl font-bold tracking-tight mb-1 flex items-center gap-4">
                            {exercise.name}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFavorite(exercise.id)}
                                className="rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-red-500"
                            >
                                <Heart className={`w-6 h-6 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                        </DialogTitle>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Metadata & Muscles */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Muscles Targeted</h4>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.primaryMuscles.map(m => (
                                        <Badge key={m} className="bg-primary hover:bg-primary/90">{m.replace('_', ' ')}</Badge>
                                    ))}
                                    {exercise.secondaryMuscles.map(m => (
                                        <Badge key={m} variant="secondary" className="bg-white/10 hover:bg-white/20">{m.replace('_', ' ')}</Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Equipment</h4>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.equipment.map(e => (
                                        <div key={e} className="text-sm text-white/80 capitalize flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {e.replace('_', ' ')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {exercise.metabolic && (
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                    <div className="text-orange-400 text-xs font-bold uppercase mb-1">Metabolic Impact</div>
                                    <div className="text-2xl font-bold text-orange-200">{exercise.metabolic.met} <span className="text-sm font-normal text-white/50">METs</span></div>
                                    <p className="text-xs text-white/60 mt-1">High calorie burn potential</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Content Tabs */}
                        <div className="md:col-span-2">
                            <Tabs defaultValue="instructions" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-white/5">
                                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                                    <TabsTrigger value="variations" disabled={!exercise.variations?.length}>Variations</TabsTrigger>
                                    <TabsTrigger value="history">History</TabsTrigger> {/* Placeholder for future */}
                                </TabsList>

                                <TabsContent value="instructions" className="mt-4 space-y-6">
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-lg leading-relaxed text-white/90">{exercise.description}</p>
                                    </div>

                                    {exercise.cues.length > 0 && (
                                        <div className="bg-blue-500/10 border-l-2 border-blue-500 p-4 rounded-r-lg">
                                            <h5 className="font-semibold text-blue-400 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Pro Cues</h5>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-blue-100/80">
                                                {exercise.cues.map(c => <li key={c}>{c}</li>)}
                                            </ul>
                                        </div>
                                    )}

                                    {exercise.steps && exercise.steps.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold flex items-center gap-2 text-white/80"><List className="w-4 h-4" /> Execution</h4>
                                            <ol className="space-y-4 relative border-l border-white/10 ml-2 pl-6">
                                                {exercise.steps.map((step, i) => (
                                                    <li key={i} className="relative">
                                                        <span className="absolute -left-[33px] top-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold ring-4 ring-black">{i + 1}</span>
                                                        <p className="text-white/80 leading-relaxed">{step}</p>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="variations" className="mt-4">
                                    <div className="space-y-3">
                                        {exercise.variations?.map((v, i) => (
                                            <div key={i} className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h5 className="font-bold text-white group-hover:text-primary transition-colors">{v.name}</h5>
                                                    <Badge variant={v.type === 'progression' ? 'default' : v.type === 'regression' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                                                        {v.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{v.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
