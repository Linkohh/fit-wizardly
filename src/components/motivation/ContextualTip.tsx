import { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextualTipProps {
  context: 'goal' | 'equipment' | 'anatomy' | 'constraints' | 'schedule' | 'review' | 'plan';
  className?: string;
  dismissible?: boolean;
}

const tips: Record<string, string[]> = {
  goal: [
    "Pro tip: Strength training with 3-5 reps builds power, while 8-12 reps optimizes muscle growth.",
    "For general fitness, a mix of compound movements and cardio works best.",
    "Hypertrophy training focuses on time under tension and moderate weights.",
  ],
  equipment: [
    "Bodyweight exercises can be just as effective as weighted ones with proper progression.",
    "Dumbbells offer the most versatility for home workouts.",
    "Cable machines provide constant tension throughout the movement.",
  ],
  anatomy: [
    "Focus on muscle groups you want to prioritize, but don't neglect balance.",
    "Training opposing muscle groups together can save time and improve balance.",
    "Your posterior chain (back, glutes, hamstrings) is often undertrained.",
  ],
  constraints: [
    "Modifications exist for almost every exercise - work around your limitations.",
    "Listening to your body prevents injuries and ensures long-term progress.",
    "Many exercises can be adapted to accommodate injuries or limitations.",
  ],
  schedule: [
    "Rest days are when muscles grow - don't skip them!",
    "3-4 days per week is optimal for most people to see consistent progress.",
    "Quality over quantity - focused sessions beat long, unfocused ones.",
  ],
  review: [
    "Progressive overload is key - gradually increase weight, reps, or sets.",
    "Track your workouts to measure progress over time.",
    "Consistency beats perfection - stick to the plan!",
  ],
  plan: [
    "Warm up for 5-10 minutes before each session to prevent injuries.",
    "Focus on form before adding weight - quality reps build muscle safely.",
    "Stay hydrated and fuel your body with proper nutrition.",
  ],
};

export function ContextualTip({ context, className, dismissible = true }: ContextualTipProps) {
  const [visible, setVisible] = useState(true);
  const [currentTip, setCurrentTip] = useState('');

  useEffect(() => {
    const contextTips = tips[context] || tips.goal;
    setCurrentTip(contextTips[Math.floor(Math.random() * contextTips.length)]);
    setVisible(true);
  }, [context]);

  if (!visible) return null;

  return (
    <div className={cn(
      'relative flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10',
      'animate-fade-in',
      className
    )}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium">Pro Tip</p>
        <p className="text-sm text-muted-foreground">{currentTip}</p>
      </div>
      {dismissible && (
        <button 
          onClick={() => setVisible(false)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
