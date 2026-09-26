import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { cn } from '@/lib/utils';
import {
  REVEAL_VIEWPORT,
  REVEAL_VISIBLE,
  getRevealInitial,
  getRevealTransition,
} from './aboutMotion';

interface AboutSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Card-framed page section that fades and rises into view the first time it is scrolled to. */
export function AboutSection({ id, icon: Icon, title, subtitle, children, className }: AboutSectionProps) {
  const { shouldReduceMotion } = useMotionPreferences();
  const headingId = `about-${id}-heading`;

  return (
    <motion.section
      aria-labelledby={headingId}
      initial={getRevealInitial(shouldReduceMotion)}
      whileInView={REVEAL_VISIBLE}
      viewport={REVEAL_VIEWPORT}
      transition={getRevealTransition(shouldReduceMotion)}
    >
      <Card className={cn('border-border/50 shadow-sm relative overflow-hidden', className)}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-transparent" />
        <CardHeader className="pb-3">
          <CardTitle id={headingId} className="flex items-center gap-2 font-display text-xl">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            {title}
          </CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.section>
  );
}
