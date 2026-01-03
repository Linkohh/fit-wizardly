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

      {/* BRIDGE: Premium Transition - intense Horizon Glow (Curved) */}
      <section className="relative h-24 w-full overflow-hidden -mt-[2px] z-30 pointer-events-none">

        {/* 1. Deep Atmosphere Blend */}
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-[#1a0b2e]/80 to-[#1a0b2e]" />

        {/* 2. Curved Horizon SVG */}
        <div className="absolute inset-x-0 top-0 h-full flex items-end justify-center">
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="w-full h-full opacity-90"
            style={{ filter: "drop-shadow(0 -4px 10px rgba(236, 72, 153, 0.5))" }}
          >
            <defs>
              <linearGradient id="horizon-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="40%" stopColor="white" />
                <stop offset="60%" stopColor="white" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Core White-Hot Curve */}
            <path
              d="M -100 320 Q 720 100 1540 320"
              fill="none"
              stroke="url(#horizon-glow)"
              strokeWidth="2"
              className="opacity-90 blur-[0.5px]"
            />
            {/* Magenta Energy Bloom */}
            <path
              d="M -100 320 Q 720 100 1540 320"
              fill="none"
              stroke="#db2777"
              strokeWidth="4"
              className="opacity-60 blur-[6px]"
            />
          </svg>
        </div>

        {/* 3. Wide Ambient Atmosphere */}
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 h-16 w-full md:w-[70%] bg-secondary/20 blur-[60px] rounded-full" />

      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-[#1a0b2e] via-[#0F0518] to-[#08020D] pb-32 pt-12 relative z-20 w-full -mt-12 md:-mt-16">
        {/* Quote sits comfortably inside the dark background */}
        <div className="container max-w-4xl mx-auto px-4 mb-20 pt-12">
          <div className="rounded-2xl p-1 bg-gradient-to-b from-[#140821] to-[#0F0518] border border-primary/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] ring-1 ring-white/5">
            <DailyQuote />
          </div>
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
