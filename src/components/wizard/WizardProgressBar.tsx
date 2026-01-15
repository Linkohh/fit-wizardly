import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WizardProgressBarProps {
    currentStepIndex: number;
    totalSteps?: number;
    className?: string;
}

export function WizardProgressBar({
    currentStepIndex,
    totalSteps = 6,
    className
}: WizardProgressBarProps) {
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    return (
        <div className={cn("w-full", className)}>
            {/* Track */}
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Animated fill */}
                <motion.div
                    className="h-full rounded-full gradient-primary relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                >
                    {/* Glow effect on the leading edge */}
                    <motion.div
                        className="absolute right-0 top-0 bottom-0 w-8"
                        style={{
                            background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.6))',
                            filter: 'blur(4px)',
                        }}
                        animate={{
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </motion.div>
            </div>
        </div>
    );
}
