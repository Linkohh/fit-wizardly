import { Heart, Info, Link2, ShieldCheck, Target, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useTrackExerciseView } from '@/hooks/useExerciseInteraction';
import { useHaptics } from '@/hooks/useHaptics';
import { useViewportTier, type ViewportTier } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { resolveExerciseLibraryDisplayContent } from '../display';
import type { ExerciseLibraryRecord } from '../types';
import { formatTimestamp } from '../utils';
import { ExerciseLibraryMedia } from './ExerciseLibraryMedia';

interface ExerciseLibraryDetailModalProps {
  exercise: ExerciseLibraryRecord | null;
  relatedExercises: ExerciseLibraryRecord[];
  onClose: () => void;
  onSelectRelated: (exercise: ExerciseLibraryRecord) => void;
}

type DetailSurfaceMode = ViewportTier;

function getDetailHeroClassName(surfaceMode: DetailSurfaceMode) {
  if (surfaceMode === 'phone') {
    return 'h-[min(36svh,19rem)] supports-[height:100dvh]:h-[min(36dvh,19rem)]';
  }

  if (surfaceMode === 'tablet') {
    return 'h-[min(38svh,23rem)] supports-[height:100dvh]:h-[min(38dvh,23rem)]';
  }

  return 'h-[min(40svh,18rem)] min-h-[18rem]';
}

