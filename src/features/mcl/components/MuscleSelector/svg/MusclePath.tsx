import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Muscle, ViewType, MuscleHighlight } from '../../../types';
import { getMuscleGroupColor } from '../../../data/muscleGroups';
import { getGhostOpacity, getMuscleOpacity, type SculptStyle } from '../../../lib/sculpt';
import { getSpringTransition, getTimedTransition } from '@/lib/motion/tokens';

interface MusclePathProps {
  muscle: Muscle;
  /** Accessible name override; defaults to `muscle.name`. */
  label?: string;
  view: ViewType;
  isSelected: boolean;
  isHovered: boolean;
  isDisabled: boolean;
  /** Receded layer: drawn faint and fully non-interactive. */
  isGhost?: boolean;
  highlight?: MuscleHighlight;
  colorByGroup: boolean;
  accentColor: string;
  animateHighlights?: boolean;
  hoverIntensity?: 'default' | 'strong';
  sculpt: SculptStyle;
  highlightIndex?: number;
  enableTouchInfo?: boolean;
  enableTouchPreview?: boolean;
  longPressMs?: number;
  reduceMotion?: boolean;
  onPointerHover?: (muscle: Muscle | null, event: React.PointerEvent<SVGPathElement>) => void;
  onClick: (muscle: Muscle) => void;
  onLongPress?: (muscle: Muscle) => void;
}

// The receded layer is drawn in neutral grey, so colour always means "this is the layer you can pick from".
const GHOST_FILL = '#9CA3AF';

// Color mapping for highlight types
const highlightColors: Record<MuscleHighlight['type'], { fill: string; glow: string }> = {
  fatigue: { fill: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)' },
  recovered: { fill: '#22C55E', glow: 'rgba(34, 197, 94, 0.5)' },
  injury: { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)' },
  focus: { fill: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.5)' },
};

