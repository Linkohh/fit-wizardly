import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Muscle, ViewType, MuscleHighlight, MuscleLayer } from '../../../types';
import { getMusclesByView } from '../../../data/muscles';
import BodyOutline from './BodyOutline';
import MusclePath from './MusclePath';
import { getTimedTransition } from '@/lib/motion/tokens';
import { sortMusclesForRender } from '../../../lib/sortMuscles';
import { getLayerRole } from '../../../lib/layerVisibility';
import { getSideLabel } from '../../../lib/pairedMuscles';
import { SCULPT_DEFAULT, getSculptStyle } from '../../../lib/sculpt';
import { useTouchMusclePreview, type TouchMuscleHoverHandler } from './useTouchMusclePreview';

interface MuscleCanvasProps {
  view: ViewType;
  selectedMuscles: string[];
  hoveredMuscle: string | null;
  highlightedMuscles?: MuscleHighlight[];
  disabledMuscles?: string[];
  colorByGroup: boolean;
  accentColor: string;
  animateHighlights?: boolean;
  hoverIntensity?: 'default' | 'strong';
  enableTouchInfo?: boolean;
  enableTouchPreview?: boolean;
  longPressMs?: number;
  reduceMotion?: boolean;
  onMuscleHover: (muscle: Muscle | null, event?: React.MouseEvent) => void;
  onTouchMuscleHover?: TouchMuscleHoverHandler;
  onMuscleClick: (muscle: Muscle) => void;
  onMuscleLongPress?: (muscle: Muscle) => void;
  customViewBox?: string;
  sculptLevel?: number;
  /** The layer whose muscles can be selected in this view. */
  layer?: MuscleLayer;
}

export const MuscleCanvas: React.FC<MuscleCanvasProps> = ({
  view,
  selectedMuscles,
  hoveredMuscle,
  highlightedMuscles = [],
  disabledMuscles = [],
  colorByGroup,
  accentColor,
  animateHighlights = false,
  hoverIntensity = 'default',
  enableTouchInfo = false,
  enableTouchPreview = false,
  longPressMs = 380,
  reduceMotion = false,
  onMuscleHover,
  onTouchMuscleHover,
  onMuscleClick,
  onMuscleLongPress,
  customViewBox,
  sculptLevel = SCULPT_DEFAULT,
  layer = 'surface',
}) => {
  const sculpt = useMemo(() => getSculptStyle(sculptLevel), [sculptLevel]);
  const { setCanvas, handlers: touchPreviewHandlers, isTouchActive } = useTouchMusclePreview({
    enabled: enableTouchPreview,
    view,
    layer,
    longPressMs,
    onTouchMuscleHover,
    onMuscleClick,
  });

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

  const selectedSet = useMemo(() => new Set(selectedMuscles), [selectedMuscles]);
  const highlightedSet = useMemo(() => new Set(highlightMap.keys()), [highlightMap]);

  // Ghosts paint first (behind), then active muscles; each group is sorted so
  // selected/highlighted ones render on top (side view: by depth first). Hidden muscles are dropped unless
  // selected or highlighted, so a search match on the other layer is never invisible.
  const { ghostMuscles, activeMuscles, hiddenSelectedMuscles } = useMemo(() => {
    const ghosts: Muscle[] = [];
    const hiddenSelected: Muscle[] = [];
    const active: Muscle[] = [];
    for (const muscle of visibleMuscles) {
      const role = getLayerRole(muscle, view, layer);
      if (role === 'ghost') ghosts.push(muscle);
      else if (role === 'active') active.push(muscle);
      else if (selectedSet.has(muscle.id) || highlightedSet.has(muscle.id)) hiddenSelected.push(muscle);
    }
    const state = {
      selected: selectedSet,
      hovered: hoveredMuscle,
      highlighted: highlightedSet,
      disabled: disabledSet,
    };
    return {
      ghostMuscles: sortMusclesForRender(ghosts, view, state),
      activeMuscles: sortMusclesForRender(active, view, state),
      hiddenSelectedMuscles: sortMusclesForRender(hiddenSelected, view, state),
    };
  }, [visibleMuscles, view, layer, selectedSet, hoveredMuscle, highlightedSet, disabledSet]);

  const sortedMuscles = useMemo(
    () => [
      ...ghostMuscles.map((muscle) => ({ muscle, isGhost: true })),
      ...activeMuscles.map((muscle) => ({ muscle, isGhost: false })),
      // Selected or highlighted muscles on the hidden layer stay visible as inert ghosts, drawn last so surface muscles do not bury them.
      ...hiddenSelectedMuscles.map((muscle) => ({ muscle, isGhost: true })),
    ],
    [ghostMuscles, activeMuscles, hiddenSelectedMuscles]
  );

  const handlePointerHover = useCallback(
    (muscle: Muscle | null, event: React.PointerEvent) => {
      if (isTouchActive()) return;
      if (muscle) onMuscleHover(muscle, event);
      else onMuscleHover(null);
    },
    [isTouchActive, onMuscleHover],
  );

  return (
    <AnimatePresence mode="wait">
      <motion.svg
        key={view}
        ref={setCanvas}
        viewBox={customViewBox || "0 0 200 440"}
        className="w-full h-full"
        initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: view === 'front' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: view === 'front' ? 20 : -20 }}
        transition={getTimedTransition('slow', reduceMotion)}
        preserveAspectRatio="xMidYMid meet"
        {...touchPreviewHandlers}
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

          {/* Light/shadow overlay used to model muscle form */}
          <linearGradient id="muscle-shade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
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
          className={reduceMotion ? "pointer-events-none" : "pointer-events-none animate-bio-breathe"}
        />

        {/* Background body outline */}
        <BodyOutline view={view} opacity={sculpt.outlineOpacity} />

        {/* Muscle paths */}
        <g className="muscles text-background">
          {sortedMuscles.map(({ muscle, isGhost }, index) => (
            <MusclePath
              key={`${muscle.id}-${view}`}
              muscle={muscle}
              label={view === 'side' ? getSideLabel(muscle.name) : undefined}
              view={view}
              isSelected={selectedSet.has(muscle.id)}
              isHovered={!isGhost && hoveredMuscle === muscle.id}
              isDisabled={disabledSet.has(muscle.id)}
              isGhost={isGhost}
              highlight={highlightMap.get(muscle.id)}
              colorByGroup={colorByGroup}
              accentColor={accentColor}
              animateHighlights={animateHighlights}
              hoverIntensity={hoverIntensity}
              sculpt={sculpt}
              enableTouchInfo={enableTouchInfo && !enableTouchPreview}
              enableTouchPreview={enableTouchPreview}
              longPressMs={longPressMs}
              reduceMotion={reduceMotion}
              highlightIndex={highlightMap.has(muscle.id) ? Array.from(highlightMap.keys()).indexOf(muscle.id) : index}
              onPointerHover={handlePointerHover}
              onClick={onMuscleClick}
              onLongPress={onMuscleLongPress}
            />
          ))}
        </g>
      </motion.svg>
    </AnimatePresence>
  );
};

export default MuscleCanvas;
