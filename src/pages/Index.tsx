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

      {/* BRIDGE: Premium Transition - Intense Horizon Glow */}
      <section className="relative h-32 w-full overflow-hidden -mt-[2px] z-30 pointer-events-none">
        
        {/* 1. Wide Atmospheric Purple Bloom (background layer) */}
        <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 h-40 bg-gradient-to-b from-transparent via-[#7c3aed]/20 to-transparent blur-[40px]" />
        
        {/* 2. Magenta Glow Spread (mid layer) */}
        <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 h-24 bg-gradient-to-b from-transparent via-[#db2777]/40 to-transparent blur-[30px]" />
        
        {/* 3. Intense Pink Core Glow */}
        <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 h-12 bg-gradient-to-b from-transparent via-[#ec4899]/60 to-transparent blur-[15px]" />
        
        {/* 4. Bright White-Hot Center Line */}
        <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
        <div className="absolute inset-x-0 bottom-1/2 translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#fdf4ff] to-transparent opacity-100" />
        
        {/* 5. Top fade into hero */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#1a0b2e] to-transparent" />
        
        {/* 6. Bottom fade into content zone */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1a0b2e] to-transparent" />

      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-[#1a0b2e] via-[#0F0518] to-[#08020D] pb-32 pt-8 sm:pt-12 relative z-20 w-full -mt-8 sm:-mt-12 md:-mt-16">
        {/* Quote sits comfortably inside the dark background */}
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
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground tracking-tight drop-shadow-sm">How FitWizard Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((f, index) => (
                <Card
                  key={f.title}
                  variant="interactive"
                  className="text-center group animate-fade-in bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-primary/20 hover:bg-white/[0.06] rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300">
                      <AnimatedIcon>
                        <f.icon className="h-7 w-7 text-primary-foreground" />
                      </AnimatedIcon>
                    </div>
                    <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
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