export const MusclePath: React.FC<MusclePathProps> = ({
  muscle,
  label,
  view,
  isSelected,
  isHovered,
  isDisabled,
  isGhost = false,
  highlight,
  colorByGroup,
  accentColor,
  animateHighlights = false,
  hoverIntensity = 'default',
  sculpt,
  highlightIndex = 0,
  enableTouchInfo = false,
  enableTouchPreview = false,
  longPressMs = 380,
  reduceMotion = false,
  onPointerHover,
  onClick,
  onLongPress,
}) => {
  const pathData = muscle.paths[view];
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMoveTolerance = 10;
  const canPreviewTouch = enableTouchPreview && !isDisabled && !isGhost;

  const groupColor = getMuscleGroupColor(muscle.group);

  // Determine the fill color based on state (with gradient support for selected/hovered)
  const fillColor = useMemo(() => {
    if (isDisabled) return '#6B7280';

    if (highlight) {
      return highlightColors[highlight.type].fill;
    }

    if (isSelected || isHovered) {
      // Use gradient reference for premium appearance
      return `url(#gradient-${muscle.group})`;
    }

    // Subtle tint for unselected muscles based on group color
    return colorByGroup ? groupColor : '#9CA3AF';
  }, [isSelected, isHovered, isDisabled, highlight, colorByGroup, groupColor, muscle.group]);

  // Get the actual color value (not gradient reference) for glow effects
  const glowColor = useMemo(() => {
    if (highlight) return highlightColors[highlight.type].fill;
    return colorByGroup ? groupColor : accentColor;
  }, [highlight, colorByGroup, groupColor, accentColor]);

  // Determine opacity based on state - improved unselected visibility
  const opacity = useMemo(() => {
    // A ghost that is selected or highlighted stays readable on the other layer.
    if (isGhost) return getGhostOpacity(isSelected || Boolean(highlight), sculpt);
    if (isDisabled) return 0.15;
    if (highlight) {
      const baseOpacity = highlight.intensity / 100;
      return Math.max(0.5, Math.min(1, baseOpacity * 0.5 + 0.5));
    }
    return getMuscleOpacity({ isSelected, isHovered, isDisabled }, sculpt, hoverIntensity);
  }, [isGhost, isSelected, isHovered, isDisabled, highlight, hoverIntensity, sculpt]);

  const isResting = !isGhost && !isSelected && !isHovered && !isDisabled && !highlight;
  const scale = isGhost ? 1 : isHovered && !isDisabled ? (hoverIntensity === 'strong' ? 1.07 : 1.03) : isSelected ? 1.01 : 1;
  const transition = reduceMotion
    ? { duration: 0 }
    : {
        ...getTimedTransition('base', reduceMotion),
        scale: getSpringTransition('snappy', reduceMotion),
      };

  // Enhanced multi-layer glow effect for premium appearance
  const glowFilter = useMemo(() => {
    if (isGhost || isDisabled) return 'none';

    if (highlight && highlight.intensity > 50) {
      const intensity = highlight.intensity / 100;
      return `drop-shadow(0 0 ${4 * intensity}px ${highlightColors[highlight.type].glow}) drop-shadow(0 0 ${12 * intensity}px ${highlightColors[highlight.type].glow})`;
    }

    if (isSelected) {
      // Multi-layer glow for selected - premium effect
      return `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 20px ${glowColor}80)`;
    }

    if (isHovered) {
      if (hoverIntensity === 'strong') {
        return `drop-shadow(0 0 9px ${glowColor}) drop-shadow(0 0 18px ${glowColor}90) drop-shadow(0 0 30px ${glowColor}60)`;
      }
      return `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor}60)`;
    }

    return 'none';
  }, [isGhost, isSelected, isHovered, isDisabled, highlight, glowColor, hoverIntensity]);

  const handlePointerHover = (event: React.PointerEvent<SVGPathElement>) => {
    if (isDisabled || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
    onPointerHover?.(event.type === 'pointerenter' ? muscle : null, event);
  };

  const handleClick = useCallback(() => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    if (!isDisabled) {
      onClick(muscle);
    }
  }, [muscle, onClick, isDisabled]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGPathElement>) => {
      if (!enableTouchInfo || event.pointerType !== 'touch' || isDisabled) {
        return;
      }

      longPressTriggeredRef.current = false;
      touchStartRef.current = { x: event.clientX, y: event.clientY };
      clearLongPressTimer();

      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPress?.(muscle);
      }, longPressMs);
    },
    [enableTouchInfo, isDisabled, clearLongPressTimer, onLongPress, muscle, longPressMs]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGPathElement>) => {
      if (!enableTouchInfo || event.pointerType !== 'touch' || !touchStartRef.current) {
        return;
      }

      const dx = event.clientX - touchStartRef.current.x;
      const dy = event.clientY - touchStartRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > touchMoveTolerance) {
        clearLongPressTimer();
      }
    },
    [enableTouchInfo, clearLongPressTimer]
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<SVGPathElement>) => {
      if (event.pointerType === 'touch') {
        touchStartRef.current = null;
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer]
  );

  // Determine if this muscle should have the pulse animation
  const shouldPulse = useMemo(() => {
    if (reduceMotion) return false;
    if (isGhost || isDisabled) return false;
    if (isSelected) return true;
    if (animateHighlights && highlight && highlight.intensity > 50) return true;
    return false;
  }, [reduceMotion, isGhost, isDisabled, isSelected, animateHighlights, highlight]);

  // Calculate animation delay for staggered effect
  const animationDelay = useMemo(() => {
    if (!shouldPulse || !animateHighlights) return undefined;
    return `${highlightIndex * 0.15}s`;
  }, [shouldPulse, animateHighlights, highlightIndex]);

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [clearLongPressTimer]
  );

  if (!pathData) return null;

  if (isGhost) {
    // Receded layer: no events, focus, roles or glow. A selected ghost keeps its stroke,
    // and a highlighted one (search or region match on the other layer) takes the highlight colour.
    const ghostHighlightColor = !isSelected && highlight ? highlightColors[highlight.type].fill : null;
    return (
      <motion.path
        d={pathData}
        className="muscle-path"
        style={{ transformOrigin: 'center', pointerEvents: 'none', cursor: 'default' }}
        fill={isSelected ? `url(#gradient-${muscle.group})` : ghostHighlightColor ?? GHOST_FILL}
        stroke={isSelected ? glowColor : ghostHighlightColor ?? 'transparent'}
        strokeWidth={isSelected ? 1.5 : ghostHighlightColor ? 1 : 0}
        data-ghost-highlight={ghostHighlightColor ? 'true' : undefined}
        initial={false}
        animate={{ opacity, scale: 1, filter: 'none' }}
        transition={transition}
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

  return (
    <>
      <motion.path
        d={pathData}
        className={`muscle-path ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${shouldPulse ? 'muscle-pulse' : ''}`}
        style={{
          transformOrigin: 'center',
          ...(animationDelay ? { animationDelay } : {}),
          ...(canPreviewTouch ? { touchAction: 'none', WebkitTouchCallout: 'none' } : {}),
        }}
        fill={fillColor}
        stroke={isSelected || isHovered ? glowColor : isResting ? 'currentColor' : 'transparent'}
        strokeWidth={isSelected ? 1.5 : isHovered ? (hoverIntensity === 'strong' ? 2.25 : 1) : isResting ? 0.6 : 0}
        strokeOpacity={isResting ? sculpt.edgeOpacity : undefined}
        initial={{ opacity: 0.25 }}
        animate={{
          opacity,
          scale,
          filter: glowFilter,
        }}
        transition={transition}
        onPointerEnter={handlePointerHover}
        onPointerLeave={handlePointerHover}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        data-click-feedback="off"
        data-interaction-feedback="explicit"
        data-touch-preview-muscle={canPreviewTouch ? muscle.id : undefined}
        role="button"
        aria-label={`${label ?? muscle.name}${isDisabled ? ' (disabled)' : ''}${highlight ? ` - ${highlight.label || highlight.type}` : ''}`}
        aria-pressed={isSelected}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
            e.preventDefault();
            handleClick();
          }
        }}
      />
      {isResting && sculpt.shadingOpacity > 0 && (
        <motion.path
          d={pathData}
          fill="url(#muscle-shade)"
          pointerEvents="none"
          aria-hidden="true"
          style={{ transformOrigin: 'center' }}
          initial={false}
          animate={{ opacity: sculpt.shadingOpacity * 0.35, scale }}
          transition={transition}
        />
      )}
    </>
  );
};

export default MusclePath;
