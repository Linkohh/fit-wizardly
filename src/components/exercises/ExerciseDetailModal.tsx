import { Exercise } from '@/types/fitness';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Clock,
    Dumbbell,
    Flame,
    Heart,
    Info,
    List,
    Network,
    Target,
} from 'lucide-react';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useTrackExerciseView } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { getExerciseTheme } from '@/lib/exerciseTheme';
import { cn } from '@/lib/utils';
import { RelatedExercises } from './RelatedExercises';
import { ExerciseBadges } from './ExerciseBadges';
import { useTranslation } from 'react-i18next';
import { ComponentType, ReactNode } from 'react';

interface ExerciseDetailModalProps {
    exercise: Exercise | null;
    isOpen: boolean;
    onClose: () => void;
    onSelectExercise?: (exercise: Exercise) => void;
}

function formatToken(value: string) {
    return value.replaceAll('_', ' ');
}

interface MetaCardProps {
    title: string;
    icon: ComponentType<{ className?: string }>;
    children: ReactNode;
    className?: string;
}

function MetaCard({ title, icon: Icon, children, className }: MetaCardProps) {
    return (
        <section className={cn('rounded-2xl border border-white/10 bg-white/[0.03] p-4', className)}>
            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {title}
            </h4>
            {children}
        </section>
    );
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

    const metabolicCalories = exercise.metabolic ? Math.round((exercise.metabolic.met * 75 * 10) / 200) : null;

    const ModalContent = () => (
        <>
            <div
                className="relative h-52 shrink-0 overflow-hidden border-b border-white/10 md:h-64"
                style={{
                    background: `linear-gradient(to bottom right, ${theme.glowHover}, rgba(0,0,0,0.65))`,
                }}
            >
                {exercise.imageUrl ? (
                    <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="absolute inset-0 h-full w-full object-cover opacity-55"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Network className="h-32 w-32" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                <div className="absolute inset-x-4 bottom-4 md:inset-x-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                        <Badge
                            variant="secondary"
                            className="border-primary/20 bg-primary/20 text-[10px] uppercase tracking-[0.12em] text-primary-foreground"
                        >
                            {exercise.category || 'strength'}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-white/25 bg-black/25 text-[10px] uppercase tracking-[0.12em] text-white/80"
                        >
                            {exercise.difficulty || 'Intermediate'}
                        </Badge>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h2 className="line-clamp-2 text-[clamp(1.9rem,2.8vw,2.6rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                                {exercise.name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                                {exercise.primaryMuscles.slice(0, 2).map((muscle) => (
                                    <span key={muscle} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 px-2 py-0.5 capitalize">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {formatToken(muscle)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFavoriteToggle}
                            className="h-10 w-10 shrink-0 rounded-full border border-white/20 bg-black/25 text-white hover:bg-black/40 hover:text-rose-300"
                        >
                            <Heart
                                className={cn(
                                    'h-5 w-5',
                                    favorite && 'fill-rose-400 text-rose-400'
                                )}
                            />
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-[290px_1fr] md:p-6">
                    <aside className="space-y-4">
                        <MetaCard
                            title={t('exercises.detail.muscles_targeted', 'Muscles Targeted')}
                            icon={Target}
                        >
                            <div className="flex flex-wrap gap-2">
                                {exercise.primaryMuscles.map((muscle) => (
                                    <Badge key={muscle} className="bg-primary/90 text-primary-foreground capitalize hover:bg-primary/80">
                                        {formatToken(muscle)}
                                    </Badge>
                                ))}
                                {exercise.secondaryMuscles.map((muscle) => (
                                    <Badge
                                        key={muscle}
                                        variant="outline"
                                        className="border-white/20 bg-white/5 text-white/80 capitalize"
                                    >
                                        {formatToken(muscle)}
                                    </Badge>
                                ))}
                            </div>
                        </MetaCard>

                        <MetaCard title={t('exercises.detail.equipment', 'Equipment')} icon={Dumbbell}>
                            <ul className="space-y-2">
                                {exercise.equipment.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-2 text-sm capitalize text-white/80"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {formatToken(item)}
                                    </li>
                                ))}
                            </ul>
                        </MetaCard>

                        {exercise.metabolic && (
                            <MetaCard
                                title={t('exercises.detail.metabolic_impact', 'Metabolic Impact')}
                                icon={Flame}
                                className="border-orange-300/20 bg-orange-500/10"
                            >
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold text-orange-100">
                                        {exercise.metabolic.met}
                                    </p>
                                    <p className="pb-1 text-sm text-orange-200/80">METs</p>
                                </div>
                                <p className="mt-1 text-xs text-orange-100/80">
                                    {t('exercises.detail.high_burn', 'High calorie burn potential')}
                                </p>
                                {metabolicCalories !== null && (
                                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-orange-100/60">
                                        Approx. {metabolicCalories} calories / 10 min
                                    </p>
                                )}
                            </MetaCard>
                        )}

                        <MetaCard title="Progress & Badges" icon={Activity}>
                            <ExerciseBadges exerciseId={exercise.id} />
                        </MetaCard>
                    </aside>

                    <section className="min-w-0 rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
                        <Tabs defaultValue="instructions" className="w-full">
                            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-4">
                                <TabsTrigger value="instructions" className="min-h-9 border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.12em] data-[state=active]:bg-white data-[state=active]:text-black">
                                    {t('exercises.detail.instructions', 'Instructions')}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="variations"
                                    disabled={!exercise.variations?.length}
                                    className="min-h-9 border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.12em] data-[state=active]:bg-white data-[state=active]:text-black"
                                >
                                    {t('exercises.detail.variations', 'Variations')}
                                </TabsTrigger>
                                <TabsTrigger value="related" className="min-h-9 border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.12em] data-[state=active]:bg-white data-[state=active]:text-black">
                                    {t('exercises.detail.related', 'Related')}
                                </TabsTrigger>
                                <TabsTrigger value="history" className="min-h-9 border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.12em] data-[state=active]:bg-white data-[state=active]:text-black">
                                    {t('exercises.detail.history', 'History')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="instructions" className="mt-4 space-y-4">
                                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="break-words text-base leading-relaxed text-white/90 md:text-lg">
                                        {exercise.description || 'No description available yet for this exercise.'}
                                    </p>
                                </section>

                                {exercise.cues.length > 0 && (
                                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-200">
                                            <Info className="h-4 w-4" />
                                            {t('exercises.detail.pro_cues', 'Pro Cues')}
                                        </h5>
                                        <ul className="space-y-2 text-sm text-sky-100/90">
                                            {exercise.cues.map((cue) => (
                                                <li key={cue} className="flex items-start gap-2">
                                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-300" />
                                                    <span className="break-words">{cue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {exercise.steps && exercise.steps.length > 0 && (
                                    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                        <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
                                            <List className="h-4 w-4" />
                                            {t('exercises.detail.execution', 'Execution')}
                                        </h5>
                                        <ol className="space-y-3">
                                            {exercise.steps.map((step, index) => (
                                                <li key={`${step}-${index}`} className="flex items-start gap-3">
                                                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/25 text-xs font-semibold text-white/90">
                                                        {index + 1}
                                                    </span>
                                                    <p className="break-words text-sm leading-relaxed text-white/80">{step}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </section>
                                )}
                            </TabsContent>

                            <TabsContent value="variations" className="mt-4">
                                {exercise.variations && exercise.variations.length > 0 ? (
                                    <div className="space-y-3">
                                        {exercise.variations.map((variation, index) => (
                                            <article
                                                key={`${variation.name}-${index}`}
                                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                            >
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <h5 className="text-base font-semibold text-white">
                                                        {variation.name}
                                                    </h5>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px] uppercase tracking-[0.12em]',
                                                            variation.type === 'progression' && 'border-primary/30 bg-primary/15 text-primary-foreground',
                                                            variation.type === 'regression' && 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100',
                                                            variation.type === 'alternative' && 'border-white/20 bg-white/10 text-white/80'
                                                        )}
                                                    >
                                                        {variation.type}
                                                    </Badge>
                                                </div>
                                                <p className="break-words text-sm leading-relaxed text-white/75">
                                                    {variation.description}
                                                </p>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/60">
                                        No variation options available yet.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="related" className="mt-4">
                                <RelatedExercises
                                    currentExercise={exercise}
                                    onSelect={(relatedExercise) => {
                                        if (onSelectExercise) {
                                            onSelectExercise(relatedExercise);
                                            return;
                                        }
                                        onClose();
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="history" className="mt-4">
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-12 text-center">
                                    <Clock className="mb-4 h-12 w-12 text-white/35" />
                                    <h5 className="mb-2 text-base font-semibold text-white/80">
                                        {t('exercises.detail.no_history', 'No history yet')}
                                    </h5>
                                    <p className="max-w-sm break-words text-sm text-white/60">
                                        {t('exercises.detail.history_prompt', 'Complete this exercise to track your progress over time.')}
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </section>
                </div>
            </ScrollArea>
        </>
    );

    if (isMobile) {
        return (
            <Drawer
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DrawerContent className="max-h-[92vh] border-white/10 bg-black/95 text-white backdrop-blur-xl">
                    <ModalContent />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="h-[90vh] max-w-5xl overflow-hidden border-white/10 bg-black/95 p-0 text-white backdrop-blur-xl md:h-[84vh]">
                <ModalContent />
            </DialogContent>
        </Dialog>
    );
}
