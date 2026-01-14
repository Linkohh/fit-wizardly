import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Dumbbell, Target, FileText, Users, Sparkles, Zap, Crown } from 'lucide-react';
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
  { icon: Target, title: 'Smart Goal Setting', description: 'Choose strength, hypertrophy, or general fitness goals', variant: 'strength' as const, gradient: 'from-orange-500 to-red-500' },
  { icon: Dumbbell, title: 'Equipment Matching', description: 'Plans tailored to your available equipment', variant: 'achievement' as const, gradient: 'from-blue-500 to-cyan-500' },
  { icon: FileText, title: 'PDF Export', description: 'Download and share your personalized plan', variant: 'magic' as const, gradient: 'from-purple-500 to-pink-500' },
  { icon: Users, title: 'Trainer Mode', description: 'Manage clients and assign customized plans', variant: 'cosmic' as const, gradient: 'from-green-500 to-emerald-500' },
];

// Animated counter component
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      className="tabular-nums"
    >
      {isInView ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {value}{suffix}
        </motion.span>
      ) : (
        '0'
      )}
    </motion.span>
  );
}

// Feature card with 3D hover effect
function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
      }}
      whileHover={{
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="group"
    >
      <Card
        variant="interactive"
        className="relative text-center h-full bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/40 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden"
      >
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Glow effect */}
        <motion.div
          className={`absolute -inset-px bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
          style={{ zIndex: -1 }}
        />

        <CardContent className="p-6 relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-all duration-500 cursor-pointer overflow-visible relative`}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <AnimatedIcon>
                  <feature.icon className="h-7 w-7 text-white" />
                </AnimatedIcon>
                
                {/* Pulse ring */}
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient}`}
                  animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{feature.description}</p>
            </TooltipContent>
          </Tooltip>
          
          <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
          
          {/* Arrow indicator */}
          <motion.div
            className="mt-4 flex items-center justify-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            <span className="text-sm font-medium">Learn more</span>
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Index() {
  const navigate = useNavigate();
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

      {/* BRIDGE: Enhanced Cosmic Transition */}
      <section
        className="relative h-48 w-full -mt-[2px] z-30 pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        {/* Animated gradient layers */}
        <motion.div 
          className="absolute inset-0 w-[150%] left-1/2 -translate-x-1/2"
          animate={{ 
            background: [
              'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
              'radial-gradient(ellipse 90% 45% at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 70%)',
              'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)',
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core bloom */}
        <motion.div 
          className="absolute inset-0 w-[100%] left-1/2 -translate-x-1/2
            bg-[radial-gradient(ellipse_70%_35%_at_50%_50%,rgba(236,72,153,0.25)_0%,transparent_60%)]"
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Bright horizon line */}
        <motion.div 
          className="absolute inset-0 w-[80%] h-full left-1/2 -translate-x-1/2
            bg-[radial-gradient(ellipse_60%_3px_at_50%_50%,rgba(255,255,255,0.9)_0%,transparent_70%)]"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Secondary glow */}
        <div className="absolute inset-0 w-[120%] left-1/2 -translate-x-1/2
          bg-[radial-gradient(ellipse_50%_25%_at_50%_50%,rgba(168,85,247,0.1)_0%,transparent_60%)]"
        />
      </section>

      {/* Zone 2: Middle Content - Feature Cards & Motivation */}
      <div className="bg-gradient-to-b from-background via-purple-50/20 to-background dark:from-[#0F0518] dark:via-[#0a0210] dark:to-[#05010a] pb-32 pt-8 sm:pt-12 relative z-20 w-full -mt-12 sm:-mt-16 md:-mt-20 transition-colors duration-500">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-50 dark:opacity-30" />
        
        {/* Quote sits comfortably inside the dark background */}
        <div className="container max-w-4xl mx-auto px-4 mb-20 pt-12 sm:pt-16 md:pt-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <DailyQuote />
          </motion.div>
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

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          initial={{ opacity: 0 }}
          animate={featuresInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="px-4 pb-12"
        >
          <div className="container max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={featuresInView ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6"
              >
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">Powerful Features</span>
              </motion.div>
              
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                How <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">FitWizard</span> Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to create the perfect workout plan, all in one place.
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <TooltipProvider delayDuration={200}>
                {features.map((f, i) => (
                  <FeatureCard key={f.title} feature={f} index={i} />
                ))}
              </TooltipProvider>
            </motion.div>

            {/* CTA after features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-16 text-center"
            >
              <motion.button
                onClick={() => navigate('/wizard')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary via-purple-500 to-secondary text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 cursor-pointer"
              >
                <Crown className="h-5 w-5" />
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • Start building your plan in seconds
              </p>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}