import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ABOUT_PRESS_SPRING } from '@/components/about/aboutMotion';
import { hasSeenAbout } from '@/lib/aboutSeen';

const QUICK_LINKS = [
  { to: '/about', labelKey: 'header.quick_links.about', fallback: 'About' },
  { to: '/guide', labelKey: 'header.quick_links.help', fallback: 'Help' },
  { to: '/legal', labelKey: 'header.quick_links.legal', fallback: 'Legal' },
] as const;

interface DrawerQuickLinksProps {
  /** Called after a link is chosen, so the drawer can close. */
  onNavigate: () => void;
}

/**
 * Quiet "About · Help · Legal" row for the menu drawer. This is the in-app home for these
 * links where the web footer is hidden (native builds). About carries a one-time "New" dot
 * until the About page has been opened.
 */
export function DrawerQuickLinks({ onNavigate }: DrawerQuickLinksProps) {
  const { t } = useTranslation();
  // Read once per mount; the drawer remounts its content each time it opens.
  const [showAboutHint] = useState(() => !hasSeenAbout());

  return (
    <nav
      aria-label={t('header.quick_links.label', 'About and help')}
      data-testid="mobile-drawer-quick-links"
      className="flex items-center justify-center gap-1 pt-1 text-xs text-muted-foreground"
    >
      {QUICK_LINKS.map(({ to, labelKey, fallback }, index) => (
        <span key={to} className="flex items-center gap-1">
          {index > 0 && (
            <span aria-hidden="true" className="text-muted-foreground/40">
              ·
            </span>
          )}
          <motion.span whileTap={{ scale: 0.94 }} transition={ABOUT_PRESS_SPRING} className="inline-flex">
            <Link
              to={to}
              data-click-feedback-event="navigation"
              onClick={onNavigate}
              className="relative inline-flex items-center gap-1.5 rounded-md px-2 py-2 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(labelKey, fallback)}
              {to === '/about' && showAboutHint && (
                <span
                  data-testid="quick-links-about-new"
                  className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_6px_hsl(var(--primary)/0.8)]"
                >
                  <span className="sr-only">{t('header.quick_links.new', 'New')}</span>
                </span>
              )}
            </Link>
          </motion.span>
        </span>
      ))}
    </nav>
  );
}
