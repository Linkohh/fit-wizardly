import { cn } from '@/lib/utils';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizes = {
  sm: { size: 48, stroke: 4, fontSize: 'text-xs' },
  md: { size: 80, stroke: 6, fontSize: 'text-sm' },
  lg: { size: 120, stroke: 8, fontSize: 'text-lg' },
};

export function ProgressRing({
  progress,
  size = 'md',
  showLabel = true,
  label,
  className
}: ProgressRingProps) {
  const { size: sizeValue, stroke, fontSize } = sizes[size];
  const radius = (sizeValue - stroke) / 2;
  const circumference = radius * 2 * Math.PI;

  // Smooth spring animation for progress
  const springProgress = useSpring(0, {
    stiffness: 50,
    damping: 15,
    mass: 0.5
  });

  // Track if progress increased for pulse effect
  const [prevProgress, setPrevProgress] = useState(progress);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Update spring value when progress changes
  useEffect(() => {
    springProgress.set(progress);

    // Trigger pulse effect if progress increased
    if (progress > prevProgress) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevProgress(progress);
  }, [progress, springProgress, prevProgress]);

  // Transform progress to dashoffset
  const dashoffset = useTransform(
    springProgress,
    [0, 100],
    [circumference, 0]
  );

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <motion.svg
        width={sizeValue}
        height={sizeValue}
        className="transform -rotate-90"
        animate={shouldPulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Background circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashoffset,
            stroke: 'url(#progressGradient)',
          }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            pathLength: { duration: 1.5, ease: "easeOut" }
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      </motion.svg>
      {showLabel && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span className={cn('font-bold text-foreground', fontSize)}>
            {Math.round(progress)}%
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </motion.div>
      )}
    </div>
  );
}
