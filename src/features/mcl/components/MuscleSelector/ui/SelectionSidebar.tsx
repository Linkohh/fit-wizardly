import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Trash2 } from 'lucide-react';
import { Muscle } from '../../../types';
import { getMuscleGroupColor, getMuscleGroupName } from '../../../data/muscleGroups';
import PresetSelector from './PresetSelector';

interface SelectionSidebarProps {
  selectedMuscles: Muscle[];
  onRemoveMuscle: (muscleId: string) => void;
  onClearAll: () => void;
  onViewInfo: (muscle: Muscle) => void;
  onPresetSelect?: (muscleIds: string[], presetId: string) => void;
  currentSelectionIds?: string[];
}

export const SelectionSidebar: React.FC<SelectionSidebarProps> = ({
  selectedMuscles,
  onRemoveMuscle,
  onClearAll,
  onViewInfo,
  onPresetSelect,
  currentSelectionIds = [],
}) => {
  // Group selected muscles by muscle group
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
    <div className="h-full flex flex-col bg-[#0f0518]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl relative z-20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 space-y-3">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Selected Muscles
          </h3>
          <span className="px-2 py-0.5 bg-primary/20 text-primary-300 text-sm rounded-full">
            {selectedMuscles.length}
          </span>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            {onPresetSelect && (
              <PresetSelector
                onPresetSelect={onPresetSelect}
                currentSelection={currentSelectionIds}
              />
            )}
          </div>

          {selectedMuscles.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-2 text-white/50 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected muscles list */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedMuscles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">
              Click on muscles to select them
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedMuscles).map(([group, muscles]) => (
                <motion.div
                  key={group}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getMuscleGroupColor(group) }}
                    />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {getMuscleGroupName(group)}
                    </span>
                  </div>

                  {/* Muscles in group */}
                  <div className="space-y-1">
                    {muscles.map((muscle) => (
                      <motion.div
                        key={muscle.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-2.5 rounded-xl glass-card group hover:border-white/20 dark:hover:border-white/10 transition-all"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1 font-medium">
                          {muscle.name}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onViewInfo(muscle)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            aria-label={`View info for ${muscle.name}`}
                          >
                            <Info className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={() => onRemoveMuscle(muscle.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            aria-label={`Remove ${muscle.name}`}
                          >
                            <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
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

      {/* Action button */}
      {selectedMuscles.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
            View Exercises ({selectedMuscles.length} muscles)
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectionSidebar;
