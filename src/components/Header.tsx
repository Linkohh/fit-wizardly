import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTrainerStore } from '@/stores/trainerStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export function Header() {
  const location = useLocation();
  const { isTrainerMode, toggleTrainerMode } = useTrainerStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/wizard', label: 'Create Plan' },
    { path: '/plan', label: 'View Plan' },
    ...(isTrainerMode ? [{ path: '/clients', label: 'Clients' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 touch-target">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">FitWizard</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button 
                variant={isActive(item.path) ? 'default' : 'ghost'}
                className="touch-target"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Trainer Mode Toggle */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
            <Users className={`h-4 w-4 ${isTrainerMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label htmlFor="trainer-mode" className="text-sm font-medium cursor-pointer">
              Trainer Mode
            </Label>
            <Switch
              id="trainer-mode"
              checked={isTrainerMode}
              onCheckedChange={toggleTrainerMode}
              aria-label="Toggle trainer mode"
            />
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
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                  <Button 
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    className="w-full justify-start touch-target"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-secondary/50">
                <Users className={`h-4 w-4 ${isTrainerMode ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="trainer-mode-mobile" className="text-sm font-medium flex-1">
                  Trainer Mode
                </Label>
                <Switch
                  id="trainer-mode-mobile"
                  checked={isTrainerMode}
                  onCheckedChange={toggleTrainerMode}
                  aria-label="Toggle trainer mode"
                />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
