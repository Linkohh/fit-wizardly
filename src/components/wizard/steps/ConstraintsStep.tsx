import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { CONSTRAINT_OPTIONS } from '@/types/fitness';
import type { Constraint } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardForm, constraintsStepSchema } from '@/hooks/useWizardForm';

export function ConstraintsStep() {
  const { selections, setConstraints } = useWizardStore();

  // React Hook Form integration with Zustand sync
  const { watch, setValue, trigger } = useWizardForm({
    schema: constraintsStepSchema,
    defaultValues: {
      constraints: selections.constraints as string[],
    },
    onSync: (values) => {
      if (values.constraints !== undefined) setConstraints(values.constraints as Constraint[]);
    },
  });

  // Watch constraints for reactive updates
  const watchedConstraints = watch('constraints') || [];

  // Toggle constraint selection
  const toggleConstraint = (id: Constraint) => {
    const current = watchedConstraints;
    const newConstraints = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    setValue('constraints', newConstraints);
    trigger('constraints');
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Any limitations or constraints?</h2>
        <p className="text-muted-foreground mt-1">Select any that apply - this is optional</p>
      </div>

      <AnimatePresence>
        {watchedConstraints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-start"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setValue('constraints', []);
                trigger('constraints');
              }}
              className="touch-target border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              Clear selections
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Constraints Grid */}
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Constraint selection"
      >
        {CONSTRAINT_OPTIONS.map((item) => {
          const isSelected = watchedConstraints.includes(item.id);

          return (
            <motion.button
              key={item.id}
              onClick={() => toggleConstraint(item.id)}
              className="touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 rounded-lg text-left"
              aria-pressed={isSelected}
              aria-label={`${item.name}${isSelected ? ' (selected)' : ''}`}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "relative h-full transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-warning ring-2 ring-warning/20 bg-warning/5"
                    : "border-border hover:border-warning/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={cn(
                        "font-semibold",
                        isSelected ? "text-warning" : "text-foreground"
                      )}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          className="shrink-0 h-5 w-5 rounded-full bg-warning flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <Check className="h-3 w-3 text-warning-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Info text */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={watchedConstraints.length === 0 ? 'none' : 'some'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              {watchedConstraints.length === 0
                ? "No constraints selected - all exercises will be available"
                : `${watchedConstraints.length} constraint${watchedConstraints.length !== 1 ? 's' : ''} will be applied to filter exercises`
              }
            </motion.span>
          </AnimatePresence>
        </p>
      </div>
    </div>
  );
}
