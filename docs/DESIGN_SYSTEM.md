# Design & UI/UX Context

## Design Philosophy
**"Rich Aesthetics & Premium Feel"**
- **User Experience**: The app should feel "alive". Use hover effects, smooth transitions (`framer-motion`), and micro-interactions.
- **Visuals**: Avoid generic Bootstrap/Material looks. Use deep, curated colors and glassmorphism.

## Design Tokens (Tailwind)
Defined in `tailwind.config.ts`.

### Colors
- **Semantic**: `primary`, `secondary`, `accent`, `destructive`, `muted`.
- **Neon Accents**:
  - `neon.pink`: `#FF00FF`
  - `neon.purple`: `#BC13FE`
  - `neon.cyan`: `#00FFFF`
- **Muscle Groups**: Specific mapping for anatomy visualization (e.g., `muscle.chest: #EF4444`).

### Theming
- **Mode**: Handled by `src/stores/themeStore.ts`. Supports `light`, `dark`, `system`.
- **Mechanism**: Toggles `.dark` class on `<html>`.
- **Usage**: Use `dark:` variants in Tailwind classes.

## Animation & Motion
### Framer Motion
Preferred for complex component entrances and page transitions.
- **Page Transition**: `src/components/ui/page-transition.tsx` wraps routes.
- **Standard**: `<AnimatePresence mode="wait">` is used for route changes.

### CSS Keyframes (Tailwind)
Use for continuous, subtle effects.
- `animate-pulse-subtle`
- `animate-glow`
- `animate-float`
- `animate-shimmer`

**Example Usage**:
```tsx
<div className="animate-float shadow-glow">
  Premium Content
</div>
```

## Component Library
- **Base**: `shadcn/ui` (in `src/components/ui/`).
- **Guideline**: Do not re-invent primitives. Use `Button`, `Dialog`, `Input` from the UI folder.
- **Icons**: Lucide React.
