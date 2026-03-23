import { AlertTriangle, CheckCircle2, Info, Loader2, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { getTimedTransition } from '@/lib/motion/tokens';

type StateVariant = 'loading' | 'empty' | 'error' | 'success';

interface StateCardAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'gradient';
}

interface StateCardProps {
  variant: StateVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: StateCardAction;
  className?: string;
  compact?: boolean;
}

const DEFAULT_VARIANT_ICON: Record<StateVariant, LucideIcon> = {
  loading: Loader2,
  empty: Info,
  error: AlertTriangle,
  success: CheckCircle2,
};

export function StateCard({
  variant,
  title,
  description,
  icon,
  action,
  className,
  compact = false,
}: StateCardProps) {
  const { shouldReduceMotion } = useMotionPreferences();
  const Icon = icon ?? DEFAULT_VARIANT_ICON[variant];
  const isLoading = variant === 'loading';

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getTimedTransition('base', shouldReduceMotion)}
      className={cn(
        'surface-premium surface-premium-stroke rounded-2xl text-center',
        compact ? 'px-4 py-5' : 'px-6 py-10',
        className
      )}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
          <Icon
            className={cn(
              'h-6 w-6 text-foreground/85',
              isLoading && !shouldReduceMotion && 'animate-spin'
            )}
          />
        </div>
        <h3 className="text-fluid-lg font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-fluid-sm text-muted-foreground max-w-[32rem]">{description}</p>
        ) : null}
        {action ? (
          <Button
            onClick={action.onClick}
            variant={action.variant ?? 'outline'}
            className="mt-2 min-h-[44px]"
            data-click-feedback="off"
            data-interaction-feedback="explicit"
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
