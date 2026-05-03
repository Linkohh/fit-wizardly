"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";

interface AnimatedMenuIconProps {
  isOpen: boolean;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Premium animated hamburger menu icon that morphs to X when opened.
 * Uses spring physics for smooth, natural-feeling animations.
 */
export function AnimatedMenuIcon({
  isOpen,
  className,
  size = 24,
  strokeWidth = 2,
}: AnimatedMenuIconProps) {
  const { shouldReduceMotion } = useMotionPreferences();
  const barHeight = strokeWidth;
  const gap = 6; // Gap between bars when closed

  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 360,
        damping: 28,
        mass: 0.8,
      };

  // Calculate positions
  const centerY = size / 2;
  const barCenterTop = centerY - barHeight / 2;
  const barOffset = gap;

  return (
    <motion.div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      initial={false}
      animate={isOpen ? "open" : "closed"}
    >
      {/* Top bar - rotates 45deg and moves to center */}
      <motion.span
        className="absolute bg-current rounded-full"
        style={{
          width: size * 0.75,
          height: barHeight,
          left: size * 0.125,
          top: barCenterTop,
        }}
        variants={{
          closed: {
            y: -barOffset,
            rotate: 0,
          },
          open: {
            y: 0,
            rotate: 45,
          },
        }}
        transition={motionTransition}
      />

      {/* Middle bar - fades out and scales to 0 */}
      <motion.span
        className="absolute bg-current rounded-full"
        style={{
          width: size * 0.75,
          height: barHeight,
          left: size * 0.125,
          top: barCenterTop,
        }}
        variants={{
          closed: {
            opacity: 1,
            scaleX: 1,
          },
          open: {
            opacity: 0,
            scaleX: 0,
          },
        }}
        transition={{
          ...motionTransition,
          opacity: { duration: shouldReduceMotion ? 0 : 0.12 },
        }}
      />

      {/* Bottom bar - rotates -45deg and moves to center */}
      <motion.span
        className="absolute bg-current rounded-full"
        style={{
          width: size * 0.75,
          height: barHeight,
          left: size * 0.125,
          top: barCenterTop,
        }}
        variants={{
          closed: {
            y: barOffset,
            rotate: 0,
          },
          open: {
            y: 0,
            rotate: -45,
          },
        }}
        transition={motionTransition}
      />
    </motion.div>
  );
}

export default AnimatedMenuIcon;
