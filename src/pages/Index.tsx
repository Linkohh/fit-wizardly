import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedIcon, FloatingElement } from '@/components/ui/page-transition';
import { WelcomeMessage, StreakTracker, GoalVisualization } from '@/components/motivation';
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
      <section className="py-20 px-4 gradient-subtle">
        <div className="container max-w-4xl mx-auto text-center">
          {hasActivity ? (
            <div className="mb-8 animate-fade-in">
              <WelcomeMessage className="text-left max-w-xl mx-auto" />
            </div>
          ) : (
            <FloatingElement delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Intelligent Workout Planning</span>
              </div>
            </FloatingElement>
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Your Personal <span className="gradient-text-animated">Fitness Wizard</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Create safe, personalized workout plans in minutes. Select your goals, equipment, and target muscles — we handle the rest.
          </p>
          <Link to="/wizard" className="inline-block animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button variant="gradient" size="xl" className="gap-2 touch-target group">
              Start Your Plan 
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

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
