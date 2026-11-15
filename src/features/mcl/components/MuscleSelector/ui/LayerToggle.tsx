import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import type { MuscleLayer } from '../../../types';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { getSpringTransition } from '@/lib/motion/tokens';

interface LayerToggleProps {
  value: MuscleLayer;
  onChange: (layer: MuscleLayer) => void;
}

const options: { id: MuscleLayer; label: string }[] = [
  { id: 'surface', label: 'Surface' },
  { id: 'deep', label: 'Deep' },
];

export const LayerToggle: React.FC<LayerToggleProps> = ({ value, onChange }) => {
  const { shouldReduceMotion } = useMotionPreferences();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    e.preventDefault();
    const nextIndex = (index + step + options.length) % options.length;
    onChange(options[nextIndex].id);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Muscle layer"
      className="flex items-center gap-1 p-1 surface-premium rounded-xl surface-premium-stroke"
    >
      {options.map((option, index) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative px-2.5 py-2 text-fluid-sm font-semibold rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
              focus:ring-offset-black/50
              ${selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            {selected && (
              <motion.div
                layoutId="activeLayerTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg"
                style={{
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4), 0 2px 8px rgba(139, 92, 246, 0.3)',
                }}
                transition={getSpringTransition('snappy', shouldReduceMotion)}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LayerToggle;
