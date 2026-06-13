"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X, ChevronRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

type SheetMotionPreset = "default" | "mobileDrawer";
type SheetGestureMode = "none" | "right-edge" | "full-panel";

const INTERACTIVE_GESTURE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "[role='button']",
  "[role='link']",
  "[role='switch']",
  "[data-sheet-gesture-ignore='true']",
].join(",");

const isInteractiveGestureTarget = (target: EventTarget | null, container: HTMLElement) => {
  if (!(target instanceof Element) || target === container) {
    return false;
  }

  return Boolean(target.closest(INTERACTIVE_GESTURE_SELECTOR));
};

// Enhanced overlay with animated blur
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
    enableBlur?: boolean;
    motionPreset?: SheetMotionPreset;
  }
>(({ className, enableBlur = true, motionPreset = "default", ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50",
      enableBlur ? "backdrop-premium" : "bg-black/80",
      motionPreset === "mobileDrawer"
        ? "mobile-drawer-backdrop"
        : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom:
          "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
      motionPreset: {
        default:
          "transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        mobileDrawer: "mobile-drawer-motion will-change-transform",
      },
    },
    compoundVariants: [
      {
        motionPreset: "default",
        side: "top",
        class: "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      },
      {
        motionPreset: "default",
        side: "bottom",
        class: "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      },
      {
        motionPreset: "default",
        side: "left",
        class: "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
      },
      {
        motionPreset: "default",
        side: "right",
        class: "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
    ],
    defaultVariants: {
      side: "right",
      motionPreset: "default",
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
  /** Show the built-in top-right close button */
  showCloseButton?: boolean;
  /** Additional classes for the built-in close button */
  closeButtonClassName?: string;
  /** Motion style for enter/exit animation */
  motionPreset?: SheetMotionPreset;
  /** Accessible dialog title */
  title?: string;
  /** Accessible dialog description */
  description?: string;
  /** Gesture region used for swipe-to-close */
  gestureMode?: SheetGestureMode;
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
  showCloseButton = true,
  closeButtonClassName,
  motionPreset = "default",
  title = "Sheet Content",
  description = "Sheet Description",
  gestureMode = "right-edge",
  ...props
}, ref) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [sheetWidth, setSheetWidth] = React.useState(320);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const isValidSwipeStartRef = React.useRef(false);

  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;

    if (typeof ref === "function") {
      ref(node);
      return;
    }

    if (ref) {
      ref.current = node;
    }
  }, [ref]);

  React.useEffect(() => {
    const node = contentRef.current;

    if (!node) {
      return undefined;
    }

    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      if (nextWidth > 0) {
        setSheetWidth(nextWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const snapThreshold = sheetWidth * 0.35;

  // Handle touch/pointer events for swipe-to-close
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    const node = contentRef.current;
    if (
      !node ||
      !enableGestures ||
      gestureMode === "none" ||
      side !== "right" ||
      isInteractiveGestureTarget(e.target, node)
    ) {
      return;
    }

    const rect = node.getBoundingClientRect();
    // Validate edge start if in right-edge mode (within 45px of the left edge)
    if (gestureMode === "right-edge") {
      const leftEdgeDistance = e.clientX - rect.left;
      if (leftEdgeDistance > 45) {
        return;
      }
    }

    isValidSwipeStartRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    
    // Capture pointer
    if (typeof node.setPointerCapture === "function") {
      node.setPointerCapture(e.pointerId);
    }
  }, [enableGestures, gestureMode, side]);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!enableGestures || !isValidSwipeStartRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    // Check if we meet threshold to start dragging
    if (!isDragging) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal bias verification (ignore vertical scrolls)
      if (!(absX > 10 && absX > absY * 1.6) || side !== "right" || deltaX <= 0) {
        return;
      }

      // Fall through so this move's distance counts toward the drag —
      // a fast flick can coalesce into a single pointermove event.
      setIsDragging(true);
    }

    // Direct drag tracking
    if (side === "right" && deltaX > 0) {
      setDragOffset(Math.min(deltaX, sheetWidth));
    }
  }, [isDragging, enableGestures, side, sheetWidth]);

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    const node = contentRef.current;
    if (!isValidSwipeStartRef.current || !node) return;

    isValidSwipeStartRef.current = false;

    if (typeof node.hasPointerCapture !== "function" || node.hasPointerCapture(e.pointerId)) {
      node.releasePointerCapture?.(e.pointerId);
    }

    if (isDragging) {
      setIsDragging(false);

      const shouldClose = Math.abs(dragOffset) > snapThreshold;

      if (shouldClose && onGestureClose) {
        // Smoothly glide the sheet all the way out, then trigger callback
        setDragOffset(sheetWidth);
        setTimeout(() => {
          onGestureClose();
        }, 220);
      } else {
        // Bounce back using CSS spring curve
        setDragOffset(0);
      }
    }
  }, [isDragging, dragOffset, snapThreshold, onGestureClose, sheetWidth]);

  // Calculate transform based on drag
  const getTransformStyle = (): React.CSSProperties => {
    if (!enableGestures || dragOffset === 0) return {};

    let transition = "none";
    if (!isDragging) {
      const isClosing = Math.abs(dragOffset) >= sheetWidth;
      // Spring elastic snapback curve
      transition = isClosing
        ? "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out"
        : "transform 0.42s cubic-bezier(0.25, 1.4, 0.5, 1), opacity 0.3s ease-out";
    }

    return {
      transform: `translateX(${dragOffset}px)`,
      transition,
    };
  };

  // Calculate opacity based on drag
  const getOpacityStyle = (): React.CSSProperties => {
    if (!enableGestures || dragOffset === 0) return {};

    const opacity = 1 - (Math.abs(dragOffset) / sheetWidth) * 0.4;
    let transition = "none";
    if (!isDragging) {
      const isClosing = Math.abs(dragOffset) >= sheetWidth;
      transition = isClosing
        ? "opacity 0.22s ease-out"
        : "opacity 0.3s ease-out";
    }

    return {
      opacity,
      transition,
    };
  };

  return (
    <SheetPortal>
      <SheetOverlay enableBlur={enableBlur} motionPreset={motionPreset} />
      <SheetPrimitive.Content
        ref={setRefs}
        className={cn(
          sheetVariants({ side, motionPreset }),
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
        <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
        <SheetPrimitive.Description className="sr-only">{description}</SheetPrimitive.Description>

        {/* Dynamic Glow and Chevron Swipe Affordance */}
        {enableGestures && side === "right" && (
          <>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes bounce-right {
                0%, 100% { transform: translateX(0); opacity: 0.45; }
                50% { transform: translateX(5px); opacity: 1; }
              }
              .animate-bounce-right {
                animation: bounce-right 1.2s infinite ease-in-out;
              }
              .glow-edge-shimmer {
                background: linear-gradient(180deg, #bd00ff 0%, #ff83d3 50%, #8ff5ff 100%);
              }
            ` }} />

            {/* Glowing Left Edge Border */}
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-[4px] z-50 transition-all duration-150 rounded-l-[32px]"
              style={{
                background: 'linear-gradient(to bottom, #bd00ff, #ff83d3, #8ff5ff)',
                opacity: isDragging ? 0.95 : 0,
                boxShadow: isDragging
                  ? '0 0 20px 4px rgba(189, 0, 255, 0.65), 0 0 35px 8px rgba(255, 131, 211, 0.45)'
                  : 'none',
                transform: isDragging ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left center',
              }}
            />

            {/* Glowing Chevrons Overlay panel */}
            <div
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-40 bg-gradient-to-r from-purple-950/40 to-transparent pl-3 pr-8 py-4 rounded-r-2xl border-y border-r border-purple-500/20 backdrop-blur-md transition-all duration-300"
              style={{
                opacity: isDragging ? Math.min(dragOffset / 70, 0.95) : 0,
                transform: `translateY(-50%) translateX(${Math.max(0, dragOffset * 0.16 - 16)}px)`,
                boxShadow: '0 8px 32px -8px rgba(189, 0, 255, 0.3)',
              }}
            >
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-[0.22em] text-white">
                <span className="text-[10px] font-bold text-purple-300/90 tracking-[0.25em]">Dismiss</span>
                <div className="flex items-center -space-x-1 ml-0.5">
                  <ChevronRight className="h-4.5 w-4.5 text-purple-400 animate-bounce-right" style={{ animationDelay: '0ms' }} />
                  <ChevronRight className="h-4.5 w-4.5 text-pink-400 animate-bounce-right" style={{ animationDelay: '150ms' }} />
                  <ChevronRight className="h-4.5 w-4.5 text-cyan-400 animate-bounce-right" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Drag Handle Indicator */}
        {showDragHandle && (side === "left" || side === "right") && (
          <div className="drag-handle absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full animate-pulse" />
        )}

        {children}

        {showCloseButton ? (
          <SheetPrimitive.Close
            className={cn(
              "absolute right-4 top-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent bg-transparent text-foreground/55 ring-offset-background transition-all duration-200 hover:bg-muted/35 hover:text-foreground active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none sm:right-5 sm:top-5",
              closeButtonClassName,
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </SheetPrimitive.Close>
        ) : null}
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
