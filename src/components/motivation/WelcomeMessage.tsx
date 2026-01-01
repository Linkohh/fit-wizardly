import { useEffect, useState } from 'react';
import { Sparkles, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { useAchievementStore } from '@/stores/achievementStore';
import { cn } from '@/lib/utils';

interface WelcomeMessageProps {
  className?: string;
}

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const getGreeting = (timeOfDay: string, userName: string) => {
  const name = userName || 'Champion';
  
  const greetings = {
    morning: [
      `Good morning, ${name}! Ready to crush it?`,
      `Rise and grind, ${name}! 💪`,
      `Morning, ${name}! Let's make today count.`,
    ],
    afternoon: [
      `Hey ${name}! Keep the momentum going!`,
      `Afternoon, ${name}! Time to get stronger.`,
      `Good afternoon, ${name}! You're doing great!`,
    ],
    evening: [
      `Evening, ${name}! Finish strong today!`,
      `Hey ${name}! Perfect time to plan tomorrow.`,
      `Good evening, ${name}! You've got this!`,
    ],
    night: [
      `Burning the midnight oil, ${name}?`,
      `Late night gains, ${name}! Respect. 🌙`,
      `Night owl mode, ${name}! Let's plan.`,
    ],
  };

  const options = greetings[timeOfDay as keyof typeof greetings] || greetings.afternoon;
  return options[Math.floor(Math.random() * options.length)];
};

const TimeIcon = ({ timeOfDay }: { timeOfDay: string }) => {
  const iconClass = 'h-5 w-5';
  switch (timeOfDay) {
    case 'morning':
      return <Sunrise className={cn(iconClass, 'text-amber-500')} />;
    case 'afternoon':
      return <Sun className={cn(iconClass, 'text-yellow-500')} />;
    case 'evening':
      return <Sunset className={cn(iconClass, 'text-orange-500')} />;
    default:
      return <Moon className={cn(iconClass, 'text-indigo-400')} />;
  }
};

export function WelcomeMessage({ className }: WelcomeMessageProps) {
  const { userName, currentStreak, weeklyProgress, weeklyGoal } = useAchievementStore();
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
    setGreeting(getGreeting(getTimeOfDay(), userName));
  }, [userName]);

  const remainingForGoal = weeklyGoal - weeklyProgress;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <TimeIcon timeOfDay={timeOfDay} />
        <h2 className="text-xl font-bold text-foreground">{greeting}</h2>
      </div>
      
      {/* Contextual encouragement */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        {currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Sparkles className="h-3 w-3" />
            {currentStreak} day streak! Keep it up!
          </span>
        )}
        
        {remainingForGoal > 0 && remainingForGoal <= weeklyGoal && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {remainingForGoal === 1 
              ? "Just 1 more plan to hit your weekly goal!" 
              : `${remainingForGoal} plans away from your weekly goal`
            }
          </span>
        )}
        
        {weeklyProgress >= weeklyGoal && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
            🎉 Weekly goal achieved!
          </span>
        )}
      </div>
    </div>
  );
}
