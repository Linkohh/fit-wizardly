import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Muscle } from '../../../types';
import { getMuscleGroupColor, getMuscleGroupName } from '../../../data/muscleGroups';

interface MuscleTooltipProps {
  muscle: Muscle | null;
  position: { x: number; y: number };
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const MuscleTooltip: React.FC<MuscleTooltipProps> = ({
  muscle,
  position,
  visible,
  containerRef,
}) => {
  if (!muscle) return null;

  // Calculate position to keep tooltip within bounds
  const getAdjustedPosition = () => {
    if (!containerRef.current) return position;

    const container = containerRef.current.getBoundingClientRect();
    const tooltipWidth = 200;
    const tooltipHeight = 80;
    const padding = 10;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position
    if (x + tooltipWidth > container.width - padding) {
      x = position.x - tooltipWidth - padding;
    } else {
      x = position.x + padding;
    }

    // Adjust vertical position
    if (y + tooltipHeight > container.height - padding) {
      y = position.y - tooltipHeight - padding;
    } else {
      y = position.y + padding;
    }

    return { x: Math.max(padding, x), y: Math.max(padding, y) };
  };

  const adjustedPosition = getAdjustedPosition();
  const groupColor = getMuscleGroupColor(muscle.group);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 5 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[180px]">
            {/* Muscle group indicator */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: groupColor }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {getMuscleGroupName(muscle.group)}
              </span>
            </div>

            {/* Muscle name */}
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {muscle.name}
            </h4>

            {/* Scientific name */}
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              {muscle.scientificName}
            </p>

            {/* Quick hint */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Click for details
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MuscleTooltip;
