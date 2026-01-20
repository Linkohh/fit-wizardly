import { Link, useLocation } from 'react-router-dom';
import { Users, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainerStore } from '@/stores/trainerStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, debounce } from '@/lib/utils';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon';

export function Header() {
  const location = useLocation();
  const isTrainerMode = useTrainerStore((state) => state.isTrainerMode);
  const toggleTrainerMode = useTrainerStore((state) => state.toggleTrainerMode);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refs for tracking nav item positions for the sliding indicator
  const navRef = useRef<HTMLElement>(null);
  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  /* Navigation items with translations - Memoized to prevent re-creation on every render */
  const navItems = useMemo(() => ([{
    path: '/',
    label: t('nav.home')
  }, {
    path: '/wizard',
    label: t('nav.create_plan')
  }, {
    path: '/plan',
    label: t('nav.view_plan')
  }, {
    path: '/exercises',
    label: t('nav.exercises')
  }, {
    path: '/circles',
    label: t('nav.circles')
  }, {
    path: '/nutrition',
    label: 'Nutrition'
  }, ...(isTrainerMode ? [{
    path: '/clients',
    label: t('nav.clients')
  }] : [])]), [t, isTrainerMode]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const effectiveTheme = getEffectiveTheme();
  const ThemeIcon = mode === 'system' ? Monitor : effectiveTheme === 'dark' ? Moon : Sun;

  // Update indicator position when route changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeItem = navItemRefs.current.get(location.pathname);
      const navElement = navRef.current;

      if (activeItem && navElement) {
        const navRect = navElement.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();

        setIndicatorStyle({
          left: itemRect.left - navRect.left,
          width: itemRect.width,
        });
      }
    };

    // Small delay to ensure DOM is updated after route change
    const timeoutId = setTimeout(updateIndicator, 10);

    // Debounced resize handler to prevent layout thrashing
    const handleResize = debounce(updateIndicator, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname, isTrainerMode]); // Re-run when trainer mode changes (adds/removes Clients tab)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/" className="flex items-center gap-3 touch-target group">
                <motion.div
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <img alt="FitWizard Logo" className="h-full w-full object-contain" src="/lovable-uploads/85daa486-f2ec-4130-b122-65b217aecb1c.png" />
                </motion.div>
                <span className="text-3xl font-bold gradient-text hidden lg:inline">FitWizard</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="flex items-center gap-1.5">
                <span className="text-primary font-bold">✨</span>
                {t('header.logo_tooltip')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Desktop Navigation */}
        <nav
          ref={navRef}
          className="hidden md:flex items-center gap-1 relative"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Persistent sliding indicator - always mounted, animates position */}
          <motion.div
            className="absolute h-full bg-primary/10 rounded-md pointer-events-none"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.width > 0 ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
            }}
          />

          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={(el) => {
                  if (el) {
                    navItemRefs.current.set(item.path, el);
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
                    "relative z-10 touch-target transition-colors duration-200 text-sm lg:text-base lg:px-4 lg:py-2",
                    active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Side Controls */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Toggle theme">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ThemeIcon className="h-5 w-5" />
                  </motion.div>
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setMode('light')} className={mode === 'light' ? 'bg-accent' : ''}>
                <Sun className="mr-2 h-4 w-4" />
                {t('header.theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('dark')} className={mode === 'dark' ? 'bg-accent' : ''}>
                <Moon className="mr-2 h-4 w-4" />
                {t('header.theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('system')} className={mode === 'system' ? 'bg-accent' : ''}>
                <Monitor className="mr-2 h-4 w-4" />
                {t('header.theme.system')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Trainer Mode Toggle */}
          <motion.div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-300",
              isTrainerMode ? "bg-primary/20" : "bg-secondary/50"
            )}
            animate={{
              boxShadow: isTrainerMode
                ? "0 0 20px rgba(139, 92, 246, 0.4)"
                : "0 0 0px rgba(139, 92, 246, 0)"
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ rotate: isTrainerMode ? 360 : 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Users className={cn(
                "h-4 w-4 transition-colors duration-300",
                isTrainerMode ? 'text-primary' : 'text-muted-foreground'
              )} />
            </motion.div>
            <Label htmlFor="trainer-mode" className="text-sm font-medium cursor-pointer hidden lg:inline">
              {t('header.trainer_mode')}
            </Label>
            <Switch id="trainer-mode" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <motion.div
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <AnimatedMenuIcon isOpen={mobileOpen} size={24} strokeWidth={2} />
              </Button>
            </motion.div>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72"
            glassEffect
            enableGestures
            showDragHandle
            onGestureClose={() => setMobileOpen(false)}
          >
            <motion.nav
              className="flex flex-col gap-2 mt-8"
              role="navigation"
              aria-label="Mobile navigation"
              initial="hidden"
              animate={mobileOpen ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.06,
                    delayChildren: 0.12
                  }
                }
              }}
            >
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <motion.div
                    key={item.path}
                    variants={{
                      hidden: { opacity: 0, x: -24, scale: 0.96, filter: "blur(4px)" },
                      visible: {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        transition: { type: "spring", stiffness: 400, damping: 28 }
                      }
                    }}
                    whileTap={{ scale: 0.97, x: -4 }}
                    whileHover={{ x: 4 }}
                    className="relative"
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="nav-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Link to={item.path} onClick={() => setMobileOpen(false)}>
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        className={cn(
                          "w-full justify-start touch-target menu-item-interactive pl-4",
                          active && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile Theme Selection */}
              <motion.div
                className="flex flex-col gap-2 mt-4 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm"
                variants={{
                  hidden: { opacity: 0, x: -24, scale: 0.96, filter: "blur(4px)" },
                  visible: {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 400, damping: 28 }
                  }
                }}
              >
                <Label className="text-sm font-medium mb-1">{t('header.theme.label')}</Label>
                <div className="flex gap-1">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button variant={mode === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('light')} className="w-full">
                      <Sun className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button variant={mode === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('dark')} className="w-full">
                      <Moon className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button variant={mode === 'system' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('system')} className="w-full">
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Mobile Trainer Mode */}
              <motion.div
                className={cn(
                  "flex items-center gap-3 mt-2 p-3 rounded-lg transition-colors duration-300 backdrop-blur-sm",
                  isTrainerMode ? "bg-primary/20" : "bg-secondary/50"
                )}
                variants={{
                  hidden: { opacity: 0, x: -24, scale: 0.96, filter: "blur(4px)" },
                  visible: {
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    filter: "blur(0px)",
                    transition: { type: "spring", stiffness: 400, damping: 28 }
                  }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{ rotate: isTrainerMode ? 360 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Users className={cn(
                    "h-4 w-4 transition-colors duration-300",
                    isTrainerMode ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </motion.div>
                <Label htmlFor="trainer-mode-mobile" className="text-sm font-medium flex-1">
                  {t('header.trainer_mode')}
                </Label>
                <Switch id="trainer-mode-mobile" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
              </motion.div>
            </motion.nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}