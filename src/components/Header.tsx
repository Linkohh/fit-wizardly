import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainerStore } from '@/stores/trainerStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn, debounce } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { AnimatedMenuIcon } from '@/components/ui/animated-menu-icon';
import { Users, Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isTrainerMode } = useTrainerStore();
  const { mode, setMode } = useThemeStore();

  // Refs for tracking nav item positions for the sliding indicator
  const navRef = useRef<HTMLElement>(null);
  const navItemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  /* Navigation items with translations - Memoized to prevent re-creation on every render */
  const navItems = useMemo(() => {
    const items = [{
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
      path: '/history',
      label: t('nav.history', 'History')
    }, {
      path: '/analytics',
      label: 'Analytics'
    }, {
      path: '/circles',
      label: t('nav.circles')
    }, {
      path: '/nutrition',
      label: 'Nutrition'
    }];

    if (isTrainerMode) {
      items.push({
        path: '/clients',
        label: t('nav.clients')
      });
      items.push({
        path: '/templates',
        label: t('nav.templates', 'Templates')
      });
      items.push({
        path: '/revenue',
        label: t('nav.revenue', 'Revenue')
      });
    }

    return items;
  }, [t, isTrainerMode]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

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
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-top">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] px-4 py-2 bg-background border border-primary text-primary rounded-md shadow-lg">
        {t('a11y.skip_to_content', 'Skip to content')}
      </a>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        {/* NOTE: Tooltip removed here to prevent potential interference/looping with Link logic */}
        <Link to="/" className="flex items-center gap-3 touch-target group">
          <motion.div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
            whileHover={{
              scale: 1.1,
              rotate: 0,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <img alt="FitWizard Logo" className="h-full w-full object-contain" src="/lovable-uploads/85daa486-f2ec-4130-b122-65b217aecb1c.png" />
          </motion.div>
          <span className="text-3xl font-bold gradient-text hidden lg:inline">FitWizard</span>
        </Link>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMode("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode("system")}>
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Profile">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <span className="text-sm font-medium text-primary">U</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="text-sm font-medium">Trainer Mode</span>
                <Switch
                  checked={isTrainerMode}
                  onCheckedChange={useTrainerStore.getState().toggleTrainerMode}
                />
              </div>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer w-full">
                  Settings & Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

              {/* Mobile Theme Selection & Settings */}
              <motion.div
                className="mt-4 p-3 rounded-lg bg-secondary/50 backdrop-blur-sm"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm font-medium text-muted-foreground">{t('header.theme.label', 'Theme')}</span>
                  <div className="flex bg-background/50 rounded-lg p-1">
                    <Button
                      variant={mode === 'light' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('light')}
                      className="h-7 w-7 p-0"
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={mode === 'dark' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('dark')}
                      className="h-7 w-7 p-0"
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={mode === 'system' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('system')}
                      className="h-7 w-7 p-0"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="default" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    {t('profile.title', 'Settings & Profile')}
                  </Button>
                </Link>

                <div className="flex items-center justify-between mb-3 px-1 mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base text-muted-foreground">{t('header.trainer_mode', 'Trainer Mode')}</Label>
                  </div>
                  <Switch
                    checked={isTrainerMode}
                    onCheckedChange={useTrainerStore.getState().toggleTrainerMode}
                  />
                </div>
              </motion.div>
            </motion.nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
