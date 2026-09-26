import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bug, Sparkles, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { CHANGELOG } from '@/data/changelog';
import type { ChangelogEntry, ChangelogHighlights } from '@/data/changelog';
import { useViewportTier } from '@/hooks/use-mobile';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { APP_VERSION } from '@/lib/appInfo';
import { markChangelogSeen } from '@/lib/changelogSeen';
import { cn } from '@/lib/utils';
import { STAGGER_STEP_SECONDS, getRevealInitial, getRevealTransition, REVEAL_VISIBLE } from './aboutMotion';

interface WhatsNewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HIGHLIGHT_GROUPS: { key: keyof ChangelogHighlights; icon: LucideIcon; tone: string }[] = [
  { key: 'new', icon: Sparkles, tone: 'bg-primary/15 text-primary' },
  { key: 'improved', icon: Wrench, tone: 'bg-secondary/15 text-secondary' },
  { key: 'fixed', icon: Bug, tone: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
];

const SURFACE_CLASS = 'border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--background)/0.98))]';
const TITLE_CLASS = 'px-5 pt-2 text-left font-display text-2xl font-bold gradient-text sm:px-6';

/** Element.scrollTo with a fallback for environments without it (older WebViews, jsdom). */
function scrollContainerTo(element: HTMLElement, options: ScrollToOptions) {
  if (typeof element.scrollTo === 'function') {
    element.scrollTo(options);
    return;
  }
  if (options.top !== undefined) element.scrollTop = options.top;
  if (options.left !== undefined) element.scrollLeft = options.left;
}

function formatReleaseDate(isoMonth: string, locale: string): string {
  const [year, month] = isoMonth.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function CurrentBadge() {
  const { t } = useTranslation();
  return (
    <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm shadow-primary/30">
      {t('about.whats_new.current')}
    </span>
  );
}

function ReleaseHighlights({ highlights }: { highlights: ChangelogHighlights }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {HIGHLIGHT_GROUPS.map(({ key, icon: Icon, tone }) => {
        const items = highlights[key];
        if (!items?.length) return null;
        return (
          <div key={key}>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', tone)}>
              <Icon className="h-3 w-3" aria-hidden="true" />
              {t(`about.whats_new.${key}`)}
            </span>
            <ul className="mt-1.5 space-y-1">
              {items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Header, version picker chips and the timeline accordion (shared by every surface). */
function ChangelogBody() {
  const { t, i18n } = useTranslation();
  const { shouldReduceMotion } = useMotionPreferences();
  const [expanded, setExpanded] = useState<string[]>([APP_VERSION]);
  const [activeVersion, setActiveVersion] = useState(APP_VERSION);
  const listRef = useRef<HTMLDivElement>(null);
  const chipRowRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  const jumpToVersion = useCallback(
    (version: string) => {
      setActiveVersion(version);
      setExpanded((current) => (current.includes(version) ? current : [...current, version]));

      // Scroll only our own containers (scrollIntoView would also scroll clipped ancestors).
      const behavior: ScrollBehavior = shouldReduceMotion ? 'auto' : 'smooth';
      const item = itemRefs.current.get(version);
      if (listRef.current && item) scrollContainerTo(listRef.current, { top: item.offsetTop - 8, behavior });

      // Keep the active chip visible in the horizontal picker.
      const chip = chipRefs.current.get(version);
      const chipRow = chipRowRef.current;
      if (chipRow && chip) {
        scrollContainerTo(chipRow, { left: chip.offsetLeft - (chipRow.clientWidth - chip.offsetWidth) / 2, behavior });
      }
    },
    [shouldReduceMotion]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pb-3 pt-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          {t('about.whats_new.on_version_prefix')}{' '}
          <span className="font-semibold text-foreground">v{APP_VERSION}</span>
        </p>

        <div
          ref={chipRowRef}
          role="toolbar"
          aria-label={t('about.whats_new.pick_version')}
          className="relative -mx-5 mt-3 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {CHANGELOG.map(({ version }) => {
            const isActive = version === activeVersion;
            return (
              <motion.button
                key={version}
                ref={(node) => {
                  if (node) chipRefs.current.set(version, node);
                  else chipRefs.current.delete(version);
                }}
                type="button"
                onClick={() => jumpToVersion(version)}
                whileTap={{ scale: 0.95 }}
                aria-pressed={isActive}
                data-testid={`changelog-chip-${version}`}
                className={cn(
                  'shrink-0 snap-start rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors duration-200',
                  isActive
                    ? 'border-transparent bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/30'
                    : 'border-border/60 bg-card/50 text-muted-foreground hover:text-foreground'
                )}
              >
                v{version}
                {version === APP_VERSION && <span className="ml-1 opacity-80">· {t('about.whats_new.current')}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div
        ref={listRef}
        data-testid="changelog-list"
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6"
      >
        <Accordion type="multiple" value={expanded} onValueChange={setExpanded} className="relative">
          <span aria-hidden="true" className="absolute bottom-6 left-[11px] top-6 w-0.5 rounded-full bg-gradient-to-b from-primary via-secondary/60 to-border/40" />

          {CHANGELOG.map((entry: ChangelogEntry, index) => {
            const isCurrent = entry.version === APP_VERSION;
            return (
              <motion.div
                key={entry.version}
                ref={(node) => {
                  if (node) itemRefs.current.set(entry.version, node);
                  else itemRefs.current.delete(entry.version);
                }}
                initial={getRevealInitial(shouldReduceMotion)}
                animate={REVEAL_VISIBLE}
                transition={getRevealTransition(shouldReduceMotion, Math.min(index, 6) * STAGGER_STEP_SECONDS)}
              >
                <AccordionItem value={entry.version} className="relative border-none pl-9">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-1 top-[1.15rem] h-4 w-4 rounded-full border-2 border-background',
                      isCurrent
                        ? 'bg-gradient-to-br from-primary to-secondary shadow-[0_0_12px_hsl(var(--primary)/0.7)]'
                        : 'bg-muted'
                    )}
                  />
                  <AccordionTrigger className="py-3 text-left hover:no-underline">
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-base font-semibold tabular-nums">v{entry.version}</span>
                        {isCurrent && <CurrentBadge />}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {entry.name} · {formatReleaseDate(entry.date, i18n.language)}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ReleaseHighlights highlights={entry.highlights} />
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}

/**
 * "What's new" release notes. Bottom drawer on phones, side sheet on tablets, dialog on desktop
 * (same surface split as the exercise library detail modal).
 */
export function WhatsNewPanel({ open, onOpenChange }: WhatsNewPanelProps) {
  const { t } = useTranslation();
  const viewportTier = useViewportTier();

  useEffect(() => {
    if (open) markChangelogSeen(APP_VERSION);
  }, [open]);

  const title = t('about.whats_new.title');
  const description = t('about.whats_new.description');

  if (viewportTier === 'phone') {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent data-surface="phone" className={cn('h-[85dvh] max-h-[85dvh] pb-[env(safe-area-inset-bottom,0px)]', SURFACE_CLASS)}>
          <DrawerTitle className={TITLE_CLASS}>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description}</DrawerDescription>
          <ChangelogBody />
        </DrawerContent>
      </Drawer>
    );
  }

  if (viewportTier === 'tablet') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent data-surface="tablet" side="right" className={cn('flex w-full flex-col p-0 pt-4 sm:max-w-md', SURFACE_CLASS)}>
          <SheetTitle className={TITLE_CLASS}>{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
          <ChangelogBody />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-surface="desktop" className={cn('flex h-[min(80vh,44rem)] max-w-xl flex-col gap-0 p-0 pt-5', SURFACE_CLASS)}>
        <DialogTitle className={TITLE_CLASS}>{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <ChangelogBody />
      </DialogContent>
    </Dialog>
  );
}
