import React from 'react';
import { motion } from 'framer-motion';
import { muscleGroups } from '../../../data/muscleGroups';
import { MuscleGroup } from '../../../types';

interface LegendProps {
  selectedGroups?: MuscleGroup[];
  onGroupToggle?: (group: MuscleGroup) => void;
  interactive?: boolean;
}

export const Legend: React.FC<LegendProps> = ({
  selectedGroups,
  onGroupToggle,
  interactive = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {muscleGroups.map((group) => {
        const isSelected = !selectedGroups || selectedGroups.includes(group.id);

        return (
          <motion.button
            key={group.id}
            onClick={() => interactive && onGroupToggle?.(group.id)}
            disabled={!interactive}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 glass-card border
              ${interactive
                ? 'cursor-pointer hover:scale-105 hover:shadow-md'
                : 'cursor-default'
              }
              ${isSelected
                ? 'border-white/20 dark:border-white/10 text-gray-700 dark:text-gray-200'
                : 'border-transparent text-gray-400 dark:text-gray-500 opacity-60'
              }
            `}
            whileHover={interactive ? { scale: 1.05 } : {}}
            whileTap={interactive ? { scale: 0.95 } : {}}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all ${isSelected ? 'opacity-100 shadow-sm' : 'opacity-40'
                }`}
              style={{
                backgroundColor: group.color,
                boxShadow: isSelected ? `0 0 8px ${group.color}60` : 'none'
              }}
            />
            <span>{group.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default Legend;
