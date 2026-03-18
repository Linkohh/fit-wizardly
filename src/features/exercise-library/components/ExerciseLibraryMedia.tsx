import { memo, useEffect, useMemo, useState } from 'react';
import { Activity, Image as ImageIcon, Layers3, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type {
  ExerciseLibraryMediaVariant,
  ExerciseLibraryMediaView,
  ExerciseLibraryRecord,
} from '../types';
import { resolveExerciseLibraryDisplayContent } from '../display';
import { resolveExerciseLibraryMedia } from '../media';
import { ExerciseLibraryAnatomyVisual } from './ExerciseLibraryAnatomyVisual';

interface ExerciseLibraryMediaProps {
  exercise: ExerciseLibraryRecord;
  className?: string;
  roundedClassName?: string;
  compact?: boolean;
  allowViewToggle?: boolean;
}

function HeartbeatGlyph({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 80"
      aria-hidden="true"
      className={cn(
        'h-16 w-24 text-primary/80 drop-shadow-[0_0_18px_rgba(168,85,247,0.35)]',
        compact && 'h-12 w-20'
      )}
      fill="none"
    >
      <path
        d="M6 41h25l8-26 14 50 17-35 10 11h21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  );
}

export const ExerciseLibraryMedia = memo(function ExerciseLibraryMedia({
  exercise,
  className,
  roundedClassName = '',
  compact = false,
  allowViewToggle = false,
}: ExerciseLibraryMediaProps) {
  const { i18n } = useTranslation();
  const [disabledVariants, setDisabledVariants] = useState<ExerciseLibraryMediaVariant[]>([]);
  const [preferredView, setPreferredView] = useState<ExerciseLibraryMediaView | null>(null);
  const displayContent = useMemo(
    () => resolveExerciseLibraryDisplayContent(exercise, i18n.language),
    [exercise, i18n.language]
  );

  useEffect(() => {
    setDisabledVariants([]);
    setPreferredView(null);
  }, [exercise.id]);

  const resolvedMedia = useMemo(
    () =>
      resolveExerciseLibraryMedia(exercise, {
        disabledVariants,
        preferredView,
        displayName: displayContent.name,
      }),
    [disabledVariants, displayContent.name, exercise, preferredView]
  );

  const anatomy = resolvedMedia.anatomy;
  const canToggleView =
    allowViewToggle && anatomy !== null && anatomy.availableViews.length > 1;

  const handleImageError = () => {
    setDisabledVariants((current) =>
      current.includes(resolvedMedia.variant)
        ? current
        : [...current, resolvedMedia.variant]
    );
  };

  const renderMediaBadge = () => {
    const icon =
      resolvedMedia.variant === 'wger'
        ? ImageIcon
        : resolvedMedia.variant === 'override'
          ? Sparkles
          : resolvedMedia.variant === 'anatomy'
            ? Activity
            : Layers3;

    const badgeClassName =
      resolvedMedia.variant === 'wger'
        ? 'border-emerald-300/20 bg-emerald-500/12 text-emerald-100'
        : resolvedMedia.variant === 'override'
          ? 'border-sky-300/20 bg-sky-500/12 text-sky-100'
          : resolvedMedia.variant === 'anatomy'
            ? 'border-primary/20 bg-primary/12 text-primary-foreground'
            : 'border-white/15 bg-white/10 text-white/75';

    const Icon = icon;

    return (
      <div
        className={cn(
          'absolute inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] backdrop-blur-md',
          allowViewToggle ? 'left-3 top-3' : 'bottom-3 right-3',
          badgeClassName
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {resolvedMedia.label}
      </div>
    );
  };

  if (
    (resolvedMedia.variant === 'wger' || resolvedMedia.variant === 'override') &&
    resolvedMedia.imageUrl
  ) {
    return (
      <div className={cn('relative overflow-hidden bg-black/60', roundedClassName, className)}>
        <img
          src={resolvedMedia.imageUrl}
          alt={resolvedMedia.alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
        {renderMediaBadge()}
      </div>
    );
  }

  if (resolvedMedia.variant === 'anatomy' && anatomy) {
    return (
      <div
        className={cn(
          'relative overflow-hidden bg-[linear-gradient(180deg,rgba(12,5,20,0.94),rgba(7,4,14,1))]',
          roundedClassName,
          className
        )}
      >
        <ExerciseLibraryAnatomyVisual
          exercise={exercise}
          primaryKeys={anatomy.primaryKeys}
          secondaryKeys={anatomy.secondaryKeys}
          view={anatomy.activeView}
          compact={compact}
        />

        {canToggleView ? (
          <div className="absolute right-3 top-3 inline-flex rounded-full border border-white/10 bg-black/35 p-1 backdrop-blur-md">
            {anatomy.availableViews.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setPreferredView(view)}
                className={cn(
                  'rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition',
                  anatomy.activeView === view
                    ? 'bg-white/12 text-white'
                    : 'text-white/45 hover:text-white/75'
                )}
                aria-label={`Show ${view} muscle map`}
              >
                {view}
              </button>
            ))}
          </div>
        ) : null}

        {renderMediaBadge()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_42%),linear-gradient(180deg,rgba(12,5,20,0.95),rgba(7,4,14,1))]',
        roundedClassName,
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(168,85,247,0.08),transparent_35%,rgba(59,130,246,0.08))]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
        <HeartbeatGlyph compact={compact} />
      </div>
      {renderMediaBadge()}
    </div>
  );
});
