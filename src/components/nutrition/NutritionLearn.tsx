import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Beef, Pill, Clock, ShieldQuestion, ListChecks, type LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnSubsection {
  title: string;
  bullets: string[];
}

interface LearnSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  gradient: string;
  subsections: LearnSubsection[];
}

const LEARN_SECTIONS: LearnSection[] = [
  {
    id: 'macronutrients',
    title: 'Macronutrients',
    description: 'The foundation of energy: Protein, Carbs, and Fats',
    icon: Beef,
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/20 to-purple-500/20',
    subsections: [
      {
        title: 'Protein',
        bullets: [
          'Essential for muscle repair, growth, and immune function.',
          'Provides 4 calories per gram.',
          'Aim for 1.6-2.2g per kg of body weight for active individuals.',
          'Best sources: Chicken, fish, eggs, Greek yogurt, tofu, legumes.',
          'Timing: Spread intake across 4-5 meals to maximize synthesis.',
        ],
      },
      {
        title: 'Carbohydrates',
        bullets: [
          'Primary fuel source for high-intensity training and brain function.',
          'Provides 4 calories per gram.',
          'Simple Carbs: Fast energy (fruit, sports drinks) - ideal pre/post workout.',
          'Complex Carbs: Sustained energy (oats, rice, potatoes, quinoa).',
          'Fiber: Critical for digestion (Aim for 25-35g daily).',
        ],
      },
      {
        title: 'Fats',
        bullets: [
          'Vital for hormone production (testosterone) and cell health.',
          'Provides 9 calories per gram (very energy dense).',
          'Focus on unsaturated fats: Avocado, olive oil, nuts, salmon.',
          'Omega-3s are powerful anti-inflammatories for recovery.',
          'Avoid trans fats; moderate saturated fats.',
        ],
      },
    ],
  },
  {
    id: 'micronutrients',
    title: 'Micronutrients',
    description: 'The "Spark Plugs" of your metabolism',
    icon: Pill,
    iconColor: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    subsections: [
      {
        title: 'Key Power Players',
        bullets: [
          'Vitamin D: Bone strength & mood. (Sunlight, fatty fish)',
          'Magnesium: Sleep & muscle relaxation. (Nuts, spinach)',
          'Zinc: Immune system & testosterone. (Oysters, beef, pumpkin seeds)',
          'Iron: Oxygen transport. (Red meat, lentils, spinach)',
          'Electrolytes (Sodium/Potassium): Critical for hydration during sweat.',
        ],
      },
      {
        title: 'Red Flags (Deficiencies)',
        bullets: [
          'Constant Fatigue? Check Iron, B12, and Vitamin D.',
          'Muscle Cramps? Check Magnesium and Potassium.',
          'Getting Sick Often? Check Vitamin C, D, and Zinc.',
        ],
      },
    ],
  },
  {
    id: 'timing',
    title: 'Nutrient Timing',
    description: 'Optimizing performance with the right fuel at the right time',
    icon: Clock,
    iconColor: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-500/20',
    subsections: [
      {
        title: 'Pre-Workout (1-3 Hours Before)',
        bullets: [
          'Goal: Top off energy stores without digestive issues.',
          'Eat: Complex carbs + moderate protein. Low fat/fiber.',
          'Example: Oatmeal with berries & whey, or Chicken + Rice.',
        ],
      },
      {
        title: 'Post-Workout (The "Anabolic Window")',
        bullets: [
          'Goal: Replenish glycogen & start repair.',
          'Eat: Fast-digesting carbs + protein.',
          'Timing: Within 1-2 hours is optimal, but total daily intake matters most.',
          'Example: Protein shake + heavy fruit, or a solid meal.',
        ],
      },
    ],
  },
  {
    id: 'myths',
    title: 'Myth Busting',
    description: 'Separating science from bro-science',
    icon: ShieldQuestion,
    iconColor: 'text-red-400',
    gradient: 'from-red-500/20 to-orange-500/20',
    subsections: [
      {
        title: 'Common Misconceptions',
        bullets: [
          '⛔ "Carbs make you fat" — Excess calories make you fat. Carbs fuel performance.',
          '⛔ "Eating late causes weight gain" — Total daily calories determine weight gain, not the clock.',
          '⛔ "Detox diets work" — Your liver and kidneys are the best detox machines. Save your money.',
          '⛔ "Fat is bad" — Essential for hormones. Just watch the caloric density.',
        ],
      },
    ],
  },
  {
    id: 'reference',
    title: 'Food Cheat Sheet',
    description: 'High-quality sources for your shopping list',
    icon: ListChecks,
    iconColor: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    subsections: [
      {
        title: 'Protein Powerhouses 🍗',
        bullets: ['Chicken Breast', 'Lean Beef (90/10)', 'Salmon / Tuna', 'Egg Whites', 'Greek Yogurt (0%)', 'Tofu / Tempeh'],
      },
      {
        title: 'Carb Champions 🍚',
        bullets: ['Oats', 'Basmati Rice', 'Sweet Potatoes', 'Quinoa', 'Bananas / Berries', 'Whole Grain Pasta'],
      },
      {
        title: 'Healthy Fats 🥑',
        bullets: ['Avocado', 'Extra Virgin Olive Oil', 'Almonds', 'Walnuts', 'Chia Seeds', 'Natural Peanut Butter'],
      },
    ],
  },
];

function LearnCard({ section, isOpen, onToggle }: { section: LearnSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: isOpen ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0)',
        scale: isOpen ? 1.01 : 1
      }}
      className={cn(
        "glass-card rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-300",
        isOpen ? "ring-1 ring-primary/20 shadow-2xl" : "hover:border-white/10"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-6 md:p-8 flex items-center gap-6 text-left relative group"
      >
        {/* Animated Background Gradient on Hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r via-transparent",
          section.gradient,
          "from-transparent to-transparent"
        )} />

        {/* Large Icon Container */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg",
          "bg-white/5 backdrop-blur-md border border-white/10"
        )}>
          <Icon className={cn("w-8 h-8", section.iconColor)} />
        </div>

        <div className="flex-1 relative z-10">
          <h3 className="font-bold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors">
            {section.title}
          </h3>
          <p className="text-base text-muted-foreground mt-1 max-w-xl leading-relaxed">
            {section.description}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className="bg-white/5 p-2 rounded-full border border-white/5"
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-6 md:px-8 pb-8 pt-2 space-y-8 relative">
              {/* Decorative side line */}
              <div className={cn("absolute left-14 top-4 bottom-8 w-0.5 bg-gradient-to-b opacity-20", section.gradient)} />

              {section.subsections.map((sub, idx) => (
                <motion.div
                  key={sub.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="pl-12 relative"
                >
                  <h4 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", section.iconColor.replace('text-', 'bg-'))} />
                    {sub.title}
                  </h4>
                  <ul className="space-y-3">
                    {sub.bullets.map((bullet, i) => (
                      <li key={i} className="text-base md:text-lg text-muted-foreground/90 leading-relaxed flex items-start gap-3">
                        <span className="text-primary/40 mt-1.5 shrink-0 text-xs">●</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function NutritionLearn() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['macronutrients']));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Optional: Auto-close others for "accordion" feel, or keep generic
        // next.clear(); 
        next.add(id);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-6 max-w-5xl mx-auto pb-20"
    >
      <div className="mb-10 text-center md:text-left space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 flex items-center gap-3 justify-center md:justify-start">
          <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />
          Nutrition Academy
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Master the science of performance nutrition. No fads, just biology.
        </p>
      </div>

      <div className="grid gap-6">
        {LEARN_SECTIONS.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <LearnCard
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
