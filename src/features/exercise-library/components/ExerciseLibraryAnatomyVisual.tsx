import {
  ANATOMY_SILHOUETTE_PATH,
  BACK_MUSCLE_PATHS,
  FRONT_MUSCLE_PATHS,
} from '@/data/anatomyPaths';
import { cn } from '@/lib/utils';
import type { ExerciseLibraryMediaView, ExerciseLibraryRecord } from '../types';
import { normalizeFilterValue } from '../utils';

interface ExerciseLibraryAnatomyVisualProps {
  exercise: ExerciseLibraryRecord;
  primaryKeys: string[];
  secondaryKeys: string[];
  view: ExerciseLibraryMediaView;
  className?: string;
  compact?: boolean;
}

const CATEGORY_PALETTES: Record<
  string,
  {
    glowFrom: string;
    glowTo: string;
    primaryFill: string;
    secondaryFill: string;
    outline: string;
  }
> = {
  strength: {
    glowFrom: 'rgba(168,85,247,0.24)',
    glowTo: 'rgba(59,130,246,0.10)',
    primaryFill: '#d8b4fe',
    secondaryFill: 'rgba(196,181,253,0.55)',
    outline: 'rgba(255,255,255,0.20)',
  },
  cardio: {
    glowFrom: 'rgba(251,113,133,0.24)',
    glowTo: 'rgba(249,115,22,0.10)',
    primaryFill: '#fda4af',
    secondaryFill: 'rgba(251,146,60,0.48)',
    outline: 'rgba(255,255,255,0.20)',
  },
  flexibility: {
    glowFrom: 'rgba(52,211,153,0.22)',
    glowTo: 'rgba(14,165,233,0.10)',
    primaryFill: '#6ee7b7',
    secondaryFill: 'rgba(125,211,252,0.48)',
    outline: 'rgba(255,255,255,0.18)',
  },
  core: {
    glowFrom: 'rgba(56,189,248,0.22)',
    glowTo: 'rgba(14,116,144,0.12)',
    primaryFill: '#7dd3fc',
    secondaryFill: 'rgba(103,232,249,0.48)',
    outline: 'rgba(255,255,255,0.18)',
  },
  other: {
    glowFrom: 'rgba(245,158,11,0.18)',
    glowTo: 'rgba(59,130,246,0.08)',
    primaryFill: '#fcd34d',
    secondaryFill: 'rgba(253,186,116,0.45)',
    outline: 'rgba(255,255,255,0.18)',
  },
};

const EQUIPMENT_ACCENTS: Record<string, string> = {
  barbell: 'rgba(251,191,36,0.18)',
  dumbbells: 'rgba(96,165,250,0.18)',
  kettlebells: 'rgba(251,146,60,0.18)',
  cables: 'rgba(52,211,153,0.16)',
  machines: 'rgba(125,211,252,0.16)',
  bodyweight: 'rgba(45,212,191,0.16)',
  bench: 'rgba(244,114,182,0.14)',
};

function getPalette(exercise: ExerciseLibraryRecord) {
  const categoryPalette =
    CATEGORY_PALETTES[exercise.category.slug] ?? CATEGORY_PALETTES.other;
  const equipmentAccent =
    EQUIPMENT_ACCENTS[normalizeFilterValue(exercise.equipment[0] ?? '')] ??
    'rgba(255,255,255,0.08)';

  return {
    ...categoryPalette,
    equipmentAccent,
  };
}

function getPathsForView(view: ExerciseLibraryMediaView) {
  return view === 'front' ? FRONT_MUSCLE_PATHS : BACK_MUSCLE_PATHS;
}

export function ExerciseLibraryAnatomyVisual({
  exercise,
  primaryKeys,
  secondaryKeys,
  view,
  className,
  compact = false,
}: ExerciseLibraryAnatomyVisualProps) {
  const palette = getPalette(exercise);
  const paths = getPathsForView(view);

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden',
        compact ? 'px-3 py-2' : 'px-5 py-4',
        className
      )}
      style={{
        backgroundImage: `radial-gradient(circle at top, ${palette.glowFrom}, transparent 42%), linear-gradient(140deg, ${palette.equipmentAccent}, transparent 48%)`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,5,18,0.16),rgba(5,4,10,0.72))]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />

      <div className="relative flex h-full w-full items-center justify-center">
        <svg
          viewBox="0 0 200 440"
          aria-hidden="true"
          className={cn(
            'h-full max-h-[92%] w-auto drop-shadow-[0_24px_45px_rgba(0,0,0,0.38)]',
            compact ? 'max-w-[150px]' : 'max-w-[220px]'
          )}
          fill="none"
        >
          <path
            d={ANATOMY_SILHOUETTE_PATH}
            fill="rgba(255,255,255,0.06)"
            stroke={palette.outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {secondaryKeys.map((key) => {
            const path = paths[key];
            if (!path) return null;

            return (
              <path
                key={`secondary-${view}-${key}`}
                d={path.display}
                fill={palette.secondaryFill}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            );
          })}

          {primaryKeys.map((key) => {
            const path = paths[key];
            if (!path) return null;

            return (
              <path
                key={`primary-${view}-${key}`}
                d={path.display}
                fill={palette.primaryFill}
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
