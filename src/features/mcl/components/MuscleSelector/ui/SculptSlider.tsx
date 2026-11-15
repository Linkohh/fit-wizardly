import React, { useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';

interface SculptSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const LABEL = 'Muscle definition';

export const SculptSlider: React.FC<SculptSliderProps> = ({ value, onChange }) => {
  const rootRef = useRef<HTMLSpanElement>(null);

  // The shared shadcn Slider does not forward a label to the Radix thumb
  // (the element with role="slider"), so name it here.
  useEffect(() => {
    rootRef.current?.querySelector('[role="slider"]')?.setAttribute('aria-label', LABEL);
  }, []);

  return (
    <div className="flex items-center gap-2 p-2 surface-premium rounded-xl surface-premium-stroke">
      <span className="text-fluid-sm font-semibold text-muted-foreground" aria-hidden="true">
        Sculpt
      </span>
      <Slider
        ref={rootRef}
        className="w-28"
        min={0}
        max={100}
        step={5}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
        aria-label={LABEL}
      />
    </div>
  );
};

export default SculptSlider;
