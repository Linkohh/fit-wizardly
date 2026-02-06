import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, Zap, Link2, ArrowRightLeft, Shield, Clock, Activity } from 'lucide-react';
import { Muscle } from '../../../types';
import { getMuscleGroupColor, getMuscleGroupName } from '../../../data/muscleGroups';
import { getMuscleById } from '../../../data/muscles';
import { getMuscleMetadata, defaultMuscleMetadata } from '../../../data/muscleRelationships';

interface InfoPanelProps {
  muscle: Muscle | null;
  isOpen: boolean;
  onClose: () => void;
  onMuscleClick: (muscleId: string) => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  muscle,
  isOpen,
  onClose,
  onMuscleClick,
}) => {
  if (!muscle) return null;

  const groupColor = getMuscleGroupColor(muscle.group);
  const metadata = getMuscleMetadata(muscle.id) ?? defaultMuscleMetadata;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderMuscleList = (muscleIds: string[], colorClass: string) => {
    return muscleIds
      .map((id) => getMuscleById(id))
      .filter((m): m is Muscle => m !== undefined)
      .slice(0, 6) // Limit to prevent overflow
      .map((m) => (
        <button
          key={m.id}
          onClick={() => onMuscleClick(m.id)}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${colorClass}`}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: getMuscleGroupColor(m.group) }}
          />
          {m.name.replace(/ \((Left|Right)\)$/, '')}
        </button>
      ));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-click-feedback="on"
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel - Glassmorphism */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-panel-stronger shadow-premium-lg z-50 overflow-y-auto border-l border-white/10"
          >
            {/* Header with gradient accent */}
            <div
              className="sticky top-0 z-10 p-6 pb-4 border-b border-white/10 dark:border-white/5"
              style={{
                background: `linear-gradient(135deg, ${groupColor}25 0%, ${groupColor}05 50%, transparent 100%)`,
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Muscle group badge */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: groupColor }}
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {getMuscleGroupName(muscle.group)}
                </span>
              </div>

              {/* Muscle name */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {muscle.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 italic">
                {muscle.scientificName}
              </p>

              {/* Quick stats */}
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(metadata.difficulty)}`}>
                  {metadata.difficulty}
                </span>
                {metadata.compoundPrimary && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Compound
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  {metadata.recoveryHours}h recovery
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Function */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Function
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {muscle.function}
                </p>
              </section>

              {/* Exercises */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell className="w-4 h-4 text-primary-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Exercises
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {muscle.exercises.map((exercise) => (
                    <span
                      key={exercise}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                    >
                      {exercise}
                    </span>
                  ))}
                </div>
              </section>

              {/* Synergist Muscles */}
              {metadata.synergists.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Synergists
                    </h3>
                    <span className="text-xs text-gray-400">(work together)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderMuscleList(
                      metadata.synergists,
                      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40'
                    )}
                  </div>
                </section>
              )}

              {/* Antagonist Muscles */}
              {metadata.antagonists.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRightLeft className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Antagonists
                    </h3>
                    <span className="text-xs text-gray-400">(opposing muscles)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderMuscleList(
                      metadata.antagonists,
                      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    )}
                  </div>
                </section>
              )}

              {/* Stabilizer Muscles */}
              {metadata.stabilizers.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Stabilizers
                    </h3>
                    <span className="text-xs text-gray-400">(support movement)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {renderMuscleList(
                      metadata.stabilizers,
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    )}
                  </div>
                </section>
              )}

              {/* Related Muscles (legacy) */}
              {muscle.relatedMuscles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Related Muscles
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {muscle.relatedMuscles.map((relatedId) => {
                      const relatedMuscle = getMuscleById(relatedId);
                      if (!relatedMuscle) return null;

                      const relatedColor = getMuscleGroupColor(relatedMuscle.group);

                      return (
                        <button
                          key={relatedId}
                          onClick={() => onMuscleClick(relatedId)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full transition-colors"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: relatedColor }}
                          />
                          {relatedMuscle.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Views available */}
              <section>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Visible In
                </h3>
                <div className="flex gap-2">
                  {muscle.views.map((view) => (
                    <span
                      key={view}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-md capitalize"
                    >
                      {view} View
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;
