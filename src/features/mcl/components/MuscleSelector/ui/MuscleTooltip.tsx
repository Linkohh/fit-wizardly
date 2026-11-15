import React, { useLayoutEffect, useRef, useState } from 'react';
import { Muscle } from '../../../types';
import { getMuscleGroupColor, getMuscleGroupName } from '../../../data/muscleGroups';

interface MuscleTooltipProps {
  muscle: Muscle | null;
  /** Display name override (e.g. side view drops the Left/Right suffix). */
  label?: string;
  position: { x: number; y: number };
  visible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  inputType?: 'mouse' | 'touch';
}

const CANVAS_INSET = 8;
const MOUSE_GAP = 10;
const TOUCH_GAP = 24;

function clampToCanvas(offset: number, tooltipSize: number, canvasSize: number): number {
  return Math.max(CANVAS_INSET, Math.min(offset, canvasSize - tooltipSize - CANVAS_INSET));
}

function adjustPosition(
  { x, y }: MuscleTooltipProps['position'],
  canvas: HTMLDivElement,
  tooltip: HTMLDivElement,
  isTouch: boolean,
): MuscleTooltipProps['position'] {
  const { width: canvasWidth, height: canvasHeight } = canvas.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = tooltip;
  const gap = isTouch ? TOUCH_GAP : MOUSE_GAP;

  let left = x + gap;
  if (isTouch) left = x - width / 2;
  else if (left + width > canvasWidth - CANVAS_INSET) left = x - width - gap;

  const above = y - height - gap;
  const below = y + gap;
  const fitsAbove = above >= CANVAS_INSET;
  const fitsBelow = below + height <= canvasHeight - CANVAS_INSET;
  const top = fitsAbove && (isTouch || !fitsBelow) ? above : below;

  return { x: clampToCanvas(left, width, canvasWidth), y: clampToCanvas(top, height, canvasHeight) };
}

export const MuscleTooltip: React.FC<MuscleTooltipProps> = ({
  muscle,
  label,
  position,
  visible,
  containerRef,
  inputType = 'mouse',
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const isTouch = inputType === 'touch';

  useLayoutEffect(() => {
    const canvas = containerRef.current;
    const tooltip = tooltipRef.current;
    if (canvas && tooltip) setAdjustedPosition(adjustPosition(position, canvas, tooltip, isTouch));
  }, [containerRef, position, muscle, label, visible, isTouch]);

  if (!muscle || !visible) return null;
  const groupColor = getMuscleGroupColor(muscle.group);

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`absolute z-50 pointer-events-none w-max break-words rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 ${isTouch ? 'px-3 py-1.5' : 'p-3'}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        maxWidth: `calc(100% - ${CANVAS_INSET * 2}px)`,
      }}
    >
      {!isTouch && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColor }} />
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {getMuscleGroupName(muscle.group)}
          </span>
        </div>
      )}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
        {label ?? muscle.name}
      </h4>
      {!isTouch && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          {muscle.scientificName}
        </p>
      )}
    </div>
  );
};

export default MuscleTooltip;
