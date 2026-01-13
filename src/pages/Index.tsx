import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedIcon } from '@/components/ui/page-transition';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WelcomeMessage, StreakTracker, GoalVisualization, WelcomeHero, DailyQuote } from '@/components/motivation';
import { useAchievementStore } from '@/stores/achievementStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { TrainerDashboard } from '@/components/motivation/TrainerDashboard';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { SupernovaIcon } from '@/components/ui/SupernovaIcon';

const features = [
  { icon: Target, title: 'Smart Goal Setting', description: 'Choose strength, hypertrophy, or general fitness goals', variant: 'strength' as const },
  { icon: Dumbbell, title: 'Equipment Matching', description: 'Plans tailored to your available equipment', variant: 'achievement' as const },
  { icon: FileText, title: 'PDF Export', description: 'Download and share your personalized plan', variant: 'magic' as const },
  { icon: Users, title: 'Trainer Mode', description: 'Manage clients and assign customized plans', variant: 'cosmic' as const },
];

export default function Index() {
  const { totalPlansGenerated } = useAchievementStore();
  const { isTrainerMode } = useTrainerStore();
  const hasActivity = totalPlansGenerated > 0;

  // Refs for scroll-triggered animations
  const statsRef = useRef(null);
  const trainerRef = useRef(null);
  const featuresRef = useRef(null);

  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const trainerInView = useInView(trainerRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  return (
    <main>
      {/* Hero */}
      <WelcomeHero />

      {/* BRIDGE: Premium Transition - Adaptive Horizon Bloom (Divine Dawn / Cosmic Abyss) */}
      <section
        className="relative h-40 w-full -mt-[2px] z-30 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%), radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%), radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in'
        }}
      >

        {/* Layer 1: Base Atmosphere (Wide & Faint) - 30% Vertical Compression */}
        <div className="absolute inset-0 w-[140%] left-1/2 -translate-x-1/2
          bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(236,72,153,0.05)_0%,transparent_70%)] 
          dark:bg-[radial-gradient(ellipse_80%_30%_at_50%_50%,rgba(124,58,237,0.08)_0%,transparent_70%)]"
        />

        {/* Layer 2: Core Bloom (Intense & Focused) - 30% Vertical Compression */}
        <div className="absolute inset-0 w-[90%] left-1/2 -translate-x-1/2
          bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(236,72,153,0.3)_0%,transparent_50%)] 
          dark:bg-[radial-gradient(ellipse_60%_30%_at_50%_50%,rgba(236,72,153,0.3)_0%,transparent_50%)]"
        />

        {/* Layer 3: Horizon Line (Sharp & Bright) */}
        <div className="absolute inset-0 w-[70%] h-full left-1/2 -translate-x-1/2
          bg-[radial-gradient(ellipse_50%_2px_at_50%_50%,rgba(255,255,255,0.8)_0%,transparent_70%)] 
          dark:bg-[radial-gradient(ellipse_50%_2px_at_50%_50%,rgba(255,255,255,0.9)_0%,transparent_70%)]"
        />
      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-background via-purple-50/30 to-background dark:from-[#1a0b2e] dark:via-[#0F0518] dark:to-[#08020D] pb-32 pt-8 sm:pt-12 relative z-20 w-full -mt-8 sm:-mt-12 md:-mt-16 transition-colors duration-500">
        {/* Quote sits comfortably inside the dark background */}
        <div className="container max-w-4xl mx-auto px-4 mb-20 pt-8 sm:pt-12 md:pt-16">
          <DailyQuote />
        </div>

        {/* Stats Section */}
        {hasActivity && (
          <motion.section
            ref={statsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="px-4 mb-20"
          >
            <div className="container max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                animate={statsInView ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15
                    }
                  }
                }}
                className="grid md:grid-cols-2 gap-6"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <StreakTracker />
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <GoalVisualization />
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Trainer Dashboard */}
        {isTrainerMode && (
          <motion.section
            ref={trainerRef}
            initial={{ opacity: 0, y: 40 }}
            animate={trainerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="px-4 mb-20"
          >
            <div className="container max-w-4xl mx-auto">
              <TrainerDashboard />
            </div>
          </motion.section>
        )}

        {/* Features */}
        <motion.section
          ref={featuresRef}
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="px-4 pb-12"
        >
          <div className="container max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground tracking-tight"
            >
              How FitWizard Works
            </motion.h2>
            <motion.div
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              <TooltipProvider delayDuration={200}>
                {features.map((f) => (
                  <motion.div
                    key={f.title}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                    }}
                    whileHover={{
                      scale: 1.03,
                      rotateX: 5,
                      rotateY: -5,
                      z: 50
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                  >
                    <Card
                      variant="interactive"
                      className="text-center group bg-card/80 backdrop-blur-md border border-border hover:border-primary/30 hover:bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300 cursor-pointer overflow-visible relative"
                              whileHover={{ y: -4, scale: 1.1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                              <AnimatedIcon>
                                <SupernovaIcon
                                  icon={f.icon}
                                  variant={f.variant}
                                  className="text-primary-foreground w-full h-full"
                                  size={28}
                                />
                              </AnimatedIcon>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{f.description}</p>
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="font-semibold text-base mb-2 text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TooltipProvider>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
