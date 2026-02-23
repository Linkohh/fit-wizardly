import React from 'react';
import { motion } from 'framer-motion';
import { ViewType } from '../../../types';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { getSpringTransition } from '@/lib/motion/tokens';

interface ViewSwitcherProps {
  currentView: ViewType;
  showSideView: boolean;
  onViewChange: (view: ViewType) => void;
}

const views: { id: ViewType; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'side', label: 'Side' },
];

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  showSideView,
  onViewChange,
}) => {
  const { shouldReduceMotion } = useMotionPreferences();
  const availableViews = showSideView ? views : views.filter((v) => v.id !== 'side');

  return (
    <div className="flex items-center gap-1 p-1 surface-premium rounded-xl surface-premium-stroke">
      {availableViews.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`
            relative px-2.5 py-2 text-fluid-sm font-semibold rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
            focus:ring-offset-black/50
            ${currentView === view.id
              ? 'text-white'
              : 'text-white/50 hover:text-white'
            }
          `}
          aria-pressed={currentView === view.id}
        >
          {currentView === view.id && (
            <motion.div
              layoutId="activeViewTab"
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg"
              style={{
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4), 0 2px 8px rgba(139, 92, 246, 0.3)',
              }}
              transition={getSpringTransition('snappy', shouldReduceMotion)}
            />
          )}
          <span className="relative z-10">{view.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
