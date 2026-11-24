import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

type LabelledSliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'aria-label' | 'aria-valuetext'
> & {
  /** Accessible name for the thumb (the element with role="slider"). */
  thumbLabel: string;
  /** Spoken value, e.g. "Moderate" instead of "3". */
  thumbValueText?: string;
};

/**
 * Single-thumb slider that looks like the shadcn `Slider`, but puts the
 * accessible name on the Radix thumb. The shadcn wrapper in
 * `src/components/ui/slider.tsx` (which we never edit) only takes
 * `aria-label` on the root, so screen readers announce an unnamed slider.
 *
 * The thumb stays 20 px visually; an invisible `::after` layer grows its hit
 * area to 44 x 44 px (WCAG 2.5.5), and the root is at least 44 px tall.
 */
export const LabelledSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  LabelledSliderProps
>(({ className, thumbLabel, thumbValueText, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex min-h-[44px] w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={thumbLabel}
      aria-valuetext={thumbValueText}
      data-hit-area="44"
      className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors after:absolute after:-inset-3 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderPrimitive.Root>
));
LabelledSlider.displayName = 'LabelledSlider';

export default LabelledSlider;
