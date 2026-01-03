import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { CONSTRAINT_OPTIONS } from '@/types/fitness';
import type { Constraint } from '@/types/fitness';
import { cn } from '@/lib/utils';

export function ConstraintsStep() {
  const { selections, toggleConstraint } = useWizardStore();

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Any limitations or constraints?</h2>
        <p className="text-muted-foreground mt-1">Select any that apply - this is optional</p>
      </div>

      {selections.constraints.length > 0 && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => useWizardStore.getState().setConstraints([])}
            className="touch-target border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Clear selections
          </Button>
        </div>
      )}

      {/* Constraints Grid */}
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="group"
        aria-label="Constraint selection"
      >
        {CONSTRAINT_OPTIONS.map((item) => {
          const isSelected = selections.constraints.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleConstraint(item.id)}
              className="touch-target focus:outline-none text-left"
              aria-pressed={isSelected}
              aria-label={`${item.name}${isSelected ? ' (selected)' : ''}`}
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
                    {isSelected && (
                      <div
                        className="shrink-0 h-5 w-5 rounded-full bg-warning flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3 text-warning-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Info text */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          {selections.constraints.length === 0
            ? "No constraints selected - all exercises will be available"
            : `${selections.constraints.length} constraint${selections.constraints.length !== 1 ? 's' : ''} will be applied to filter exercises`
          }
        </p>
      </div>
    </div>
  );
}
