import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Users, Menu, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainerStore } from '@/stores/trainerStore';
import { useThemeStore } from '@/stores/themeStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img alt="FitWizard Logo" className="h-full w-full object-contain" src="/lovable-uploads/85daa486-f2ec-4130-b122-65b217aecb1c.png" />
          </div>
          <span className="text-3xl font-bold gradient-text">FitWizard</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map(item => <Link key={item.path} to={item.path}>
              <Button variant={isActive(item.path) ? 'default' : 'ghost'} className="touch-target">
                {item.label}
              </Button>
            </Link>)}
        </nav>

        {/* Right Side Controls */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target" aria-label="Toggle theme">
                <ThemeIcon className="h-5 w-5" />
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
            <Users className={`h-4 w-4 ${isTrainerMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="trainer-mode" className="text-sm font-medium cursor-pointer">
              Trainer Mode
            </Label>
            <Switch id="trainer-mode" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
          </div>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="touch-target" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-2 mt-8" role="navigation" aria-label="Mobile navigation">
              {navItems.map(item => <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                  <Button variant={isActive(item.path) ? 'default' : 'ghost'} className="w-full justify-start touch-target">
                    {item.label}
                  </Button>
                </Link>)}

              {/* Mobile Theme Selection */}
              <div className="flex flex-col gap-2 mt-4 p-3 rounded-lg bg-secondary/50">
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
              </div>

              {/* Mobile Trainer Mode */}
              <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-secondary/50">
                <Users className={`h-4 w-4 ${isTrainerMode ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="trainer-mode-mobile" className="text-sm font-medium flex-1">
                  Trainer Mode
                </Label>
                <Switch id="trainer-mode-mobile" checked={isTrainerMode} onCheckedChange={toggleTrainerMode} aria-label="Toggle trainer mode" />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>;
}