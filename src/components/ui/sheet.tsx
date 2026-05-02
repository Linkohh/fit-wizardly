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

type SheetMotionPreset = "default" | "mobileDrawer";
type SheetGestureMode = "none" | "right-edge" | "full-panel";

const CLOSE_GESTURE_ACTIVATION_PX = 10;
const CLOSE_GESTURE_EDGE_WIDTH_PX = 32;
const CLOSE_GESTURE_VELOCITY_PX_PER_MS = 0.72;
const MOBILE_DRAWER_CLOSE_MS = 220;
const MOBILE_DRAWER_REBOUND_MS = 260;

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

const getRightCloseOffset = (deltaX: number, sheetWidth: number) =>
  Math.min(Math.max(deltaX, 0), sheetWidth);

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
  motionPreset = "default",
  title = "Sheet Content",
  description = "Sheet Description",
  gestureMode = "right-edge",
  ...props
}, ref) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [sheetWidth, setSheetWidth] = React.useState(320);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const startTimeRef = React.useRef(0);
  const activePointerIdRef = React.useRef<number | null>(null);
  const isTrackingGestureRef = React.useRef(false);
  const isDraggingGestureRef = React.useRef(false);
  const dragOffsetRef = React.useRef(0);
  const resetMotionTimeoutRef = React.useRef<number | null>(null);
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

  const clearResetMotionTimeout = React.useCallback(() => {
    if (resetMotionTimeoutRef.current !== null) {
      window.clearTimeout(resetMotionTimeoutRef.current);
      resetMotionTimeoutRef.current = null;
    }
  }, []);

  const resetGestureState = React.useCallback(() => {
    activePointerIdRef.current = null;
    isTrackingGestureRef.current = false;
    isDraggingGestureRef.current = false;
    dragOffsetRef.current = 0;
  }, []);

  const resetInlineMotion = React.useCallback((delay = 0) => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    clearResetMotionTimeout();
    resetMotionTimeoutRef.current = window.setTimeout(() => {
      node.style.transform = "";
      node.style.opacity = "";
      node.style.transition = "";
      delete node.dataset.gestureDragging;
      resetMotionTimeoutRef.current = null;
    }, delay);
  }, [clearResetMotionTimeout]);

  React.useEffect(() => clearResetMotionTimeout, [clearResetMotionTimeout]);

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

    if (gestureMode === "right-edge") {
      const leftEdgeDistance = e.clientX - node.getBoundingClientRect().left;
      if (leftEdgeDistance > CLOSE_GESTURE_EDGE_WIDTH_PX) {
        return;
      }
    }

    clearResetMotionTimeout();
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = typeof performance === "undefined" ? Date.now() : performance.now();
    activePointerIdRef.current = e.pointerId;
    isTrackingGestureRef.current = true;
    isDraggingGestureRef.current = false;
    dragOffsetRef.current = 0;
  }, [clearResetMotionTimeout, enableGestures, gestureMode, side]);

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    const node = contentRef.current;
    if (
      !node ||
      !enableGestures ||
      !isTrackingGestureRef.current ||
      activePointerIdRef.current !== e.pointerId
    ) {
      return;
    }

    const deltaX = e.clientX - startXRef.current;
    const deltaY = Math.abs(e.clientY - startYRef.current);
    const absDeltaX = Math.abs(deltaX);

    if (!isDraggingGestureRef.current) {
      if (deltaY > absDeltaX && deltaY > CLOSE_GESTURE_ACTIVATION_PX) {
        resetGestureState();
        return;
      }

      if (absDeltaX < CLOSE_GESTURE_ACTIVATION_PX) {
        return;
      }

      if (deltaX <= 0) {
        resetGestureState();
        return;
      }

      isDraggingGestureRef.current = true;
      node.dataset.gestureDragging = "true";
      node.style.transition = "none";
      if (typeof node.setPointerCapture === "function") {
        node.setPointerCapture(e.pointerId);
      }
    }

    const nextOffset = getRightCloseOffset(deltaX, sheetWidth);
    dragOffsetRef.current = nextOffset;
    node.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    node.style.opacity = String(1 - (nextOffset / sheetWidth) * 0.28);
  }, [enableGestures, resetGestureState, sheetWidth]);

  const handlePointerUp = React.useCallback((e: React.PointerEvent) => {
    const node = contentRef.current;
    if (
      !node ||
      !enableGestures ||
      !isTrackingGestureRef.current ||
      activePointerIdRef.current !== e.pointerId
    ) {
      return;
    }

    if (typeof node.hasPointerCapture !== "function" || node.hasPointerCapture(e.pointerId)) {
      node.releasePointerCapture?.(e.pointerId);
    }

    if (!isDraggingGestureRef.current) {
      resetGestureState();
      return;
    }

    const elapsedMs = Math.max(
      (typeof performance === "undefined" ? Date.now() : performance.now()) - startTimeRef.current,
      1,
    );
    const velocity = (e.clientX - startXRef.current) / elapsedMs;
    const shouldClose =
      dragOffsetRef.current > snapThreshold ||
      (dragOffsetRef.current > sheetWidth * 0.18 && velocity > CLOSE_GESTURE_VELOCITY_PX_PER_MS);

    if (shouldClose) {
      node.style.transition = `transform ${MOBILE_DRAWER_CLOSE_MS}ms cubic-bezier(0.32, 0, 0.67, 0), opacity 160ms ease-out`;
      node.style.transform = `translate3d(${sheetWidth}px, 0, 0)`;
      node.style.opacity = "0.72";
      resetGestureState();
      onGestureClose?.();
      return;
    }

    node.style.transition = `transform ${MOBILE_DRAWER_REBOUND_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity 180ms ease-out`;
    node.style.transform = "translate3d(0, 0, 0)";
    node.style.opacity = "";
    resetGestureState();
    resetInlineMotion(MOBILE_DRAWER_REBOUND_MS);
  }, [enableGestures, onGestureClose, resetGestureState, resetInlineMotion, sheetWidth, snapThreshold]);

  const handlePointerCancel = React.useCallback((e: React.PointerEvent) => {
    const node = contentRef.current;
    if (!node || activePointerIdRef.current !== e.pointerId) {
      return;
    }

    node.style.transition = `transform ${MOBILE_DRAWER_REBOUND_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity 180ms ease-out`;
    node.style.transform = "translate3d(0, 0, 0)";
    node.style.opacity = "";
    resetGestureState();
    resetInlineMotion(MOBILE_DRAWER_REBOUND_MS);
  }, [resetGestureState, resetInlineMotion]);

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        {...props}
      >
        <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
        <SheetPrimitive.Description className="sr-only">{description}</SheetPrimitive.Description>
        {/* Drag Handle Indicator */}
        {showDragHandle && (side === "left" || side === "right") && (
          <div className="drag-handle absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full animate-pulse" />
        )}

        {children}

        {showCloseButton ? (
          <SheetPrimitive.Close className="absolute right-4 top-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-transparent bg-transparent text-foreground/55 ring-offset-background transition-all duration-200 hover:bg-muted/35 hover:text-foreground active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none sm:right-5 sm:top-5">
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
