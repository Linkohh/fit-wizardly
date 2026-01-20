"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

// Enhanced overlay with animated blur
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    enableBlur?: boolean;
  }
>(({ className, enableBlur = true, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50",
      enableBlur ? "backdrop-premium" : "bg-black/80",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Enable glass morphism effect */
  glassEffect?: boolean;
  /** Enable swipe-to-close gesture (only for left/right sides) */
  enableGestures?: boolean;
  /** Enable backdrop blur effect */
  enableBlur?: boolean;
  /** Callback when sheet is closed via gesture */
  onGestureClose?: () => void;
  /** Show drag handle indicator */
  showDragHandle?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({
  side = "right",
  className,
  children,
  glassEffect = false,
  enableGestures = false,
  enableBlur = true,
  onGestureClose,
  showDragHandle = false,
  ...props
}, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);

  // Sheet dimensions for calculations
  const SHEET_WIDTH = 288;
  const SNAP_THRESHOLD = SHEET_WIDTH * 0.35;

  // Handle touch/pointer events for swipe-to-close
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (!enableGestures || side !== "right") return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    setIsDragging(true);

    // Capture pointer for tracking outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [enableGestures, side]);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!isDragging || !enableGestures) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = Math.abs(e.clientY - startYRef.current);

    // Only allow horizontal swipe (ignore if vertical movement is greater)
    if (deltaY > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
      return;
    }

    // Only allow swiping in the close direction (right for right-side sheet)
    if (side === "right" && deltaX > 0) {
      setDragOffset(Math.min(deltaX, SHEET_WIDTH));
    } else if (side === "left" && deltaX < 0) {
      setDragOffset(Math.max(deltaX, -SHEET_WIDTH));
    }
  }, [isDragging, enableGestures, side, SHEET_WIDTH]);

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);

    const shouldClose = Math.abs(dragOffset) > SNAP_THRESHOLD;

    if (shouldClose && onGestureClose) {
      onGestureClose();
    }

    // Reset drag offset
    setDragOffset(0);
  }, [isDragging, dragOffset, SNAP_THRESHOLD, onGestureClose]);

  // Calculate transform based on drag
  const getTransformStyle = (): React.CSSProperties => {
    if (!enableGestures || dragOffset === 0) return {};

    return {
      transform: `translateX(${dragOffset}px)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    };
  };

  // Calculate opacity based on drag
  const getOpacityStyle = (): React.CSSProperties => {
    if (!enableGestures || dragOffset === 0) return {};

    const opacity = 1 - (Math.abs(dragOffset) / SHEET_WIDTH) * 0.4;
    return { opacity };
  };

  return (
    <SheetPortal>
      <SheetOverlay enableBlur={enableBlur} />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          sheetVariants({ side }),
          glassEffect && "sheet-glass sheet-inner-glow",
          className
        )}
        style={{
          ...getTransformStyle(),
          ...getOpacityStyle(),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...props}
      >
        {/* Drag Handle Indicator */}
        {showDragHandle && (side === "left" || side === "right") && (
          <div className="drag-handle absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full animate-pulse" />
        )}

        {children}

        {/* Enhanced Close Button */}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-muted/50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
