import { cn } from '@/lib/utils';

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
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={sizeValue} height={sizeValue} className="transform -rotate-90">
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
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-primary transition-all duration-500 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: 'url(#progressGradient)',
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-foreground', fontSize)}>
            {Math.round(progress)}%
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
