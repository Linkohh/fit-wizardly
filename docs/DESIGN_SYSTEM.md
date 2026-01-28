# Design & UI/UX Context

> **Lens Purpose**: This document defines the visual language, component patterns, animation standards, and accessibility requirements. Read this before implementing any UI feature.

---

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [Design Tokens](#design-tokens)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Component Library](#component-library)
- [Animation & Motion](#animation--motion)
- [Responsive Design](#responsive-design)
- [Accessibility (a11y)](#accessibility-a11y)
- [Dark Mode](#dark-mode)
- [Icons](#icons)
- [Forms](#forms)
- [Patterns & Anti-Patterns](#patterns--anti-patterns)

---

## Design Philosophy

### Core Principles

1. **Rich Aesthetics & Premium Feel**
   - The app should feel "alive" with subtle animations and micro-interactions
   - Avoid generic Bootstrap/Material looks
   - Use deep, curated colors and glassmorphism effects

2. **Motion with Purpose**
   - Every animation should have a reason (feedback, direction, delight)
   - Never animate just for the sake of it
   - Respect `prefers-reduced-motion`

3. **Accessibility First**
   - All interactive elements must be keyboard accessible
   - Color contrast ratios must meet WCAG 2.1 AA
   - Screen reader support is mandatory

4. **Mobile-First, Desktop-Enhanced**
   - Design for mobile constraints first
   - Enhance with additional features on larger screens
   - Touch targets minimum 44x44px

---

## Design Tokens

Defined in `tailwind.config.ts`. These are the single source of truth.

### Token Categories

| Category | Location | Example |
|----------|----------|---------|
| Colors | `theme.extend.colors` | `primary`, `neon.pink` |
| Spacing | Tailwind defaults | `p-4`, `gap-6` |
| Typography | Tailwind defaults | `text-lg`, `font-semibold` |
| Shadows | `theme.extend.boxShadow` | `shadow-glow` |
| Animations | `theme.extend.animation` | `animate-float` |
| Border Radius | `theme.extend.borderRadius` | `rounded-lg` |

---

## Color System

### Semantic Colors

```typescript
// CSS variables defined in index.css, consumed via Tailwind
colors: {
  background: "hsl(var(--background))",      // Page background
  foreground: "hsl(var(--foreground))",      // Primary text
  primary: "hsl(var(--primary))",            // Brand/action color
  secondary: "hsl(var(--secondary))",        // Secondary actions
  muted: "hsl(var(--muted))",                // Subdued backgrounds
  accent: "hsl(var(--accent))",              // Highlights
  destructive: "hsl(var(--destructive))",    // Errors/delete actions
  border: "hsl(var(--border))",              // Border color
  input: "hsl(var(--input))",                // Input borders
  ring: "hsl(var(--ring))",                  // Focus rings
}
```

### Neon Accent Palette

```typescript
// For premium/gamification effects
neon: {
  pink: "#FF00FF",    // Achievement highlights
  purple: "#BC13FE",  // Progress indicators
  cyan: "#00FFFF",    // Active states
}
```

### Muscle Group Colors

```typescript
// Anatomy visualization
muscle: {
  chest: '#EF4444',     // Red
  back: '#F97316',      // Orange
  shoulders: '#EAB308', // Yellow
  arms: '#22C55E',      // Green
  core: '#3B82F6',      // Blue
  legs: '#8B5CF6',      // Purple
  glutes: '#EC4899',    // Pink
  calves: '#06B6D4',    // Cyan
}
```

### Color Usage Guidelines

```tsx
// Primary actions (buttons, links)
<Button className="bg-primary text-primary-foreground" />

// Secondary/ghost actions
<Button variant="ghost" className="text-muted-foreground" />

// Destructive actions
<Button variant="destructive" />

// Backgrounds
<div className="bg-background" />           // Main background
<div className="bg-muted" />                // Card/section background
<div className="bg-card" />                 // Elevated card background

// Text
<p className="text-foreground" />           // Primary text
<p className="text-muted-foreground" />     // Secondary text

// Borders
<div className="border border-border" />    // Default borders
<div className="ring-2 ring-ring" />        // Focus states
```

---

## Typography

### Scale

| Class | Size | Use Case |
|-------|------|----------|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Secondary text, metadata |
| `text-base` | 16px | Body text (default) |
| `text-lg` | 18px | Lead paragraphs |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | Page headings |
| `text-3xl` | 30px | Hero text |
| `text-4xl` | 36px | Display text |

### Weight

| Class | Weight | Use Case |
|-------|--------|----------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons |
| `font-semibold` | 600 | Headings, emphasis |
| `font-bold` | 700 | Strong emphasis |

### Typography Patterns

```tsx
// Page heading
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>

// Section heading
<h2 className="text-xl font-semibold">Section Title</h2>

// Body text
<p className="text-base text-foreground">Main content...</p>

// Secondary text
<p className="text-sm text-muted-foreground">Additional info...</p>

// Label
<label className="text-sm font-medium">Field Label</label>

// Error text
<span className="text-sm text-destructive">Error message</span>
```

---

## Spacing & Layout

### Spacing Scale

| Class | Size | Use Case |
|-------|------|----------|
| `p-1` / `gap-1` | 4px | Tight spacing |
| `p-2` / `gap-2` | 8px | Compact elements |
| `p-3` / `gap-3` | 12px | Default tight |
| `p-4` / `gap-4` | 16px | Standard spacing |
| `p-6` / `gap-6` | 24px | Section spacing |
| `p-8` / `gap-8` | 32px | Large sections |
| `p-12` / `gap-12` | 48px | Page sections |

### Layout Patterns

```tsx
// Page container
<div className="container mx-auto px-4 py-8">
  {/* Content */}
</div>

// Card with consistent padding
<Card className="p-6">
  <CardHeader className="pb-4">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content with vertical spacing */}
  </CardContent>
</Card>

// Flex layouts
<div className="flex items-center gap-4">      // Horizontal with gap
<div className="flex flex-col gap-2">          // Vertical stack

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>
```

---

## Component Library

### Base: shadcn/ui

All primitive components live in `src/components/ui/`. These are the foundation.

**Rule**: Do NOT modify shadcn/ui components directly. Extend them in feature components.

### Available Components

| Component | Import | Use Case |
|-----------|--------|----------|
| `Button` | `@/components/ui/button` | Actions, CTAs |
| `Input` | `@/components/ui/input` | Text input |
| `Select` | `@/components/ui/select` | Dropdown selection |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs |
| `Card` | `@/components/ui/card` | Content containers |
| `Tabs` | `@/components/ui/tabs` | Tab navigation |
| `Toast` | `sonner` | Notifications |
| `Form` | `@/components/ui/form` | Form handling |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |

### Component Composition Pattern

```tsx
// DON'T: Modify shadcn/ui directly
// DO: Compose custom components

// src/components/WorkoutCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WorkoutCardProps {
  workout: Workout;
  onStart: () => void;
}

export function WorkoutCard({ workout, onStart }: WorkoutCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{workout.name}</CardTitle>
          <Badge variant="secondary">{workout.duration}min</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {workout.exercises.length} exercises
        </p>
        <Button onClick={onStart} className="w-full">
          Start Workout
        </Button>
      </CardContent>
    </Card>
  );
}
```

### The `cn()` Utility

```tsx
import { cn } from '@/lib/utils';

// Merge conditional classes safely
<div
  className={cn(
    'base-classes px-4 py-2',
    isActive && 'bg-primary text-primary-foreground',
    isDisabled && 'opacity-50 cursor-not-allowed',
    className // Allow parent override
  )}
/>
```

---

## Animation & Motion

### Framer Motion (Complex Animations)

Use for page transitions, component entrances, and interactive animations.

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// Page transition wrapper
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
</AnimatePresence>

// List item stagger
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### Tailwind CSS Animations (Simple Effects)

Use for hover states, continuous effects, and simple transitions.

```tsx
// Available animation classes
animate-pulse-subtle   // Subtle opacity pulse
animate-glow           // Glow effect
animate-float          // Floating up/down
animate-shimmer        // Loading shimmer
animate-fade-in        // Fade in with slide
animate-scale-in       // Scale entrance
animate-slide-in       // Slide from side
animate-card-lift      // Hover lift effect

// Usage
<div className="animate-float shadow-glow">
  Premium Content
</div>

// Hover animations
<Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">

// Button hover
<Button className="transition-transform hover:scale-105 active:scale-95">
```

### Animation Performance Rules

```tsx
// GOOD: Use transform and opacity (GPU accelerated)
animate={{ x: 100, opacity: 1 }}

// BAD: Animate layout properties
animate={{ left: 100, width: 200 }}

// Respect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

---

## Responsive Design

### Breakpoints

| Prefix | Min Width | Use Case |
|--------|-----------|----------|
| (none) | 0px | Mobile first (default) |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

### Responsive Patterns

```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">

// Responsive visibility
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive flex direction
<div className="flex flex-col md:flex-row gap-4">
```

### Mobile Navigation Pattern

```tsx
// Use Sheet for mobile navigation
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="animate-sheet-slide-in">
        <nav className="flex flex-col gap-4">
          {/* Nav items */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### Touch Targets

```tsx
// Minimum 44x44px touch targets
<Button className="min-h-[44px] min-w-[44px]">

// Icon buttons
<Button variant="ghost" size="icon" className="h-11 w-11">
  <Settings className="h-5 w-5" />
</Button>

// List items
<li className="py-3 px-4 min-h-[44px] flex items-center">
```

---

## Accessibility (a11y)

### Keyboard Navigation

```tsx
// All interactive elements must be focusable
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Clickable content
</div>

// Focus visible styles
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

// Skip link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2"
>
  Skip to content
</a>
```

### ARIA Labels

```tsx
// Icon-only buttons need labels
<Button variant="ghost" size="icon" aria-label="Open settings">
  <Settings className="h-5 w-5" />
</Button>

// Progress indicators
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Workout progress"
>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Form labels
<Label htmlFor="email">Email address</Label>
<Input id="email" type="email" aria-describedby="email-hint" />
<p id="email-hint" className="text-sm text-muted-foreground">
  We'll never share your email.
</p>
```

### Color Contrast

```tsx
// Ensure minimum contrast ratios
// Normal text: 4.5:1
// Large text (18px+ or 14px bold): 3:1

// Use semantic colors that are pre-tested
<p className="text-foreground">High contrast text</p>
<p className="text-muted-foreground">Secondary text (still meets contrast)</p>

// Error states
<p className="text-destructive">Error with sufficient contrast</p>
```

### Screen Reader Support

```tsx
// Hidden but accessible content
<span className="sr-only">Opens in new tab</span>

// Accessible icons with text
<Button>
  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
  Save changes
</Button>

// Loading states
<Button disabled aria-busy="true">
  <Loader className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
  <span>Saving...</span>
</Button>
```

---

## Dark Mode

### Implementation

Handled by `src/stores/themeStore.ts`. Toggles `.dark` class on `<html>`.

```typescript
// Theme options
type Theme = 'light' | 'dark' | 'system';

// Store usage
const { theme, setTheme } = useThemeStore();
```

### Dark Mode Classes

```tsx
// Background
<div className="bg-white dark:bg-gray-900">

// Text
<p className="text-gray-900 dark:text-gray-100">

// Borders
<div className="border-gray-200 dark:border-gray-700">

// Shadows (more subtle in dark mode)
<Card className="shadow-lg dark:shadow-none dark:border">

// Semantic colors handle this automatically
<div className="bg-background text-foreground">
  Uses CSS variables that change with theme
</div>
```

### Testing Dark Mode

1. Toggle theme in app
2. Check all text is readable
3. Verify borders are visible
4. Ensure focus states are clear
5. Test with system preference

---

## Icons

### Library: Lucide React

```tsx
import {
  ChevronRight,
  Settings,
  User,
  Save,
  Loader,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

// Standard sizing
<ChevronRight className="h-4 w-4" />   // Small
<ChevronRight className="h-5 w-5" />   // Default
<ChevronRight className="h-6 w-6" />   // Large

// With text
<Button>
  <Save className="h-4 w-4 mr-2" />
  Save
</Button>

// Icon-only (needs aria-label)
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-5 w-5" />
</Button>

// Status icons
<AlertCircle className="h-4 w-4 text-destructive" />
<Check className="h-4 w-4 text-green-500" />
```

### Icon Colors

```tsx
// Inherit from parent
<Button className="text-primary">
  <Save className="h-4 w-4" /> {/* Inherits text-primary */}
</Button>

// Explicit color
<AlertCircle className="h-4 w-4 text-destructive" />
<Check className="h-4 w-4 text-green-500" />

// Muted icons
<ChevronRight className="h-4 w-4 text-muted-foreground" />
```

---

## Forms

### Form Structure

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

function WorkoutForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      duration: 30,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Morning Routine" {...field} />
              </FormControl>
              <FormDescription>
                Give your workout a memorable name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Create Workout'}
        </Button>
      </form>
    </Form>
  );
}
```

### Form States

```tsx
// Loading/disabled state
<Input disabled className="opacity-50 cursor-not-allowed" />

// Error state
<Input
  className={cn(
    form.formState.errors.name && 'border-destructive focus-visible:ring-destructive'
  )}
/>

// Success state (after validation)
<Input className="border-green-500 focus-visible:ring-green-500" />
```

### Input Patterns

```tsx
// Text input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Input with button
<div className="flex gap-2">
  <Input placeholder="Enter code" />
  <Button>Apply</Button>
</div>

// Textarea
<Textarea
  placeholder="Describe your workout..."
  className="min-h-[100px] resize-none"
/>
```

---

## Patterns & Anti-Patterns

### DO (Good Patterns)

```tsx
// Use semantic colors
<div className="bg-background text-foreground">

// Use cn() for conditional classes
<div className={cn('base', condition && 'active')}>

// Provide loading states
{isLoading ? <Skeleton className="h-10 w-full" /> : <Content />}

// Handle empty states
{items.length === 0 ? <EmptyState /> : <List items={items} />}

// Use consistent spacing
<div className="space-y-4">
  <Item />
  <Item />
</div>

// Add transition for interactive elements
<Card className="transition-shadow hover:shadow-lg">
```

### DON'T (Anti-Patterns)

```tsx
// Don't use arbitrary values when tokens exist
<div className="p-[17px]">  // BAD
<div className="p-4">       // GOOD

// Don't hardcode colors
<div className="bg-[#1a1a1a]">  // BAD
<div className="bg-background">  // GOOD

// Don't skip loading states
{data && <Content data={data} />}  // BAD - no loading state

// Don't use inline styles
<div style={{ padding: '16px' }}>  // BAD
<div className="p-4">               // GOOD

// Don't forget dark mode
<div className="bg-white">              // BAD
<div className="bg-white dark:bg-gray-900">  // GOOD
<div className="bg-background">         // BEST
```

### Component Checklist

- [ ] Uses semantic color tokens
- [ ] Handles loading state
- [ ] Handles error state
- [ ] Handles empty state
- [ ] Keyboard accessible
- [ ] Has proper ARIA labels
- [ ] Works in dark mode
- [ ] Responsive on all breakpoints
- [ ] Animations respect reduced motion
- [ ] Touch targets are 44px+
