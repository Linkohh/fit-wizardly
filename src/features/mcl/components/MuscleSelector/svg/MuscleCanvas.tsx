import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Muscle, ViewType, MuscleHighlight } from '../../../types';
import { getMusclesByView } from '../../../data/muscles';
import BodyOutline from './BodyOutline';
import MusclePath from './MusclePath';

interface MuscleCanvasProps {
  view: ViewType;
  selectedMuscles: string[];
  hoveredMuscle: string | null;
  highlightedMuscles?: MuscleHighlight[];
  disabledMuscles?: string[];
  colorByGroup: boolean;
  accentColor: string;
  onMuscleHover: (muscle: Muscle | null, event?: React.MouseEvent) => void;
  onMuscleClick: (muscle: Muscle) => void;
}

export const MuscleCanvas: React.FC<MuscleCanvasProps> = ({
  view,
  selectedMuscles,
  hoveredMuscle,
  highlightedMuscles = [],
  disabledMuscles = [],
  colorByGroup,
  accentColor,
  onMuscleHover,
  onMuscleClick,
}) => {
  // Get muscles for current view
  const visibleMuscles = useMemo(() => getMusclesByView(view), [view]);

  // Create a lookup map for highlights
  const highlightMap = useMemo(() => {
    const map = new Map<string, MuscleHighlight>();
    highlightedMuscles.forEach((h) => map.set(h.muscleId, h));
    return map;
  }, [highlightedMuscles]);

  // Create a Set for disabled muscles for O(1) lookup
  const disabledSet = useMemo(() => new Set(disabledMuscles), [disabledMuscles]);

  // Sort muscles so selected/highlighted ones render on top
  const sortedMuscles = useMemo(() => {
    return [...visibleMuscles].sort((a, b) => {
      const aSelected = selectedMuscles.includes(a.id);
      const bSelected = selectedMuscles.includes(b.id);
      const aHovered = hoveredMuscle === a.id;
      const bHovered = hoveredMuscle === b.id;
      const aHighlighted = highlightMap.has(a.id);
      const bHighlighted = highlightMap.has(b.id);
      const aDisabled = disabledSet.has(a.id);
      const bDisabled = disabledSet.has(b.id);

      // Disabled muscles render at bottom
      if (aDisabled && !bDisabled) return -1;
      if (bDisabled && !aDisabled) return 1;

      // Hovered muscle on top
      if (aHovered && !bHovered) return 1;
      if (bHovered && !aHovered) return -1;

      // Selected muscles above highlighted but below hovered
      if (aSelected && !bSelected) return 1;
      if (bSelected && !aSelected) return -1;

      // Highlighted above unselected
      if (aHighlighted && !bHighlighted) return 1;
      if (bHighlighted && !aHighlighted) return -1;

      return 0;
    });
  }, [visibleMuscles, selectedMuscles, hoveredMuscle, highlightMap, disabledSet]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(
    (muscle: Muscle, event: React.MouseEvent) => {
      onMuscleHover(muscle, event);
    },
    [onMuscleHover]
  );

  const handleMouseLeave = useCallback(() => {
    onMuscleHover(null);
  }, [onMuscleHover]);

  return (
    <AnimatePresence mode="wait">
      <motion.svg
        key={view}
        viewBox="0 0 200 440"
        className="w-full h-full"
        initial={{ opacity: 0, x: view === 'front' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: view === 'front' ? 20 : -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* SVG Definitions: Gradients for muscle groups */}
        <defs>
          {/* Ambient glow gradient */}
          <radialGradient id="ambientGlow" cx="50%" cy="45%" r="60%" fx="50%" fy="45%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Muscle group gradients */}
          <linearGradient id="gradient-chest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <linearGradient id="gradient-back" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <linearGradient id="gradient-shoulders" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#FACC15" />
          </linearGradient>
          <linearGradient id="gradient-arms" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <linearGradient id="gradient-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="gradient-legs" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <linearGradient id="gradient-glutes" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <linearGradient id="gradient-calves" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>

          {/* Glow filter for selected muscles */}
          <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background glow */}
        <ellipse
          cx="100"
          cy="200"
          rx="90"
          ry="180"
          fill="url(#ambientGlow)"
          className="pointer-events-none"
        />

        {/* Background body outline */}
        <BodyOutline view={view} />

        {/* Muscle paths */}
        <g className="muscles">
          {sortedMuscles.map((muscle) => (
            <MusclePath
              key={`${muscle.id}-${view}`}
              muscle={muscle}
              view={view}
              isSelected={selectedMuscles.includes(muscle.id)}
              isHovered={hoveredMuscle === muscle.id}
              isDisabled={disabledSet.has(muscle.id)}
              highlight={highlightMap.get(muscle.id)}
              colorByGroup={colorByGroup}
              accentColor={accentColor}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={onMuscleClick}
            />
          ))}
        </g>
      </motion.svg>
    </AnimatePresence>
  );
};

export default MuscleCanvas;
