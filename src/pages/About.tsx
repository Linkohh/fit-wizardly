import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronRight, Code2, Compass, Heart, Scale, Sparkles, Target, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AboutCta } from '@/components/about/AboutCta';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutSection } from '@/components/about/AboutSection';
import { AboutStats } from '@/components/about/AboutStats';
import { CreatorCard } from '@/components/about/CreatorCard';
import { MissionTiles } from '@/components/about/MissionTiles';
import { ReadingProgress } from '@/components/about/ReadingProgress';
import { StoryTimeline } from '@/components/about/StoryTimeline';
import { ABOUT_PRESS_SPRING } from '@/components/about/aboutMotion';
import { BackButton } from '@/components/navigation/BackButton';
import { markAboutSeen } from '@/lib/aboutSeen';
import { isNativeApp } from '@/lib/platform';

const CREDIT_ITEMS: { key: 'exercises' | 'open_source'; icon: LucideIcon }[] = [
  { key: 'exercises', icon: Compass },
  { key: 'open_source', icon: Code2 },
];

const CLOSING_LINKS: { to: string; key: 'guide' | 'legal'; icon: LucideIcon }[] = [
  { to: '/guide', key: 'guide', icon: BookOpen },
  { to: '/legal', key: 'legal', icon: Scale },
];

export default function AboutPage() {
  const { t } = useTranslation();

  // Clears the one-time "New" hint beside About in the menu drawer.
  useEffect(() => {
    markAboutSeen();
  }, []);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 min-h-screen space-y-6">
      <ReadingProgress />
      <BackButton className="-mb-3" />
      <AboutHero />
      <AboutStats />

      <AboutSection id="story" icon={Sparkles} title={t('about.story.title')} subtitle={t('about.story.subtitle')}>
        <StoryTimeline />
      </AboutSection>

      <AboutSection id="creator" icon={UserRound} title={t('about.creator.title')}>
        <CreatorCard />
      </AboutSection>

      <AboutSection id="mission" icon={Target} title={t('about.mission.title')}>
        <MissionTiles />
      </AboutSection>

      {/* Placed at the story's emotional peak, before the reference sections below. */}
      <AboutCta />

      <AboutSection id="credits" icon={Heart} title={t('about.credits.title')}>
        <ul className="space-y-3">
          {CREDIT_ITEMS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t(`about.credits.${key}`)}</span>
            </li>
          ))}
        </ul>
      </AboutSection>

      {/* "Get in Touch" is hidden until the creator's public social links (Instagram / LinkedIn) are ready. */}

      <nav aria-label={t('about.title')} className="grid gap-2 sm:grid-cols-2">
        {CLOSING_LINKS.map(({ to, key, icon: Icon }) => (
          <motion.div key={key} whileTap={{ scale: 0.97 }} transition={ABOUT_PRESS_SPRING}>
            <Link
              to={to}
              className="group flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm font-medium transition-colors hover:bg-card/70"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                {t(`about.closing.${key}`)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* The web footer carries the sign-off; native builds hide the footer, so the page closes itself. */}
      {isNativeApp() && (
        <p className="pb-4 text-center text-xs text-muted-foreground">{t('about.closing.made_with')}</p>
      )}
    </div>
  );
}
