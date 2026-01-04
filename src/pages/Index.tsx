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

      {/* BRIDGE: Premium Transition - Only visible in dark mode */}
      <section className="relative h-32 w-full -mt-[2px] z-30 pointer-events-none overflow-hidden dark:block hidden">
        {/* 1. Wide Atmospheric Purple Bloom - centered ellipse shape */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 translate-y-1/2 w-[120%] h-48 bg-[radial-gradient(ellipse_80%_100%_at_50%_50%,rgba(124,58,237,0.25)_0%,transparent_70%)]" />
        {/* 2. Magenta Glow Spread - ellipse for natural fade */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 translate-y-1/2 w-[100%] h-32 bg-[radial-gradient(ellipse_70%_100%_at_50%_50%,rgba(219,39,119,0.4)_0%,transparent_60%)]" />
        {/* 3. Intense Pink Core Glow - tighter ellipse */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 translate-y-1/2 w-[80%] h-16 bg-[radial-gradient(ellipse_60%_100%_at_50%_50%,rgba(236,72,153,0.6)_0%,transparent_50%)]" />
        {/* 4. Bright White-Hot Center Line - fades at edges */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 translate-y-1/2 w-[70%] h-[3px] bg-[radial-gradient(ellipse_50%_100%_at_50%_50%,rgba(255,255,255,0.9)_0%,transparent_70%)]" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-1/2 translate-y-1/2 w-[50%] h-[2px] bg-[radial-gradient(ellipse_40%_100%_at_50%_50%,rgba(253,244,255,1)_0%,transparent_60%)]" />
      </section>

      {/* Light mode subtle divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent dark:hidden" />

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
<<<<<<< HEAD
      <div className="bg-gradient-to-b from-background via-purple-50/30 to-background dark:from-[#1a0b2e] dark:via-[#0F0518] dark:to-[#08020D] pb-32 pt-8 sm:pt-12 relative z-20 w-full -mt-8 sm:-mt-12 md:-mt-16 transition-colors duration-500">
        {/* Quote sits comfortably inside the dark background */}
=======
      <div className="bg-gradient-to-b from-muted/30 via-background to-background dark:from-[#1a0b2e] dark:via-[#0F0518] dark:to-[#08020D] pb-32 pt-8 sm:pt-12 relative z-20 w-full">
        {/* Quote sits comfortably inside the background */}
>>>>>>> 6408ae0476f075b0179301c7061eb2a1361d298a
        <div className="container max-w-4xl mx-auto px-4 mb-20 pt-8 sm:pt-12 md:pt-16">
          <DailyQuote />
        </div>

        {/* Stats Section */}
        {hasActivity && (
          <section className="px-4 mb-20 animate-fade-in">
            <div className="container max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <StreakTracker />
                <GoalVisualization />
              </div>
            </div>
          </section>
        )}

        {/* Trainer Dashboard */}
        {isTrainerMode && (
          <section className="px-4 mb-20">
            <div className="container max-w-4xl mx-auto">
              <TrainerDashboard />
            </div>
          </section>
        )}

        {/* Features */}
        <section className="px-4 pb-12">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground tracking-tight">How FitWizard Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((f, index) => (
                <Card
                  key={f.title}
                  variant="interactive"
                  className="text-center group animate-fade-in bg-card/80 backdrop-blur-md border border-border hover:border-primary/30 hover:bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300">
                      <AnimatedIcon>
                        <f.icon className="h-7 w-7 text-primary-foreground" />
                      </AnimatedIcon>
                    </div>
                    <h3 className="font-semibold text-base mb-2 text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
