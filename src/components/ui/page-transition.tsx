import { motion, useReducedMotion, Transition } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useNavigationDirection } from "@/contexts/navigation-direction-context";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const entryTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

const exitTransition: Transition = {
  duration: 0.18,
  ease: [0.4, 0, 1, 1],
};

const pageVariants = {
  enter: (dir: string) => ({
    x: dir === "forward" ? 28 : dir === "backward" ? -28 : 0,
    opacity: 0,
    scale: 0.97,
  }),
  center: () => ({
    x: 0,
    opacity: 1,
    scale: 1,
    transition: entryTransition,
  }),
  exit: (dir: string) => ({
    x: dir === "forward" ? -16 : dir === "backward" ? 16 : 0,
    opacity: 0,
    scale: 0.97,
    transition: exitTransition,
  }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const direction = useNavigationDirection();
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      custom={direction}
      variants={prefersReduced ? reducedVariants : pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      onAnimationStart={() => {
        if (!prefersReduced) {
          document.documentElement.style.overflowX = "hidden";
        }
      }}
      onAnimationComplete={() => {
        document.documentElement.style.overflowX = "";
      }}
      className={cn("w-full h-full", className)}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedIcon({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex icon-hover transition-all duration-200",
        className
      )}
    >
      {children}
    </span>
  );
}

export function GradientBorder({
  children,
  className,
  animated = true,
}: {
  children: ReactNode;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative p-[2px] rounded-xl overflow-hidden group",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300",
          animated && "animate-gradient"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(262 83% 66%), hsl(330 81% 60%), hsl(270 91% 75%), hsl(262 83% 66%))",
          backgroundSize: "300% 300%",
        }}
      />
      <div className="relative bg-card rounded-[10px]">
        {children}
      </div>
    </div>
  );
}

export function FloatingElement({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("animate-float", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function GlowPulse({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-glow-pulse rounded-full", className)}>
      {children}
    </div>
  );
}
