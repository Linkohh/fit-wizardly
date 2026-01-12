import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Wand2,
  Users,
  Dumbbell,
  User,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  Home,
  Trophy,
  Target,
  Calendar
} from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { useCircleStore } from '@/stores/circleStore';
import { useAuthStore } from '@/stores/authStore';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { currentPlan } = usePlanStore();
  const { circles } = useCircleStore();
  const { user, signOut } = useAuthStore();

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleCommand = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Commands */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => handleCommand(() => navigate('/'))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>H
            </kbd>
          </CommandItem>

          <CommandItem
            onSelect={() => handleCommand(() => navigate('/wizard'))}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            <span>Create New Plan</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>N
            </kbd>
          </CommandItem>

          <CommandItem
            onSelect={() => handleCommand(() => navigate('/circles'))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Circles</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>C
            </kbd>
          </CommandItem>

          <CommandItem
            onSelect={() => handleCommand(() => navigate('/exercises'))}
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            <span>Exercise Library</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>E
            </kbd>
          </CommandItem>

          <CommandItem
            onSelect={() => handleCommand(() => navigate('/achievements'))}
          >
            <Trophy className="mr-2 h-4 w-4" />
            <span>Achievements</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Current Plan Commands */}
        {currentPlan && (
          <>
            <CommandGroup heading="Current Plan">
              <CommandItem
                onSelect={() => handleCommand(() => navigate('/plan'))}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>View Current Plan</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>P
                </kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => handleCommand(() => navigate('/plan'))}
              >
                <Target className="mr-2 h-4 w-4" />
                <span>Start Today's Workout</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

        {/* Circles Commands */}
        {circles.length > 0 && (
          <>
            <CommandGroup heading="Your Circles">
              {circles.slice(0, 3).map((circle) => (
                <CommandItem
                  key={circle.id}
                  onSelect={() => handleCommand(() => navigate('/circles'))}
                >
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  <span>{circle.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {circle.member_count} members
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />
          </>
        )}

        {/* User Actions */}
        <CommandGroup heading="Account">
          {user ? (
            <>
              <CommandItem
                onSelect={() => handleCommand(() => navigate('/profile'))}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleCommand(() => navigate('/settings'))}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>

              <CommandItem
                onSelect={() => handleCommand(() => signOut())}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </CommandItem>
            </>
          ) : (
            <CommandItem
              onSelect={() => handleCommand(() => navigate('/auth'))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Help & Resources */}
        <CommandGroup heading="Help & Resources">
          <CommandItem
            onSelect={() => handleCommand(() => window.open('https://docs.fitwizardly.com', '_blank'))}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Documentation</span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleCommand(() => navigate('/exercises'))}
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            <span>Browse Exercises</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
