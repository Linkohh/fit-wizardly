import { memo, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { useHaptics } from '@/hooks/useHaptics';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useExerciseInteraction } from '@/hooks/useExerciseInteraction';
import { cn } from '@/lib/utils';
import { resolveExerciseLibraryDisplayContent } from '../display';
import type { ExerciseLibraryRecord } from '../types';
import { ExerciseLibraryMedia } from './ExerciseLibraryMedia';

interface ExerciseLibraryCardProps {
  exercise: ExerciseLibraryRecord;
  onSelect: (exercise: ExerciseLibraryRecord) => void;
  index: number;
}

export const ExerciseLibraryCard = memo(function ExerciseLibraryCard({
  exercise,
  onSelect,
  index,
}: ExerciseLibraryCardProps) {
  const { i18n } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const haptics = useHaptics();
  const { isFavorite, toggleFavorite } = usePreferencesStore();
  const { trackView } = useExerciseInteraction();
  const favorite = isFavorite(exercise.id);
  const displayContent = resolveExerciseLibraryDisplayContent(
    exercise,
    i18n.language
  );

  const handleSelect = useCallback(() => {
    trackView(exercise.id);
    haptics.impact('light');
    onSelect(exercise);
  }, [exercise, haptics, onSelect, trackView]);

  const handleFavoriteToggle = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      await haptics.selection();
      toggleFavorite(exercise.id);
    },
    [exercise.id, haptics, toggleFavorite]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handleSelect();
    },
    [handleSelect]
  );

  return (
    <motion.article
      data-click-feedback="on"
      layout
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: prefersReducedMotion ? 0 : 0.28,
          delay: prefersReducedMotion ? 0 : index * 0.02,
          ease: 'easeOut',
        },
      }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      className="group h-full cursor-pointer"
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open ${displayContent.name}`}
    >
      <div className="relative flex h-full min-h-[312px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,10,27,0.96),rgba(25,13,32,0.96))] shadow-[0_18px_60px_rgba(5,4,10,0.35)] sm:min-h-[328px]">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_35%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]" />

        <div className="relative h-48 border-b border-white/10 sm:h-56">
          <ExerciseLibraryMedia exercise={exercise} className="h-full w-full" />

          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-white/15 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md"
            >
              {exercise.category.name}
            </Badge>

            <button
              type="button"
              onClick={handleFavoriteToggle}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/70 backdrop-blur-md transition',
                favorite && 'border-rose-300/35 text-rose-300'
              )}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('h-5 w-5', favorite && 'fill-current')} />
            </button>
          </div>

          <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
            {exercise.primaryMuscles[0] ? (
              <Badge className="rounded-full border border-primary/25 bg-primary/15 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary-foreground">
                {exercise.primaryMuscles[0]}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="relative flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-[1.2rem] font-extrabold leading-[1.15] text-white transition-colors group-hover:text-primary">
              {displayContent.name}
            </h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
              {displayContent.description || 'Open this exercise to view verified movement details and source metadata.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {exercise.equipment.slice(0, 2).map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-white/75"
              >
                {item}
              </span>
            ))}
            {exercise.secondaryMuscles[0] ? (
              <span className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-white/55">
                + {exercise.secondaryMuscles[0]}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>{exercise.source === 'wger' ? 'wger content' : 'local backup'}</span>
            <span>Open details</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
});
