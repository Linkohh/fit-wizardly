import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Trash2 } from 'lucide-react';
import { Muscle } from '../../../types';
import { getMuscleGroupColor, getMuscleGroupName } from '../../../data/muscleGroups';
import PresetSelector from './PresetSelector';
import { StateCard } from '@/components/ui/state-card';
import { getTimedTransition } from '@/lib/motion/tokens';

interface SelectionSidebarProps {
  selectedMuscles: Muscle[];
  onRemoveMuscle: (muscleId: string) => void;
  onClearAll: () => void;
  onViewInfo: (muscle: Muscle) => void;
  onPresetSelect?: (muscleIds: string[], presetId: string) => void;
  currentSelectionIds?: string[];
  mobileSheetMode?: boolean;
  showPresets?: boolean;
  reduceMotion?: boolean;
}

export const SelectionSidebar: React.FC<SelectionSidebarProps> = ({
  selectedMuscles,
  onRemoveMuscle,
  onClearAll,
  onViewInfo,
  onPresetSelect,
  currentSelectionIds = [],
  mobileSheetMode = false,
  showPresets = true,
  reduceMotion = false,
}) => {
  const groupedMuscles = selectedMuscles.reduce(
    (acc, muscle) => {
      if (!acc[muscle.group]) {
        acc[muscle.group] = [];
      }
      acc[muscle.group].push(muscle);
      return acc;
    },
    {} as Record<string, Muscle[]>
  );

  return (
    <div
      className={`h-full flex flex-col surface-premium-strong surface-premium-stroke border-t md:border-t-0 md:border-l relative z-20 ${mobileSheetMode ? 'rounded-t-2xl' : ''}`}
      data-testid={mobileSheetMode ? 'muscle-selector-sheet-sidebar' : 'muscle-selector-inline-sidebar'}
    >
      <div className={`${mobileSheetMode ? 'p-4 pb-3' : 'p-4'} border-b border-border/30 dark:border-white/10 space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-fluid-lg font-semibold text-foreground">
            Selected Muscles
          </h3>
          <span className="px-2 py-0.5 bg-primary/20 text-primary-300 text-fluid-sm rounded-full tabular-nums">
            {selectedMuscles.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            {showPresets && onPresetSelect ? (
              <PresetSelector
                onPresetSelect={onPresetSelect}
                currentSelection={currentSelectionIds}
              />
            ) : null}
          </div>

          {selectedMuscles.length > 0 ? (
            <button
              onClick={onClearAll}
              className="min-h-[44px] min-w-[44px] p-2.5 text-muted-foreground hover:text-red-400 hover:bg-muted/30 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-border/20 dark:hover:border-white/5"
              title="Clear all"
              data-click-feedback="off"
              data-interaction-feedback="explicit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className={`${mobileSheetMode ? 'flex-1 overflow-y-auto px-4 py-3 pb-5' : 'flex-1 overflow-y-auto p-4'} custom-scrollbar`}>
        {selectedMuscles.length === 0 ? (
          <StateCard
            variant="empty"
            title="No muscles selected yet"
            description="Tap the body map to build your target list."
            compact
            className="bg-transparent border-white/10 shadow-none"
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedMuscles).map(([group, muscles]) => (
                <motion.div
                  key={group}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={getTimedTransition('base', reduceMotion)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getMuscleGroupColor(group) }}
                    />
                    <span className="text-fluid-sm font-medium text-gray-400 uppercase tracking-wide">
                      {getMuscleGroupName(group)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {muscles.map((muscle) => (
                      <motion.div
                        key={muscle.id}
                        layout={!reduceMotion}
                        initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                        transition={getTimedTransition('fast', reduceMotion)}
                        className="flex items-center justify-between p-3 rounded-xl surface-premium surface-premium-stroke group transition-colors"
                      >
                        <span className="text-fluid-sm text-gray-200 truncate flex-1 font-medium">
                          {muscle.name}
                        </span>
                        <div className={`flex items-center gap-1 transition-opacity ${mobileSheetMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            onClick={() => onViewInfo(muscle)}
                            className="min-h-[36px] min-w-[36px] p-1.5 hover:bg-gray-200/10 rounded"
                            aria-label={`View info for ${muscle.name}`}
                            data-click-feedback="off"
                            data-interaction-feedback="explicit"
                          >
                            <Info className="w-3.5 h-3.5 text-gray-300" />
                          </button>
                          <button
                            onClick={() => onRemoveMuscle(muscle.id)}
                            className="min-h-[36px] min-w-[36px] p-1.5 hover:bg-red-900/30 rounded"
                            aria-label={`Remove ${muscle.name}`}
                            data-click-feedback="off"
                            data-interaction-feedback="explicit"
                          >
                            <X className="w-3.5 h-3.5 text-gray-300 hover:text-red-300" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {selectedMuscles.length > 0 ? (
        <div className="p-4 border-t border-border/30 dark:border-white/10">
          <button
            className="w-full min-h-[44px] py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white text-fluid-sm font-medium rounded-lg transition-colors tabular-nums"
            data-click-feedback="off"
            data-interaction-feedback="explicit"
          >
            View Exercises ({selectedMuscles.length} muscles)
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default SelectionSidebar;
