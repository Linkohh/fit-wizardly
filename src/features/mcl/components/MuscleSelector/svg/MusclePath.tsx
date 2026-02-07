import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Muscle, ViewType, MuscleHighlight } from '../../../types';
import { getMuscleGroupColor } from '../../../data/muscleGroups';

interface MusclePathProps {
  muscle: Muscle;
  view: ViewType;
  isSelected: boolean;
  isHovered: boolean;
  isDisabled: boolean;
  highlight?: MuscleHighlight;
  colorByGroup: boolean;
  accentColor: string;
  animateHighlights?: boolean;
  hoverIntensity?: 'default' | 'strong';
  highlightIndex?: number;
  onMouseEnter: (muscle: Muscle, event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (muscle: Muscle) => void;
}

// Color mapping for highlight types
const highlightColors: Record<MuscleHighlight['type'], { fill: string; glow: string }> = {
  fatigue: { fill: '#EF4444', glow: 'rgba(239, 68, 68, 0.5)' },
  recovered: { fill: '#22C55E', glow: 'rgba(34, 197, 94, 0.5)' },
  injury: { fill: '#F59E0B', glow: 'rgba(245, 158, 11, 0.5)' },
  focus: { fill: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.5)' },
};

export const MusclePath: React.FC<MusclePathProps> = ({
  muscle,
  view,
  isSelected,
  isHovered,
  isDisabled,
  highlight,
  colorByGroup,
  accentColor,
  animateHighlights = false,
  hoverIntensity = 'default',
  highlightIndex = 0,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const pathData = muscle.paths[view];

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
    if (isDisabled) return 0.15;
    if (highlight) {
      const baseOpacity = highlight.intensity / 100;
      return Math.max(0.5, Math.min(1, baseOpacity * 0.5 + 0.5));
    }
    if (isSelected) return 1;
    if (isHovered) return hoverIntensity === 'strong' ? 1 : 0.95;
    // Improved unselected visibility
    return hoverIntensity === 'strong' ? 0.2 : 0.25;
  }, [isSelected, isHovered, isDisabled, highlight, hoverIntensity]);

  // Enhanced multi-layer glow effect for premium appearance
  const glowFilter = useMemo(() => {
    if (isDisabled) return 'none';

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
  }, [isSelected, isHovered, isDisabled, highlight, glowColor, hoverIntensity]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (!isDisabled) {
        onMouseEnter(muscle, e);
      }
    },
    [muscle, onMouseEnter, isDisabled]
  );

  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick(muscle);
    }
  }, [muscle, onClick, isDisabled]);

  // Determine if this muscle should have the pulse animation
  const shouldPulse = useMemo(() => {
    if (isDisabled) return false;
    if (isSelected) return true;
    if (animateHighlights && highlight && highlight.intensity > 50) return true;
    return false;
  }, [isDisabled, isSelected, animateHighlights, highlight]);

  // Calculate animation delay for staggered effect
  const animationDelay = useMemo(() => {
    if (!shouldPulse || !animateHighlights) return undefined;
    return `${highlightIndex * 0.15}s`;
  }, [shouldPulse, animateHighlights, highlightIndex]);

  if (!pathData) return null;

  return (
    <motion.path
      d={pathData}
      className={`muscle-path ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${shouldPulse ? 'muscle-pulse' : ''}`}
      style={{
        transformOrigin: 'center',
        pointerEvents: 'visibleFill',
        ...(animationDelay ? { animationDelay } : {}),
      }}
      fill={fillColor}
      stroke={isSelected || isHovered ? glowColor : 'transparent'}
      strokeWidth={isSelected ? 1.5 : isHovered ? (hoverIntensity === 'strong' ? 2.25 : 1) : 0}
      initial={{ opacity: 0.25 }}
      animate={{
        opacity,
        scale: isSelected ? 1.01 : 1,
        filter: glowFilter,
      }}
      transition={{
        duration: 0.22,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smoothness
        scale: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      role="button"
      aria-label={`${muscle.name}${isDisabled ? ' (disabled)' : ''}${highlight ? ` - ${highlight.label || highlight.type}` : ''}`}
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
  );
};

export default MusclePath;
