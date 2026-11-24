import React from 'react';
import { LabelledSlider } from '@/components/a11y/LabelledSlider';

interface SculptSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const LABEL = 'Muscle definition';

export const SculptSlider: React.FC<SculptSliderProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-2 p-1.5 md:p-2 surface-premium rounded-xl surface-premium-stroke">
    <span className="text-fluid-sm font-semibold text-muted-foreground" aria-hidden="true">
      Sculpt
    </span>
    {/* LabelledSlider names the thumb and gives it a 44 px hit area (DEBT-020). */}
    <LabelledSlider
      className="w-28"
      min={0}
      max={100}
      step={5}
      value={[value]}
      onValueChange={(v) => onChange(v[0] ?? value)}
      thumbLabel={LABEL}
      thumbValueText={`${value}%`}
    />
  </div>
);

export default SculptSlider;
