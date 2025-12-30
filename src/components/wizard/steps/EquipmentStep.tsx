import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '@/stores/wizardStore';
import { EQUIPMENT_OPTIONS, EQUIPMENT_PRESETS } from '@/types/fitness';
import type { Equipment } from '@/types/fitness';
import { cn } from '@/lib/utils';

export function EquipmentStep() {
  const { selections, toggleEquipment, setEquipment } = useWizardStore();

  const applyPreset = (preset: Equipment[]) => {
    setEquipment(preset);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">What equipment do you have?</h2>
        <p className="text-muted-foreground mt-1">Select all available equipment for exercise options</p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Quick presets:</p>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.equipment)}
              className={cn(
                "touch-target",
                JSON.stringify(selections.equipment.sort()) === JSON.stringify(preset.equipment.sort())
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
      >
        {EQUIPMENT_OPTIONS.map((item) => {
          const isSelected = selections.equipment.includes(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => toggleEquipment(item.id)}
              className="touch-target focus:outline-none"
              aria-pressed={isSelected}
              aria-label={`${item.name}${isSelected ? ' (selected)' : ''}`}
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
                  {isSelected && (
                    <div 
                      className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <p className="text-center text-sm text-muted-foreground">
        {selections.equipment.length} equipment option{selections.equipment.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
