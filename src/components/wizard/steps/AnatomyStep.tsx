import { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWizardStore } from '@/stores/wizardStore';
import { useAnatomyStore } from '@/stores/anatomyStore';
import { MUSCLE_DATA } from '@/types/fitness';
import type { MuscleGroup } from '@/types/fitness';
import { cn } from '@/lib/utils';

export function AnatomyStep() {
  const { selections, toggleMuscle } = useWizardStore();
  const { view, toggleView, hoveredMuscle, setHoveredMuscle } = useAnatomyStore();

  const frontMuscles = MUSCLE_DATA.filter(m => m.view === 'front').sort((a, b) => a.displayOrder - b.displayOrder);
  const backMuscles = MUSCLE_DATA.filter(m => m.view === 'back').sort((a, b) => a.displayOrder - b.displayOrder);
  const currentMuscles = view === 'front' ? frontMuscles : backMuscles;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Select target muscles</h2>
        <p className="text-muted-foreground mt-1">Choose the muscle groups you want to train</p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={toggleView} className="gap-2 touch-target">
          <RotateCcw className="h-4 w-4" />
          View {view === 'front' ? 'Back' : 'Front'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* SVG Body */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="relative aspect-[3/4] bg-muted/30 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 200 300" className="w-full h-full max-h-[400px]">
                {/* Simple body outline */}
                <ellipse cx="100" cy="35" rx="25" ry="30" className="fill-muted stroke-border" />
                <rect x="70" y="65" width="60" height="80" rx="10" className="fill-muted stroke-border" />
                <rect x="30" y="70" width="35" height="70" rx="8" className="fill-muted stroke-border" />
                <rect x="135" y="70" width="35" height="70" rx="8" className="fill-muted stroke-border" />
                <rect x="75" y="145" width="22" height="90" rx="8" className="fill-muted stroke-border" />
                <rect x="103" y="145" width="22" height="90" rx="8" className="fill-muted stroke-border" />
                
                {/* Muscle regions - clickable */}
                {view === 'front' ? (
                  <>
                    <ellipse cx="100" cy="95" rx="22" ry="18" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('chest') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('chest')} />
                    <ellipse cx="55" cy="95" rx="12" ry="15" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('front_deltoid') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('front_deltoid')} />
                    <ellipse cx="145" cy="95" rx="12" ry="15" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('side_deltoid') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('side_deltoid')} />
                    <ellipse cx="45" cy="115" rx="8" ry="18" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('biceps') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('biceps')} />
                    <ellipse cx="155" cy="115" rx="8" ry="18" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('biceps') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('biceps')} />
                    <ellipse cx="100" cy="125" rx="18" ry="12" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('abs') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('abs')} />
                    <ellipse cx="86" cy="190" rx="10" ry="35" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('quads') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('quads')} />
                    <ellipse cx="114" cy="190" rx="10" ry="35" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('quads') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('quads')} />
                  </>
                ) : (
                  <>
                    <ellipse cx="100" cy="55" rx="18" ry="10" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('traps') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('traps')} />
                    <ellipse cx="100" cy="95" rx="22" ry="20" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('upper_back') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('upper_back')} />
                    <ellipse cx="80" cy="110" rx="10" ry="18" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('lats') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('lats')} />
                    <ellipse cx="120" cy="110" rx="10" ry="18" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('lats') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('lats')} />
                    <ellipse cx="100" cy="135" rx="15" ry="8" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('lower_back') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('lower_back')} />
                    <ellipse cx="100" cy="155" rx="20" ry="12" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('glutes') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('glutes')} />
                    <ellipse cx="86" cy="195" rx="10" ry="30" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('hamstrings') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('hamstrings')} />
                    <ellipse cx="114" cy="195" rx="10" ry="30" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('hamstrings') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('hamstrings')} />
                    <ellipse cx="86" cy="230" rx="6" ry="12" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('calves') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('calves')} />
                    <ellipse cx="114" cy="230" rx="6" ry="12" 
                      className={cn("cursor-pointer transition-all", selections.targetMuscles.includes('calves') ? "fill-primary" : "fill-muted hover:fill-muted-foreground/20")}
                      onClick={() => toggleMuscle('calves')} />
                  </>
                )}
              </svg>
              <p className="absolute bottom-2 text-xs text-muted-foreground">
                {view === 'front' ? 'Front View' : 'Back View'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Muscle List */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 text-foreground">{view === 'front' ? 'Front' : 'Back'} Muscles</h3>
            <ScrollArea className="h-[350px]">
              <div className="space-y-2 pr-4">
                {currentMuscles.map((muscle) => {
                  const isSelected = selections.targetMuscles.includes(muscle.id);
                  return (
                    <button
                      key={muscle.id}
                      onClick={() => toggleMuscle(muscle.id)}
                      className={cn(
                        "w-full p-3 rounded-lg flex items-center justify-between transition-all touch-target text-left",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      )}
                      aria-pressed={isSelected}
                      aria-label={`Select ${muscle.name}`}
                    >
                      <span className="font-medium">{muscle.name}</span>
                      {isSelected && <Check className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {selections.targetMuscles.length} muscle group{selections.targetMuscles.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
