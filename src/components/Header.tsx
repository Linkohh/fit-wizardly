import { Link, useLocation } from 'react-router-dom';
import { Users, Menu, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainerStore } from '@/stores/trainerStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
export function Header() {
  const location = useLocation();
  const {
    isTrainerMode,
    toggleTrainerMode
  } = useTrainerStore();
  const {
    mode,
    setMode,
    getEffectiveTheme
  } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [{
    path: '/',
    label: 'Home'
  }, {
    path: '/wizard',
    label: 'Create Plan'
  }, {
    path: '/plan',
    label: 'View Plan'
  }, {
    path: '/exercises',
    label: 'Exercises'
  }, {
    path: '/circles',
    label: 'Circles'
  }, ...(isTrainerMode ? [{
    path: '/clients',
    label: 'Clients'
  }] : [])];
  const isActive = (path: string) => location.pathname === path;
  const effectiveTheme = getEffectiveTheme();
  const ThemeIcon = mode === 'system' ? Monitor : effectiveTheme === 'dark' ? Moon : Sun;
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-16 items-center justify-between px-4">
      {/* Logo */}
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
        <span className="text-3xl font-bold gradient-text">FitWizard</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
        <LayoutGroup>
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="relative">
                {active && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary/10 rounded-md"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  className={cn(
                    "relative z-10 touch-target transition-colors",
                    active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </LayoutGroup>
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
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode('dark')} className={mode === 'dark' ? 'bg-accent' : ''}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode('system')} className={mode === 'system' ? 'bg-accent' : ''}>
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
          <Label htmlFor="trainer-mode" className="text-sm font-medium cursor-pointer">
            Trainer Mode
          </Label>
          <Switch id="trainer-mode" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="touch-target" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
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
                  staggerChildren: 0.07,
                  delayChildren: 0.1
                }
              }
            }}
          >
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                }}
              >
                <Link to={item.path} onClick={() => setMobileOpen(false)}>
                  <Button variant={isActive(item.path) ? 'default' : 'ghost'} className="w-full justify-start touch-target">
                    {item.label}
                  </Button>
                </Link>
              </motion.div>
            ))}

            {/* Mobile Theme Selection */}
            <motion.div
              className="flex flex-col gap-2 mt-4 p-3 rounded-lg bg-secondary/50"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
            >
              <Label className="text-sm font-medium mb-1">Theme</Label>
              <div className="flex gap-1">
                <Button variant={mode === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('light')} className="flex-1">
                  <Sun className="h-4 w-4" />
                </Button>
                <Button variant={mode === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('dark')} className="flex-1">
                  <Moon className="h-4 w-4" />
                </Button>
                <Button variant={mode === 'system' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('system')} className="flex-1">
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Mobile Trainer Mode */}
            <motion.div
              className={cn(
                "flex items-center gap-3 mt-2 p-3 rounded-lg transition-colors duration-300",
                isTrainerMode ? "bg-primary/20" : "bg-secondary/50"
              )}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
              }}
            >
              <Users className={cn(
                "h-4 w-4 transition-colors duration-300",
                isTrainerMode ? 'text-primary' : 'text-muted-foreground'
              )} />
              <Label htmlFor="trainer-mode-mobile" className="text-sm font-medium flex-1">
                Trainer Mode
              </Label>
              <Switch id="trainer-mode-mobile" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
            </motion.div>
          </motion.nav>
        </SheetContent>
      </Sheet>
    </div>
  </header>;
}