/**
 * Framer Motion Animation Variants - Reusable animation patterns
 *
 * This file contains copy-paste-ready animation variants for Framer Motion.
 * Patterns extracted from WelcomeHero.tsx and other components.
 *
 * Key dependencies:
 * - framer-motion
 *
 * Usage:
 * <motion.div variants={fadeInUp} initial="initial" animate="animate" />
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const springTransition: Transition = {
    type: 'spring',
    stiffness: 400,
    damping: 17,
};

export const smoothSpring: Transition = {
    type: 'spring',
    stiffness: 200,
    damping: 15,
};

export const gentleSpring: Transition = {
    type: 'spring',
    stiffness: 100,
    damping: 30,
};

export const easeOutTransition: Transition = {
    duration: 0.6,
    ease: 'easeOut',
};

// ============================================================================
// PATTERN 1: Page Transitions
// ============================================================================

export const pageTransition: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: 'easeIn',
        },
    },
};

export const slideInFromRight: Variants = {
    initial: { x: '100%', opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
        x: '-100%',
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeIn' },
    },
};

export const slideInFromLeft: Variants = {
    initial: { x: '-100%', opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeIn' },
    },
};

// ============================================================================
// PATTERN 2: Fade Animations
// ============================================================================

export const fadeIn: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

export const fadeInUp: Variants = {
    initial: {
        opacity: 0,
        y: 30,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: 'easeOut',
        },
    },
};

export const fadeInDown: Variants = {
    initial: { opacity: 0, y: -20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' },
    },
};

export const fadeInScale: Variants = {
    initial: {
        opacity: 0,
        scale: 0.8,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.6,
            delay: 0.5,
        },
    },
};

// ============================================================================
// PATTERN 3: Staggered Lists
// ============================================================================

export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const staggerItem: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

// Usage:
// <motion.ul variants={staggerContainer} initial="initial" animate="animate">
//   {items.map(item => (
//     <motion.li key={item.id} variants={staggerItem}>{item.name}</motion.li>
//   ))}
// </motion.ul>

export const staggerFadeIn: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const staggerFadeInItem: Variants = {
    initial: { opacity: 0, x: -10 },
    animate: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.3 },
    },
};

// ============================================================================
// PATTERN 4: Hover Effects
// ============================================================================

export const hoverScale = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.97 },
    transition: springTransition,
};

export const hoverLift = {
    whileHover: {
        y: -4,
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    },
    transition: { duration: 0.2 },
};

export const hoverGlow = {
    whileHover: {
        scale: 1.02,
        boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
    },
    transition: { duration: 0.3 },
};

// Button press effect
export const buttonPress = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.97 },
    transition: {
        type: 'spring',
        stiffness: 400,
        damping: 17,
    },
};

// ============================================================================
// PATTERN 5: Entrance Animations (from WelcomeHero.tsx)
// ============================================================================

// Badge entrance with spring
export const badgeEntrance: Variants = {
    initial: {
        scale: 0,
        rotate: -10,
        opacity: 0,
    },
    animate: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
        },
    },
};

// Headline entrance
export const headlineEntrance: Variants = {
    initial: {
        opacity: 0,
        x: -50,
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
            delay: 0.3,
        },
    },
};

// CTA button entrance
export const ctaEntrance: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            delay: 0.8,
        },
    },
};

// ============================================================================
// PATTERN 6: Looping Animations
// ============================================================================

// Floating animation for decorative elements
export const float: Variants = {
    animate: {
        y: [0, -15, 0],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Pulse animation
export const pulse: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Spin animation
export const spin: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// Glow pulsing
export const glowPulse: Variants = {
    animate: {
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.05, 1],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Arrow bounce
export const arrowBounce: Variants = {
    animate: {
        x: [0, 4, 0],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Icon wiggle
export const wiggle: Variants = {
    animate: {
        rotate: [0, -15, 15, -10, 10, 0],
        scale: [1, 1.2, 1.2, 1.1, 1.1, 1],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 4,
        },
    },
};

// ============================================================================
// PATTERN 7: Floating Orbs (Background Effects)
// ============================================================================

export const floatingOrb1: Variants = {
    animate: {
        x: [0, 100, 50, 0],
        y: [0, -50, 100, 0],
        scale: [1, 1.2, 0.9, 1],
        transition: {
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

export const floatingOrb2: Variants = {
    animate: {
        x: [0, -80, 40, 0],
        y: [0, 80, -40, 0],
        scale: [1, 0.8, 1.1, 1],
        transition: {
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
        },
    },
};

// Rising particles
export const risingParticle = (delay: number, duration: number) => ({
    animate: {
        y: [0, -800],
        opacity: [0, 1, 1, 0],
        transition: {
            duration,
            repeat: Infinity,
            delay,
            ease: 'easeOut',
        },
    },
});

// ============================================================================
// PATTERN 8: Modal Animations
// ============================================================================

export const modalOverlay: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const modalContent: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.2 },
    },
};

// Slide up modal (mobile-friendly)
export const slideUpModal: Variants = {
    initial: {
        y: '100%',
        opacity: 0,
    },
    animate: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 30,
            stiffness: 300,
        },
    },
    exit: {
        y: '100%',
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

// ============================================================================
// PATTERN 9: Card Animations
// ============================================================================

export const cardHover: Variants = {
    initial: {
        scale: 1,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
        scale: 1.02,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2 },
    },
};

export const cardFlip: Variants = {
    initial: { rotateY: 0 },
    flipped: {
        rotateY: 180,
        transition: { duration: 0.6 },
    },
};

// ============================================================================
// PATTERN 10: Skeleton Loading
// ============================================================================

export const shimmer: Variants = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// ============================================================================
// PATTERN 11: 3D Tilt Effect (from WelcomeHero.tsx)
// ============================================================================

/**
 * Creates a 3D tilt effect based on mouse position.
 * Use with useMotionValue and useTransform from framer-motion.
 *
 * Example:
 * const mouseX = useMotionValue(0);
 * const mouseY = useMotionValue(0);
 * const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), gentleSpring);
 * const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), gentleSpring);
 *
 * <motion.div style={{ rotateX, rotateY, transformPerspective: 1000 }}>
 */

export const tiltConfig = {
    range: [-300, 300],
    rotateRange: [-5, 5],
    spring: gentleSpring,
};

// ============================================================================
// UTILITY: Animation wrapper component
// ============================================================================

/**
 * Example wrapper for consistent page animations:
 *
 * import { motion } from 'framer-motion';
 * import { pageTransition } from '@/docs/snippets/animation-variants';
 *
 * export function AnimatedPage({ children }: { children: React.ReactNode }) {
 *   return (
 *     <motion.div
 *       variants={pageTransition}
 *       initial="initial"
 *       animate="animate"
 *       exit="exit"
 *     >
 *       {children}
 *     </motion.div>
 *   );
 * }
 */
