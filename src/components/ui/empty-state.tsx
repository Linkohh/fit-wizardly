import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'gradient' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16 px-4 animate-fade-in", className)}>
      {/* Glowing gradient icon circle */}
      <div className="mx-auto w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-8 shadow-glow animate-float">
        <Icon className="h-12 w-12 text-primary-foreground drop-shadow-lg" strokeWidth={2.5} />
      </div>

      {/* Title with gradient text */}
      <h3 className="text-2xl font-bold mb-3 gradient-text">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-base leading-relaxed">
        {description}
      </p>

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant || 'gradient'}
              onClick={action.onClick}
              size="lg"
              className="flex-1 sm:flex-initial shadow-glow-pink hover:shadow-glow-pink/80 transition-all duration-300"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
