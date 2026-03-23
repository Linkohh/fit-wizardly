import type { ReactNode } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';

interface SelectedMusclesSheetProps {
  open: boolean;
  selectedCount: number;
  activeSnapPoint: number | string | null;
  onOpenChange: (open: boolean) => void;
  onActiveSnapPointChange: (value: number | string | null) => void;
  onTriggerOpen?: () => void;
  onSnapPointChange?: () => void;
  children: ReactNode;
}

const SNAP_POINTS: Array<number | string> = [0.22, 0.5, 0.88];

export function SelectedMusclesSheet({
  open,
  selectedCount,
  activeSnapPoint,
  onOpenChange,
  onActiveSnapPointChange,
  onTriggerOpen,
  onSnapPointChange,
  children,
}: SelectedMusclesSheetProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          onActiveSnapPointChange(SNAP_POINTS[0]);
          onOpenChange(true);
          onTriggerOpen?.();
        }}
        data-testid="muscle-selector-sheet-trigger"
        data-click-feedback="off"
        data-interaction-feedback="explicit"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] z-40 min-h-[44px] px-4 py-2.5 rounded-full surface-premium-strong surface-premium-stroke text-fluid-sm font-semibold text-foreground tabular-nums shadow-[var(--elevation-floating)] transition-colors hover:bg-muted/50 dark:hover:bg-white/15"
      >
        Selected ({selectedCount})
      </button>

      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={(value) => {
          onActiveSnapPointChange(value);
          onSnapPointChange?.();
        }}
        shouldScaleBackground
      >
        <DrawerContent
          data-testid="muscle-selector-selection-sheet"
          className="max-h-[88dvh] border-border/30 dark:border-white/10 bg-background/95 dark:bg-[#0b0714]/95 text-foreground backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
        >
          <DrawerTitle className="sr-only">Selected muscles</DrawerTitle>
          {children}
        </DrawerContent>
      </Drawer>
    </>
  );
}
