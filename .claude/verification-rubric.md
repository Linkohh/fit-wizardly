# Internal Verification Rubric — Full-Page Glassmorphism + UI Polish

## Scoring: Each item 0-10. Must average 9.0+ to pass.

### A. Blob Visibility (Top-to-Bottom)
| # | Criterion | Desktop | Mobile | Tablet |
|---|-----------|---------|--------|--------|
| A1 | Blobs visible through hero section | | | |
| A2 | Blobs visible through middle content zone | | | |
| A3 | Blobs visible through feature cards area | | | |
| A4 | Blob colors distinguishable (not muddy wash) | | | |
| A5 | Scroll-driven opacity fade works (desktop) | | | |

### B. iOS 26 Glassmorphism
| # | Criterion | Desktop | Mobile | Tablet |
|---|-----------|---------|--------|--------|
| B1 | Daily Quote card has frosted glass effect | | | |
| B2 | Features heading has glass treatment | | | |
| B3 | Feature cards show glass + blob tint bleed | | | |
| B4 | Glass effect not overwhelming / readable | | | |
| B5 | Fallback renders for non-backdrop-filter browsers | | | |

### C. Hero Section
| # | Criterion | Desktop | Mobile | Tablet |
|---|-----------|---------|--------|--------|
| C1 | "Full Potential" text fully visible, not clipped | | | |
| C2 | Text scales properly per breakpoint | | | |
| C3 | Spacing below CTA → periodization card is balanced | | | |
| C4 | Drop shadows maintain text legibility | | | |
| C5 | Hero bloom/glow not overpowering blobs | | | |

### D. Dark Mode vs Light Mode
| # | Criterion | Dark | Light |
|---|-----------|------|-------|
| D1 | Blob mix-blend-mode correct (screen/normal) | | |
| D2 | Glass card opacity appropriate per mode | | |
| D3 | Text contrast meets readability standards | | |
| D4 | Horizon bridge renders correctly | | |

### E. Offline Banner
| # | Criterion | Pass? |
|---|-----------|-------|
| E1 | Thin pill shape, not intrusive | |
| E2 | Liquid glass red design with backdrop-blur | |
| E3 | Auto-dismisses after 4 seconds | |
| E4 | Smooth entrance animation (blur → clear) | |
| E5 | Smooth exit animation (blur + scale) | |
| E6 | Positioned below navbar, doesn't overlap | |

### F. Performance & Accessibility
| # | Criterion | Pass? |
|---|-----------|-------|
| F1 | No console errors | |
| F2 | prefers-reduced-motion disables blob animations | |
| F3 | 60fps maintained (no jank during scroll) | |
| F4 | Mobile renders 5 blobs (GPU optimization) | |
| F5 | aria-hidden on decorative elements | |

### G. Symmetry & Scaling
| # | Criterion | Desktop | Mobile | Tablet |
|---|-----------|---------|--------|--------|
| G1 | Content centered and symmetrical | | | |
| G2 | No horizontal overflow / scrollbar | | | |
| G3 | Cards/sections have consistent spacing | | | |
| G4 | Buttons properly sized per viewport | | | |
