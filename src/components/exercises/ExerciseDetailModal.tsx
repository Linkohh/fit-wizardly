import { Exercise } from '@/types/fitness';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Info, List, Network, Heart, Clock, Zap, Target, Dumbbell } from 'lucide-react';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useTrackExerciseView } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { getExerciseTheme } from '@/lib/exerciseTheme';
import { cn } from '@/lib/utils';
import { RelatedExercises } from './RelatedExercises';
import { ExerciseBadges } from './ExerciseBadges';
import { useTranslation } from 'react-i18next';

interface ExerciseDetailModalProps {
    exercise: Exercise | null;
    isOpen: boolean;
    onClose: () => void;
    onSelectExercise?: (exercise: Exercise) => void;
}

export function ExerciseDetailModal({ exercise, isOpen, onClose, onSelectExercise }: ExerciseDetailModalProps) {
    const { t } = useTranslation();
    const { isFavorite, toggleFavorite } = usePreferencesStore();
    const haptics = useHaptics();
    const isMobile = useIsMobile();

    useTrackExerciseView(isOpen ? exercise?.id ?? null : null);

    if (!exercise) return null;

    const favorite = isFavorite(exercise.id);
    const theme = getExerciseTheme(exercise);

    const handleFavoriteToggle = () => {
        haptics.favoriteToggle();
        toggleFavorite(exercise.id);
    };

    const difficultyColor = {
        'Beginner': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'Intermediate': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'Advanced': 'bg-red-500/20 text-red-300 border-red-500/30',
        'Elite': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        'All Levels': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    }[exercise.difficulty || 'Intermediate'] || 'bg-slate-500/20 text-slate-300';

    const ModalContent = () => (
        <>
            {/* Hero Header */}
            <div
                className="relative h-44 md:h-56 shrink-0 overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${theme.glow}, rgba(0,0,0,0.6))`,
                }}
            >
                {exercise.imageUrl ? (
                    <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
                        <Network className="w-28 h-28" />
                    </div>
                )}

                {/* Gradient overlays for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                {/* Hero content */}
                <div className="absolute bottom-5 left-6 right-6">
                    <div className="flex gap-2 mb-2.5">
                        <Badge
                            variant="secondary"
                            className="bg-white/10 backdrop-blur-sm text-white/90 border-white/10 uppercase tracking-[0.15em] text-[10px] font-medium"
                        >
                            {exercise.category}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={cn('uppercase tracking-[0.15em] text-[10px] font-medium backdrop-blur-sm', difficultyColor)}
                        >
                            {exercise.difficulty}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
                            {exercise.name}
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFavoriteToggle}
                            className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white hover:text-red-400 h-9 w-9 shrink-0"
                        >
                            <Heart
                                className={cn(
                                    'w-5 h-5',
                                    favorite && 'fill-red-500 text-red-500'
                                )}
                            />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Metadata */}
                        <div className="space-y-5">
                            {/* Muscles Targeted */}
                            <div>
                                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
                                    <Target className="w-3 h-3" />
                                    {t('exercises.detail.muscles_targeted')}
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.primaryMuscles.map((m) => (
                                        <Badge
                                            key={m}
                                            className="bg-primary/15 text-primary border-primary/20 capitalize text-xs font-medium"
                                        >
                                            {m.replace('_', ' ')}
                                        </Badge>
                                    ))}
                                    {exercise.secondaryMuscles.map((m) => (
                                        <Badge
                                            key={m}
                                            variant="secondary"
                                            className="bg-white/[0.06] text-white/50 border-white/[0.08] capitalize text-xs font-normal"
                                        >
                                            {m.replace('_', ' ')}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Equipment */}
                            <div>
                                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
                                    <Dumbbell className="w-3 h-3" />
                                    {t('exercises.detail.equipment')}
                                </h4>
                                <div className="space-y-1.5">
                                    {exercise.equipment.map((e) => (
                                        <div
                                            key={e}
                                            className="text-sm text-white/70 capitalize flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                            {e.replace('_', ' ')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Metabolic Impact */}
                            {exercise.metabolic && (
                                <div className="rounded-lg bg-orange-500/[0.08] border border-orange-500/15 overflow-hidden">
                                    <div className="px-3.5 py-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Zap className="w-3 h-3 text-orange-400" />
                                            <span className="text-[10px] font-semibold text-orange-400/80 uppercase tracking-[0.15em]">
                                                {t('exercises.detail.metabolic_impact')}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-orange-200">
                                                {exercise.metabolic.met}
                                            </span>
                                            <span className="text-xs font-medium text-white/40">METs</span>
                                        </div>
                                        <p className="text-[11px] text-white/35 mt-1.5 leading-relaxed">
                                            {t('exercises.detail.high_burn')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Mastery & Badges */}
                            <div className="pt-3 border-t border-white/[0.06]">
                                <ExerciseBadges exerciseId={exercise.id} />
                            </div>
                        </div>

                        {/* Right Column: Content Tabs */}
                        <div className="md:col-span-2">
                            <Tabs defaultValue="instructions" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
                                    <TabsTrigger value="instructions" className="text-xs data-[state=active]:bg-white/10 rounded-md">
                                        {t('exercises.detail.instructions')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="variations"
                                        disabled={!exercise.variations?.length}
                                        className="text-xs data-[state=active]:bg-white/10 rounded-md"
                                    >
                                        {t('exercises.detail.variations')}
                                    </TabsTrigger>
                                    <TabsTrigger value="related" className="text-xs data-[state=active]:bg-white/10 rounded-md">
                                        {t('exercises.detail.related')}
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="text-xs data-[state=active]:bg-white/10 rounded-md">
                                        {t('exercises.detail.history')}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="instructions" className="mt-5 space-y-5">
                                    {/* Description */}
                                    <div>
                                        <p className="text-[15px] leading-[1.7] text-white/80">
                                            {exercise.description}
                                        </p>
                                    </div>

                                    {/* Pro Cues */}
                                    {exercise.cues.length > 0 && (
                                        <div className="bg-blue-500/[0.08] border border-blue-500/15 rounded-lg p-4">
                                            <h5 className="font-semibold text-blue-400 text-sm mb-3 flex items-center gap-2">
                                                <Info className="w-4 h-4" />
                                                {t('exercises.detail.pro_cues')}
                                            </h5>
                                            <ul className="space-y-2">
                                                {exercise.cues.map((c) => (
                                                    <li key={c} className="flex items-start gap-2 text-sm text-blue-100/70">
                                                        <span className="w-1 h-1 rounded-full bg-blue-400/50 mt-2 shrink-0" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Step-by-Step Execution */}
                                    {exercise.steps && exercise.steps.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-sm flex items-center gap-2 text-white/70">
                                                <List className="w-4 h-4" />
                                                {t('exercises.detail.execution')}
                                            </h4>
                                            <ol className="space-y-3 relative border-l border-white/[0.08] ml-3 pl-6">
                                                {exercise.steps.map((step, i) => (
                                                    <li key={i} className="relative">
                                                        <span className="absolute -left-[30px] top-0.5 w-5 h-5 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/50">
                                                            {i + 1}
                                                        </span>
                                                        <p className="text-sm text-white/70 leading-relaxed">{step}</p>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="variations" className="mt-5">
                                    <div className="space-y-2.5">
                                        {exercise.variations?.map((v, i) => (
                                            <div
                                                key={i}
                                                className="group/var p-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors cursor-pointer"
                                            >
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <h5 className="font-semibold text-sm text-white/90 group-hover/var:text-primary transition-colors">
                                                        {v.name}
                                                    </h5>
                                                    <Badge
                                                        variant={
                                                            v.type === 'progression'
                                                                ? 'default'
                                                                : v.type === 'regression'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                        }
                                                        className="text-[10px] uppercase tracking-wider"
                                                    >
                                                        {v.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-white/45 leading-relaxed">{v.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="related" className="mt-5">
                                    <RelatedExercises
                                        currentExercise={exercise}
                                        onSelect={(ex) => {
                                            if (onSelectExercise) {
                                                onSelectExercise(ex);
                                            } else {
                                                onClose();
                                            }
                                        }}
                                    />
                                </TabsContent>

                                <TabsContent value="history" className="mt-5">
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                                            <Clock className="w-6 h-6 text-white/25" />
                                        </div>
                                        <h5 className="font-semibold text-white/70 mb-1.5 text-sm">
                                            {t('exercises.detail.no_history')}
                                        </h5>
                                        <p className="text-xs text-white/35 max-w-xs leading-relaxed">
                                            {t('exercises.detail.history_prompt')}
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="bg-black/95 backdrop-blur-xl border-white/10 text-white max-h-[90vh] flex flex-col">
                    <ModalContent />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-black/95 backdrop-blur-xl border-white/[0.08] text-white p-0 overflow-hidden h-[90vh] md:h-[80vh] flex flex-col">
                <ModalContent />
            </DialogContent>
        </Dialog>
    );
}
