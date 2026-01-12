import { Variants } from 'framer-motion';

/**
 * Shake animation for form fields with validation errors
 */
export const shakeVariants: Variants = {
  initial: { x: 0 },
  error: {
    x: [-10, 10, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

/**
 * Error message slide-in animation
 */
export const errorMessageVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    height: 0
  },
  animate: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

/**
 * Success checkmark animation
 */
export const successVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15
    }
  }
};

/**
 * Form field validation states
 */
export const fieldVariants: Variants = {
  idle: {
    borderColor: "hsl(var(--border))",
    boxShadow: "none"
  },
  error: {
    borderColor: "hsl(var(--destructive))",
    boxShadow: "0 0 0 3px hsla(var(--destructive), 0.1)",
    transition: {
      duration: 0.2
    }
  },
  success: {
    borderColor: "hsl(142, 76%, 36%)",
    boxShadow: "0 0 0 3px hsla(142, 76%, 36%, 0.1)",
    transition: {
      duration: 0.2
    }
  }
};
