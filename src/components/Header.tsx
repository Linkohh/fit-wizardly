import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeModePill } from '@/components/theme/ThemeModePill';
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTrainerStore } from '@/stores/trainerStore';
import { useThemeStore } from '@/stores/themeStore';
import { usePreferencesStore } from '@/hooks/useUserPreferences';
import { useMotionPreferences } from '@/hooks/use-motion-preferences';
import { useMotionTiltStatus } from '@/hooks/use-motion-tilt-status';
import { cn, debounce } from '@/lib/utils';
import {
  buildDrawerProfileViewModel,
  buildMobileNavItems,
  isMobileNavPathActive,
} from '@/components/header/mobile-drawer-model';

const mobileNavVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
};

const mobileNavItemVariants = {
  hidden: { opacity: 0, x: -24, scale: 0.96, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const onboardingUserData = useOnboardingStore((state) => state.userData);
  const { isTrainerMode } = useTrainerStore();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const { shouldReduceMotion } = useMotionPreferences();
  const motionTiltEnabled = usePreferencesStore((state) => state.settings.motionTilt !== false);
  const {
    status: motionTiltStatus,
    isRefreshing: isRefreshingMotionTiltStatus,
    isRequestingPermission: isRequestingMotionTiltPermission,
    requestPermission: requestMotionTiltPermission,
  } = useMotionTiltStatus();

  const navRef = useRef<HTMLElement>(null);
  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => getEffectiveTheme());

  const navItems = useMemo(
    () => buildMobileNavItems({ isTrainerMode, t }),
    [isTrainerMode, t],
  );

  const drawerProfile = useMemo(
    () =>
      buildDrawerProfileViewModel({
        isTrainerMode,
        onboarding: onboardingUserData,
        profile,
        t,
        user,
      }),
    [isTrainerMode, onboardingUserData, profile, t, user],
  );

  const activeNavPath = useMemo(
    () => navItems.find((item) => isMobileNavPathActive(location.pathname, item.path))?.path ?? null,
    [location.pathname, navItems],
  );

  const primaryNavItems = useMemo(
    () => navItems.filter((item) => item.section === 'primary'),
    [navItems],
  );

  const trainerNavItems = useMemo(
    () => navItems.filter((item) => item.section === 'trainer'),
    [navItems],
  );

  const motionTiltStatusLabel = useMemo(() => {
    if (shouldReduceMotion) {
      return t('profile.motion_tilt_status_reduced', 'Reduced motion is on');
    }

    if (!motionTiltEnabled) {
      return t('profile.motion_tilt_status_off', 'Off');
    }

    if (motionTiltStatus.available && motionTiltStatus.permission === 'granted') {
      return t('profile.motion_tilt_status_active', 'Active');
    }

    if (motionTiltStatus.permission === 'prompt') {
      return t('profile.motion_tilt_status_prompt', 'Tap to enable motion tilt');
    }

    if (motionTiltStatus.permission === 'denied' && motionTiltStatus.available) {
      return t('profile.motion_tilt_status_denied', 'Access blocked');
    }

    return t('profile.motion_tilt_status_unavailable', 'Unavailable on this device');
  }, [
    motionTiltEnabled,
    motionTiltStatus.available,
    motionTiltStatus.permission,
    shouldReduceMotion,
    t,
  ]);

  const canRequestMotionTilt =
    motionTiltStatus.available &&
    (motionTiltStatus.permission === 'prompt' || motionTiltStatus.permission === 'denied');

  const showMotionTiltAction =
    motionTiltEnabled &&
    !shouldReduceMotion &&
    !isRefreshingMotionTiltStatus &&
    canRequestMotionTilt;

  const motionTiltActionLabel =
    motionTiltStatus.permission === 'denied'
      ? t('profile.motion_tilt_retry', 'Retry')
      : t('profile.motion_tilt_enable', 'Enable');

  const isActive = useCallback(
    (path: string) => isMobileNavPathActive(location.pathname, path),
    [location.pathname],
  );

  useEffect(() => {
    const applyResolvedTheme = () => {
      setResolvedTheme(getEffectiveTheme());
    };

    applyResolvedTheme();

    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (mode === 'system') {
        applyResolvedTheme();
      }
    };

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', handleThemeChange);
    } else {
      mediaQuery.addListener(handleThemeChange);
    }

    return () => {
      if ('removeEventListener' in mediaQuery) {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } else {
        mediaQuery.removeListener(handleThemeChange);
      }
    };
  }, [getEffectiveTheme, mode]);

  useEffect(() => {
    const updateIndicator = () => {
      if (!activeNavPath) {
        setIndicatorStyle({ left: 0, width: 0 });
        return;
      }

      const activeItem = navItemRefs.current.get(activeNavPath);
      const navElement = navRef.current;

      if (!activeItem || !navElement) {
        setIndicatorStyle({ left: 0, width: 0 });
        return;
      }

      const navRect = navElement.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      setIndicatorStyle({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
      });
    };

    const timeoutId = setTimeout(updateIndicator, 10);
    const handleResize = debounce(updateIndicator, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeNavPath]);

  const handleMotionTiltRequest = () => {
    usePreferencesStore.getState().setMotionTiltActivatedThisSession(false);

    void requestMotionTiltPermission().then((status) => {
      if (status.permission === 'granted') {
        usePreferencesStore.getState().setMotionTiltActivatedThisSession(true);
      }
    });
  };

  const renderAvatar = (sizeClassName: string, fallbackClassName: string) => {
    if (drawerProfile.avatarUrl) {
      return (
        <img
          src={drawerProfile.avatarUrl}
          alt={`${drawerProfile.displayName} avatar`}
          className={cn(sizeClassName, 'h-full w-full object-cover')}
        />
      );
    }

    if (drawerProfile.avatarEmoji) {
      return <span className={fallbackClassName}>{drawerProfile.avatarEmoji}</span>;
    }

    return <span className={fallbackClassName}>{drawerProfile.initials}</span>;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] px-4 py-2 bg-background border border-primary text-primary rounded-md shadow-lg"
      >
        {t('a11y.skip_to_content', 'Skip to content')}
      </a>
      <div className="container app-shell-header-height flex items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-3 touch-target group"
          data-click-feedback-event="brandHome"
        >
          <motion.div
            className="app-shell-header-square flex shrink-0 items-center justify-center overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 0 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <img
              alt="FitWizard Logo"
              fetchPriority="high"
              width="64"
              height="64"
              className="h-full w-full object-contain"
              src="/lovable-uploads/85daa486-f2ec-4130-b122-65b217aecb1c.png"
            />
          </motion.div>
          <span className="text-3xl font-bold gradient-text hidden lg:inline">FitWizard</span>
        </Link>

        <nav
          ref={navRef}
          className="hidden xl:flex items-center gap-1 relative"
          role="navigation"
          aria-label="Main navigation"
        >
          <motion.div
            className="absolute h-full bg-primary/10 rounded-md pointer-events-none"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.width > 0 ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30,
            }}
          />

          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                data-click-feedback-event="navigation"
                ref={(element) => {
                  if (element) {
                    navItemRefs.current.set(item.path, element);
                  } else {
                    navItemRefs.current.delete(item.path);
                  }
                }}
                className="relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'relative z-10 touch-target transition-colors duration-200 text-sm xl:text-base xl:px-3 xl:py-2',
                    active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-2 ml-4">
          <ThemeModePill
            mode={mode}
            onChange={setMode}
            containerClassName="header-theme-toggle"
            buttonClassName="header-theme-button"
            testId="desktop-header-theme-toggle"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Profile">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 overflow-hidden">
                  {renderAvatar('h-full w-full', 'text-xs font-semibold text-primary')}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-medium">{t('header.trainer_mode', 'Trainer Mode')}</span>
                <Switch
                  checked={isTrainerMode}
                  aria-label={t('header.trainer_mode', 'Trainer Mode')}
                  onCheckedChange={useTrainerStore.getState().toggleTrainerMode}
                />
              </div>
              <DropdownMenuItem asChild>
                <Link
                  to="/profile"
                  className="cursor-pointer w-full"
                  data-click-feedback-event="navigation"
                >
                  {t('profile.title', 'Settings & Profile')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="xl:hidden">
            <motion.div
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                data-click-feedback-event="navigation"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <AnimatedMenuIcon isOpen={mobileOpen} size={24} strokeWidth={2} />
              </Button>
            </motion.div>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="aetheric-drawer aetheric-drawer--scooped w-[20rem] max-w-[92vw] h-[100svh] supports-[height:100dvh]:h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden overflow-x-hidden p-0 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
            data-theme-mode={mode}
            data-resolved-theme={resolvedTheme}
            glassEffect
            enableGestures
            showDragHandle
            onGestureClose={() => setMobileOpen(false)}
          >
            <div className="aetheric-drawer__inner flex min-h-0 flex-1 flex-col px-4 pb-2 pt-5">
              <motion.section
                data-testid="mobile-drawer-profile"
                className="aetheric-drawer__profile shrink-0"
                initial={{ opacity: 0, y: -10 }}
                animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <div className="aetheric-drawer__profile-layout flex items-start gap-3.5">
                  <div className="aetheric-drawer__avatar-shell shrink-0">
                    <div className="aetheric-drawer__avatar-core">
                      {renderAvatar('h-full w-full', 'aetheric-drawer__avatar-fallback text-xl font-semibold')}
                    </div>
                  </div>
                  <div className="aetheric-drawer__profile-body min-w-0 flex-1">
                    <p className="aetheric-drawer__eyebrow">FitWizard</p>
                    <h2 className="aetheric-drawer__title">{drawerProfile.displayName}</h2>
                    <div
                      data-testid="mobile-drawer-profile-chips"
                      className="aetheric-drawer__chip-row"
                    >
                      <span className="aetheric-drawer__profile-chip aetheric-drawer__profile-chip--accent">
                        <span className="aetheric-drawer__badge">{drawerProfile.modeChipLabel}</span>
                      </span>
                    </div>
                    <p className="aetheric-drawer__subtitle">{drawerProfile.subtitle}</p>
                  </div>
                </div>
              </motion.section>

              <ScrollArea
                data-testid="mobile-drawer-scroll-area"
                className="aetheric-drawer__scroll-area mt-1.5 flex-1 min-h-0 overflow-hidden"
              >
                <motion.nav
                  data-testid="mobile-drawer-nav"
                  className="aetheric-drawer__nav-region flex min-h-full flex-col overflow-x-hidden overscroll-contain pr-1.5"
                  role="navigation"
                  aria-label="Mobile navigation"
                  initial="hidden"
                  animate={mobileOpen ? 'visible' : 'hidden'}
                  variants={mobileNavVariants}
                >
                  <div className="space-y-1.5 pb-3">
                    {primaryNavItems.map((item) => {
                      const active = isActive(item.path);
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.path}
                          variants={mobileNavItemVariants}
                          whileTap={{ scale: 0.985, x: -2 }}
                          whileHover={{ x: 3 }}
                          className="relative"
                        >
                          {active ? (
                            <motion.div
                              layoutId="mobile-nav-indicator"
                              className="nav-indicator absolute left-0 top-1/2 z-10 h-11 w-1 -translate-y-1/2 rounded-full"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          ) : null}
                          <Link
                            to={item.path}
                            aria-current={active ? 'page' : undefined}
                            className={cn('aetheric-drawer__nav-link', active && 'is-active')}
                            data-click-feedback-event="navigation"
                            onClick={() => setMobileOpen(false)}
                          >
                            <span className={cn('aetheric-drawer__nav-icon', active && 'is-active')}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="aetheric-drawer__nav-label">{item.label}</span>
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}

                    {trainerNavItems.length > 0 ? (
                      <motion.section className="pt-3" variants={mobileNavItemVariants}>
                        <div className="aetheric-drawer__section-label">
                          <span className="aetheric-drawer__section-line" />
                          <span>{t('header.mobile_drawer.trainer_section', 'Coach Tools')}</span>
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          {trainerNavItems.map((item) => {
                            const active = isActive(item.path);
                            const Icon = item.icon;

                            return (
                              <motion.div
                                key={item.path}
                                variants={mobileNavItemVariants}
                                whileTap={{ scale: 0.985, x: -2 }}
                                whileHover={{ x: 3 }}
                                className="relative"
                              >
                                {active ? (
                                  <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="nav-indicator absolute left-0 top-1/2 z-10 h-11 w-1 -translate-y-1/2 rounded-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  />
                                ) : null}
                                <Link
                                  to={item.path}
                                  aria-current={active ? 'page' : undefined}
                                  className={cn('aetheric-drawer__nav-link', active && 'is-active')}
                                  data-click-feedback-event="navigation"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  <span className={cn('aetheric-drawer__nav-icon', active && 'is-active')}>
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="aetheric-drawer__nav-label">{item.label}</span>
                                  </span>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.section>
                    ) : null}
                  </div>
                </motion.nav>
              </ScrollArea>

              <motion.div
                data-testid="mobile-drawer-footer"
                className="aetheric-drawer__footer sticky bottom-0 mt-auto shrink-0"
                initial={{ opacity: 0, y: 10 }}
                animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.08, duration: 0.24, ease: 'easeOut' }}
              >
                <div className="aetheric-drawer__utility-card" data-testid="mobile-drawer-utility-card">
                  <div className="aetheric-drawer__utility-top-row" data-testid="mobile-drawer-utility-top-row">
                    <div className="aetheric-drawer__utility-copy space-y-0.5">
                      <p className="aetheric-drawer__eyebrow aetheric-drawer__footer-brand text-xs">
                        {t('header.mobile_drawer.footer_brand', 'FitWizard')}
                      </p>
                      <p className="aetheric-drawer__eyebrow aetheric-drawer__eyebrow--body text-xs">
                        {t('header.mobile_drawer.footer_caption', 'Quick Controls')}
                      </p>
                    </div>
                    <div className="aetheric-drawer__utility-actions" data-testid="mobile-drawer-utility-actions">
                      <ThemeModePill
                        mode={mode}
                        onChange={setMode}
                        containerClassName="aetheric-drawer__theme-toggle"
                        buttonClassName="aetheric-drawer__theme-button"
                        testId="mobile-drawer-theme-toggle"
                      />
                      <div
                        className="aetheric-drawer__trainer-switch-cluster"
                        data-testid="mobile-drawer-trainer-cluster"
                      >
                        <Label className="aetheric-drawer__trainer-switch-label">
                          {t('header.mobile_drawer.trainer_toggle_label', 'Coach Mode')}
                        </Label>
                        <Switch
                          className="aetheric-drawer__trainer-switch"
                          checked={isTrainerMode}
                          aria-label={t('header.mobile_drawer.trainer_toggle_label', 'Coach Mode')}
                          onCheckedChange={useTrainerStore.getState().toggleTrainerMode}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="aetheric-drawer__status-card">
                    <div className="flex items-start gap-3">
                      <span className="aetheric-drawer__status-icon">
                        <Smartphone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="aetheric-drawer__status-title">
                          {t('profile.motion_tilt', 'Motion Tilt')}
                        </p>
                        <p className="aetheric-drawer__status-copy">{motionTiltStatusLabel}</p>
                      </div>
                    </div>

                    {showMotionTiltAction ? (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`${motionTiltActionLabel} motion tilt`}
                        className="aetheric-drawer__motion-button"
                        disabled={isRequestingMotionTiltPermission}
                        onClick={handleMotionTiltRequest}
                      >
                        {isRequestingMotionTiltPermission
                          ? t('profile.motion_tilt_enabling', 'Enabling...')
                          : motionTiltActionLabel}
                      </Button>
                    ) : null}
                  </div>

                  <Button asChild variant="gradient" className="aetheric-drawer__profile-cta">
                    <Link
                      to="/profile"
                      data-click-feedback-event="navigation"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      {t('profile.title', 'Settings & Profile')}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
