import React from 'react';
import { REGION_CHIPS } from '../../../data/taxonomy';

interface RegionChipsProps {
  activeRegionId: string | null;
  onToggle: (regionId: string) => void;
}

/** Body-region shortcuts. A chip lights up every muscle in that region. */
export const RegionChips: React.FC<RegionChipsProps> = ({ activeRegionId, onToggle }) => (
  <div
    data-testid="region-chips"
    role="group"
    aria-label="Body regions"
    className="flex w-full gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    {REGION_CHIPS.map((chip) => {
      const isActive = chip.id === activeRegionId;
      return (
        <button
          key={chip.id}
          type="button"
          aria-label={`${chip.label} region`}
          aria-pressed={isActive}
          onClick={() => onToggle(chip.id)}
          className={`
            shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
            ${isActive
              ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
              : 'bg-muted/30 dark:bg-white/5 text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10 hover:text-foreground'
            }
          `}
        >
          {chip.label}
        </button>
      );
    })}
  </div>
);

export default RegionChips;
