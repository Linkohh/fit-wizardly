import { motion } from 'framer-motion';
import { ViewType } from '@/features/mcl/types';

interface MiniViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export function MiniViewToggle({ currentView, onViewChange, className = '' }: MiniViewToggleProps) {
  const views: { id: ViewType; label: string }[] = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
  ];

  return (
    <div
      className={`inline-flex items-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 p-1 ${className}`}
      role="tablist"
      aria-label="Anatomy view"
    >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={(e) => {
            e.stopPropagation();
            onViewChange(view.id);
          }}
          className={`
            relative px-4 py-1.5 text-xs font-medium rounded-full
            transition-colors duration-200
            ${currentView === view.id
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
            }
          `}
          role="tab"
          aria-selected={currentView === view.id}
          aria-controls={`anatomy-${view.id}-panel`}
        >
          {currentView === view.id && (
            <motion.div
              layoutId="mini-view-indicator"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 shadow-lg shadow-purple-500/25"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{view.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MiniViewToggle;