function DetailBody({
  exercise,
  relatedExercises,
  onSelectRelated,
  onClose,
  surfaceMode,
  locale,
}: {
  exercise: ExerciseLibraryRecord;
  relatedExercises: ExerciseLibraryRecord[];
  onSelectRelated: (exercise: ExerciseLibraryRecord) => void;
  onClose: () => void;
  surfaceMode: DetailSurfaceMode;
  locale: string;
}) {
  const haptics = useHaptics();
  const { isFavorite, toggleFavorite } = usePreferencesStore();
  const favorite = isFavorite(exercise.id);
  const displayContent = resolveExerciseLibraryDisplayContent(exercise, locale);
  const relatedDisplayContent = relatedExercises.map((related) => ({
    exercise: related,
    displayContent: resolveExerciseLibraryDisplayContent(related, locale),
  }));

  const handleFavoriteToggle = async () => {
    await haptics.selection();
    toggleFavorite(exercise.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'relative shrink-0 overflow-hidden border-b border-white/10',
          getDetailHeroClassName(surfaceMode)
        )}
      >
        <ExerciseLibraryMedia
          exercise={exercise}
          className="h-full w-full"
          roundedClassName=""
          compact={surfaceMode === 'phone'}
          allowViewToggle
        />

        {surfaceMode === 'phone' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] h-11 w-11 rounded-full border border-white/15 bg-black/35 text-white/80 backdrop-blur-md hover:bg-black/50 hover:text-white"
            aria-label="Close exercise details"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}

        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-4 sm:inset-x-6 sm:bottom-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3 pr-12 sm:pr-0">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full border border-primary/20 bg-primary/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-foreground">
                {exercise.category.name}
              </Badge>
              {exercise.primaryMuscles[0] ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75"
                >
                  {exercise.primaryMuscles[0]}
                </Badge>
              ) : null}
            </div>
            <div>
              <h2 className="max-w-3xl text-[clamp(1.8rem,3vw,2.8rem)] font-black leading-[1.02] text-white">
                {displayContent.name}
              </h2>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/50">
                {exercise.source === 'wger' ? 'Read-only exercise content' : 'Backup exercise content'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavoriteToggle}
            className="h-12 w-12 shrink-0 rounded-full border border-white/15 bg-black/35 text-white/70 hover:bg-black/50 hover:text-rose-300"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={cn('h-5 w-5', favorite && 'fill-rose-400 text-rose-400')} />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            'grid gap-5 p-4 sm:p-6',
            surfaceMode === 'desktop' && 'xl:grid-cols-[minmax(0,1.75fr)_320px]'
          )}
        >
          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-white/80">
                <Info className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Description</h3>
              </div>
              <p className="text-base leading-relaxed text-white/78">
                {displayContent.description || 'No description is available for this exercise in the active source yet.'}
              </p>
            </section>

            {displayContent.aliases.length > 0 ? (
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-white/80">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Also known as</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayContent.aliases.map((alias, index) => (
                    <Badge
                      key={`${alias}-${index}`}
                      variant="outline"
                      className="border-white/15 bg-white/5 text-white/78"
                    >
                      {alias}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2 text-white/80">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Target profile</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/40">Primary muscles</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles.map((item, index) => (
                      <Badge key={`${item}-${index}`} className="bg-primary/90 text-primary-foreground">
                        {item}
                      </Badge>
                    )) : (
                      <span className="text-sm text-white/55">Not specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/40">Secondary muscles</p>
                  <div className="flex flex-wrap gap-2">
                    {exercise.secondaryMuscles.length > 0 ? exercise.secondaryMuscles.map((item, index) => (
                      <Badge
                        key={`${item}-${index}`}
                        variant="outline"
                        className="border-white/15 bg-white/5 text-white/75"
                      >
                        {item}
                      </Badge>
                    )) : (
                      <span className="text-sm text-white/55">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2 text-white/80">
                <Link2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Related exercises</h3>
              </div>
              {relatedExercises.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedDisplayContent.map(({ exercise: related, displayContent: relatedDisplay }) => (
                    <button
                      key={related.id}
                      type="button"
                      onClick={() => onSelectRelated(related)}
                      className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-primary/30 hover:bg-black/35"
                    >
                      <p className="font-semibold text-white">{relatedDisplay.name}</p>
                      <p className="mt-1 text-sm text-white/55">{related.primaryMuscles[0] || related.category.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/55">
                  No related exercises are available from the active library source yet.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                Equipment
              </h3>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.length > 0 ? exercise.equipment.map((item, index) => (
                  <Badge
                    key={`${item}-${index}`}
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white/78"
                  >
                    {item}
                  </Badge>
                )) : (
                  <span className="text-sm text-white/55">No equipment metadata</span>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-white/80">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]">Source and license</h3>
              </div>
              <div className="space-y-3 text-sm text-white/72">
                <p>
                  <span className="text-white/45">Source:</span> {exercise.source === 'wger' ? 'wger public API' : 'Local backup dataset'}
                </p>
                <p>
                  <span className="text-white/45">Last synced:</span> {formatTimestamp(exercise.lastSyncedAt)}
                </p>
                {exercise.licenseInfo ? (
                  <>
                    <p>
                      <span className="text-white/45">License:</span> {exercise.licenseInfo.shortName}
                    </p>
                    {exercise.licenseInfo.author ? (
                      <p>
                        <span className="text-white/45">Author:</span> {exercise.licenseInfo.author}
                      </p>
                    ) : null}
                    {exercise.licenseInfo.url ? (
                      <a
                        href={exercise.licenseInfo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                      >
                        Review license
                        <Link2 className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className="text-white/55">
                    License metadata is unavailable on this record. Review usage before publishing.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </ScrollArea>
    </div>
  );
}

export function ExerciseLibraryDetailModal({
  exercise,
  relatedExercises,
  onClose,
  onSelectRelated,
}: ExerciseLibraryDetailModalProps) {
  const { i18n } = useTranslation();
  const viewportTier = useViewportTier();

  useTrackExerciseView(exercise?.id ?? null);

  if (!exercise) return null;

  const displayContent = resolveExerciseLibraryDisplayContent(
    exercise,
    i18n.language
  );

  if (viewportTier === 'phone') {
    return (
      <Drawer open={Boolean(exercise)} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent
          data-surface="phone"
          className="h-[100svh] max-h-[100dvh] overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(13,8,24,0.98),rgba(10,7,18,0.98))] text-white supports-[height:100dvh]:h-[100dvh] pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
        >
          <DrawerTitle className="sr-only">{displayContent.name}</DrawerTitle>
          <DrawerDescription className="sr-only">{displayContent.description}</DrawerDescription>
          <DetailBody
            exercise={exercise}
            relatedExercises={relatedExercises}
            onSelectRelated={onSelectRelated}
            onClose={onClose}
            surfaceMode="phone"
            locale={i18n.language}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  if (viewportTier === 'tablet') {
    return (
      <Sheet open={Boolean(exercise)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          data-surface="tablet"
          side="right"
          className="h-[100svh] max-h-[100dvh] w-full max-w-none overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(13,8,24,0.98),rgba(10,7,18,0.98))] p-0 text-white supports-[height:100dvh]:h-[100dvh] sm:w-[min(92vw,54rem)] sm:max-w-none pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
        >
          <SheetTitle className="sr-only">{displayContent.name}</SheetTitle>
          <SheetDescription className="sr-only">{displayContent.description}</SheetDescription>
          <DetailBody
            exercise={exercise}
            relatedExercises={relatedExercises}
            onSelectRelated={onSelectRelated}
            onClose={onClose}
            surfaceMode="tablet"
            locale={i18n.language}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={Boolean(exercise)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-surface="desktop"
        className="h-[min(90svh,56rem)] max-w-6xl overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(13,8,24,0.98),rgba(10,7,18,0.98))] p-0 text-white supports-[height:100dvh]:h-[min(90dvh,56rem)]"
      >
        <DialogTitle className="sr-only">{displayContent.name}</DialogTitle>
        <DialogDescription className="sr-only">{displayContent.description}</DialogDescription>
        <DetailBody
          exercise={exercise}
          relatedExercises={relatedExercises}
          onSelectRelated={onSelectRelated}
          onClose={onClose}
          surfaceMode="desktop"
          locale={i18n.language}
        />
      </DialogContent>
    </Dialog>
  );
}
