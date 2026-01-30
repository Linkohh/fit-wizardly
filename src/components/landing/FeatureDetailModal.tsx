import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, X, Sparkles } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { FeatureCardFeature } from './FeatureCard';

// Refined spring configurations for premium feel
const smoothSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };
const gentleSpring = { type: 'spring' as const, stiffness: 200, damping: 22 };
const bounceSpring = { type: 'spring' as const, stiffness: 400, damping: 15 };

// Exit animation spring - slightly faster for snappy close
const exitSpring = { type: 'spring' as const, stiffness: 350, damping: 28 };

// Modal animation variants for shrinking exit effect
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.25, delay: 0.05 } },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...smoothSpring, delay: 0.05 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 15,
    transition: exitSpring,
  },
};

export type Feature = FeatureCardFeature;

interface FeatureDetailModalProps {
  feature: Feature | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDetailModal({ feature, isOpen, onClose }: FeatureDetailModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Lock body scroll when modal is open (desktop only - Drawer handles mobile)
  useEffect(() => {
    if (isOpen && !isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  if (!feature) return null;

  const benefits = t(`features.${feature.key}.detail.benefits`, { returnObjects: true }) as string[];
  const howItWorks = t(`features.${feature.key}.detail.how_it_works`);
  const example = t(`features.${feature.key}.detail.example`);

  const handleTryIt = () => {
    onClose();
    navigate('/wizard');
  };

  const ModalContent = () => (
    <motion.div
      className="flex flex-col h-0 flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Hero Header with Gradient - Rounded top corners for premium feel */}
      <div className={`relative bg-gradient-to-br ${feature.gradient} p-6 sm:p-8 md:p-10 rounded-t-[10px] sm:rounded-t-lg md:rounded-t-xl overflow-hidden`}>
        {/* Animated glow overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-t-[10px] sm:rounded-t-lg md:rounded-t-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />

        {/* Subtle shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Icon with bounce entrance */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...bounceSpring, delay: 0.15 }}
            className="mb-4 rounded-2xl bg-white/20 backdrop-blur-sm p-4 shadow-lg relative"
          >
            <feature.icon className="h-10 w-10 text-white" />

            {/* Sparkle effect on entrance */}
            <motion.div
              className="absolute -top-1 -right-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Sparkles className="h-4 w-4 text-white/80" />
            </motion.div>
          </motion.div>

          {/* Title with slide up */}
          <motion.h2
            id="feature-modal-title"
            className="text-2xl sm:text-3xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentleSpring, delay: 0.2 }}
          >
            {feature.title}
          </motion.h2>

          {/* Description with fade in */}
          <motion.p
            className="text-white/90 text-sm sm:text-base max-w-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentleSpring, delay: 0.3 }}
          >
            {feature.description}
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Benefits Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothSpring, delay: 0.35 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <motion.span
                className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${feature.gradient}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...bounceSpring, delay: 0.4 }}
                style={{ originY: 0 }}
              />
              {t('features.modal.benefits_title')}
            </h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    ...smoothSpring,
                    delay: 0.45 + index * 0.08
                  }}
                  className="flex items-start gap-3"
                >
                  <motion.span
                    className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mt-0.5`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...bounceSpring, delay: 0.5 + index * 0.08 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.span>
                  <span className="text-muted-foreground leading-relaxed">{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          {/* How It Works Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothSpring, delay: 0.55 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <motion.span
                className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${feature.gradient}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...bounceSpring, delay: 0.6 }}
                style={{ originY: 0 }}
              />
              {t('features.modal.how_it_works_title')}
            </h3>
            <motion.p
              className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.65 }}
            >
              {howItWorks}
            </motion.p>
          </motion.section>

          {/* Example Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothSpring, delay: 0.7 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <motion.span
                className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${feature.gradient}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...bounceSpring, delay: 0.75 }}
                style={{ originY: 0 }}
              />
              {t('features.modal.example_title')}
            </h3>
            <motion.div
              className="bg-muted/50 rounded-lg p-4 border border-border/50"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...gentleSpring, delay: 0.8 }}
            >
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                {example}
              </p>
            </motion.div>
          </motion.section>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 sm:p-6 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smoothSpring, delay: 0.85 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={handleTryIt}
              className={`w-full bg-gradient-to-r ${feature.gradient} text-white font-semibold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl`}
              size="lg"
            >
              {t('features.modal.try_it')}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              >
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto w-full"
              size="lg"
            >
              {t('features.modal.close')}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh] overflow-hidden">
          <DrawerTitle className="sr-only">{feature.title}</DrawerTitle>
          <DrawerClose className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/30 transition-colors">
            <X className="h-4 w-4" />
            <span className="sr-only">{t('features.modal.close')}</span>
          </DrawerClose>
          <ModalContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Custom animated modal with shrinking exit effect
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="modal-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal centering wrapper - uses flex to avoid transform conflicts */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8 sm:p-12 md:p-16 pointer-events-none">
            {/* Modal container */}
            <motion.div
              key="modal-container"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl max-h-full pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="feature-modal-title"
            >
              <div className="relative rounded-xl overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl max-h-[75vh] flex flex-col overscroll-contain">
                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white hover:bg-black/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">{t('features.modal.close')}</span>
                </motion.button>

                <ModalContent />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
