import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { errorMessageVariants } from '@/lib/formAnimations';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          variants={errorMessageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "flex items-start gap-2 text-sm text-destructive mt-1.5",
            className
          )}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
