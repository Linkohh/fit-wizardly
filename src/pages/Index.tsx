import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedIcon } from '@/components/ui/page-transition';
import { WelcomeMessage, StreakTracker, GoalVisualization, WelcomeHero, DailyQuote } from '@/components/motivation';
import { useAchievementStore } from '@/stores/achievementStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { TrainerDashboard } from '@/components/motivation/TrainerDashboard';

const features = [
  { icon: Target, title: 'Smart Goal Setting', description: 'Choose strength, hypertrophy, or general fitness goals' },
  { icon: Dumbbell, title: 'Equipment Matching', description: 'Plans tailored to your available equipment' },
  { icon: FileText, title: 'PDF Export', description: 'Download and share your personalized plan' },
  { icon: Users, title: 'Trainer Mode', description: 'Manage clients and assign customized plans' },
];

export default function Index() {
  const { totalPlansGenerated } = useAchievementStore();
  const { isTrainerMode } = useTrainerStore();
  const hasActivity = totalPlansGenerated > 0;

  return (
    <main>
      {/* Hero */}
      <WelcomeHero />

      <div className="container max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <DailyQuote />
      </div>

      {/* Stats Section - show if user has activity */}
      {hasActivity && (
        <section className="py-8 px-4 bg-muted/20">
          <div className="container max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <StreakTracker />
              <GoalVisualization />
            </div>
          </div>
        </section>
      )}

      {/* Trainer Dashboard - show if trainer mode */}
      {isTrainerMode && (
        <section className="py-8 px-4">
          <div className="container max-w-4xl mx-auto">
            <TrainerDashboard />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How FitWizard Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, index) => (
              <Card
                key={f.title}
                variant="interactive"
                className="text-center group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow group-hover:animate-glow-pulse transition-all duration-300">
                    <AnimatedIcon>
                      <f.icon className="h-6 w-6 text-primary-foreground" />
                    </AnimatedIcon>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
