import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

const QUOTES = [
  "Every rep counts!",
  "Consistency beats perfection.",
  "Train like a champion.",
  "Your only limit is you.",
  "Progress, not perfection.",
  "Stronger every day.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Champions are made when no one is watching.",
  "Dream big, lift bigger.",
  "Your body can do it, it's your mind you need to convince.",
  "The only bad workout is the one that didn't happen.",
  "Sweat is just fat crying.",
  "Push yourself, because no one else is going to do it for you.",
  "Success starts with self-discipline.",
  "Be stronger than your excuses.",
  "Fall in love with taking care of your body.",
  "Your health is an investment, not an expense.",
  "The difference between try and triumph is a little umph.",
  "Discipline is the bridge between goals and accomplishment.",
  "Train insane or remain the same.",
];

interface MotivationalQuoteProps {
  stepIndex?: number;
}

export function MotivationalQuote({ stepIndex = 0 }: MotivationalQuoteProps) {
  const quote = useMemo(() => {
    // Use step index to select a quote, with some randomness
    const seed = stepIndex + Math.floor(Date.now() / (1000 * 60 * 5)); // Changes every 5 minutes
    return QUOTES[seed % QUOTES.length];
  }, [stepIndex]);

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4">
      <Sparkles className="h-4 w-4 text-secondary" aria-hidden="true" />
      <p className="text-sm italic gradient-text font-medium">
        "{quote}"
      </p>
      <Sparkles className="h-4 w-4 text-secondary" aria-hidden="true" />
    </div>
  );
}
