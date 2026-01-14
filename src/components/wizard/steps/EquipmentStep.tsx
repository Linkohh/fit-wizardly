import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { EQUIPMENT_OPTIONS, EQUIPMENT_PRESETS } from '@/types/fitness';
import type { Equipment } from '@/types/fitness';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardForm, equipmentStepSchema } from '@/hooks/useWizardForm';
import { FormError } from '@/components/ui/form-error';

export function EquipmentStep() {
  const { selections, setEquipment } = useWizardStore();

  // React Hook Form integration with Zustand sync
  const { watch, setValue, formState: { errors }, trigger } = useWizardForm({
    schema: equipmentStepSchema,
    defaultValues: {
      equipment: selections.equipment as string[],
    },
    onSync: (values) => {
      if (values.equipment !== undefined) setEquipment(values.equipment as Equipment[]);
    },
  });

  // Watch equipment for reactive updates
  const watchedEquipment = watch('equipment') || [];

  // Toggle equipment selection
  const toggleEquipment = (id: Equipment) => {
    const current = watchedEquipment;
    const newEquipment = current.includes(id)
      ? current.filter((e) => e !== id)
      : [...current, id];
    setValue('equipment', newEquipment);
    trigger('equipment'); // Trigger validation after change
  };

  const applyPreset = (preset: Equipment[]) => {
    setValue('equipment', preset);
    trigger('equipment');
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">What equipment do you have?</h2>
        <p className="text-muted-foreground mt-1">Select all available equipment for exercise options</p>
      </div>

      {/* Presets and Clear */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Quick presets:</p>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {watchedEquipment.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setValue('equipment', []);
                    trigger('equipment');
                  }}
                  className="touch-target border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {EQUIPMENT_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.equipment)}
              className={cn(
                "touch-target",
                JSON.stringify([...watchedEquipment].sort()) === JSON.stringify([...preset.equipment].sort())
                  ? "border-primary bg-primary/10 text-primary"
                  : ""
              )}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="group"
        aria-label="Equipment selection"
        aria-describedby={errors.equipment ? "equipment-error" : undefined}
      >
        {EQUIPMENT_OPTIONS.map((item) => {
          const isSelected = watchedEquipment.includes(item.id);

          return (
            <motion.button
              key={item.id}
              onClick={() => toggleEquipment(item.id)}
              className="touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
              aria-pressed={isSelected}
              aria-label={`${item.name}${isSelected ? ' (selected)' : ''}`}
              whileTap={{ scale: 0.97 }}
            >
              <Card
                className={cn(
                  "relative h-full transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <span className="text-3xl" role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {item.name}
                  </span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Validation error */}
      <FormError error={errors.equipment?.message} />

      {/* Selection count */}
      <p className="text-center text-sm text-muted-foreground">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={watchedEquipment.length}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {watchedEquipment.length}
          </motion.span>
        </AnimatePresence>
        {' '}equipment option{watchedEquipment.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
