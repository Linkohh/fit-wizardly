"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const barHeight = strokeWidth;
  const gap = 6; // Gap between bars when closed

  // Spring configuration for smooth, bouncy animation
  const springConfig = {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  };

  // Calculate positions
  const centerY = size / 2;
  const topBarY = centerY - gap;
  const bottomBarY = centerY + gap;

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
        }}
        variants={{
          closed: {
            top: topBarY - barHeight / 2,
            rotate: 0,
          },
          open: {
            top: centerY - barHeight / 2,
            rotate: 45,
          },
        }}
        transition={springConfig}
      />

      {/* Middle bar - fades out and scales to 0 */}
      <motion.span
        className="absolute bg-current rounded-full"
        style={{
          width: size * 0.75,
          height: barHeight,
          left: size * 0.125,
          top: centerY - barHeight / 2,
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
          ...springConfig,
          opacity: { duration: 0.15 },
        }}
      />

      {/* Bottom bar - rotates -45deg and moves to center */}
      <motion.span
        className="absolute bg-current rounded-full"
        style={{
          width: size * 0.75,
          height: barHeight,
          left: size * 0.125,
        }}
        variants={{
          closed: {
            top: bottomBarY - barHeight / 2,
            rotate: 0,
          },
          open: {
            top: centerY - barHeight / 2,
            rotate: -45,
          },
        }}
        transition={springConfig}
      />
    </motion.div>
  );
}

export default AnimatedMenuIcon;
