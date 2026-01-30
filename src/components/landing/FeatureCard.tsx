import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedIcon } from '@/components/ui/page-transition';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

// Spring configurations for natural feel
const springConfig = { stiffness: 400, damping: 25 };
const gentleSpring = { stiffness: 150, damping: 20 };

export interface FeatureCardFeature {
    key: string;
    icon: LucideIcon;
    title: string;
    description: string;
    variant: 'strength' | 'achievement' | 'magic' | 'cosmic';
    gradient: string;
}

interface FeatureCardProps {
    feature: FeatureCardFeature;
    onClick?: () => void;
}

export function FeatureCard({ feature, onClick }: FeatureCardProps) {
    const { t } = useTranslation();

    // Mouse position for subtle 3D tilt effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Transform mouse position to rotation with spring physics
    const rotateX = useSpring(useTransform(mouseY, [-150, 150], [3, -3]), gentleSpring);
    const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-3, 3]), gentleSpring);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for premium feel
                    }
                }
            }}
            style={{
                rotateX,
                rotateY,
                transformPerspective: 1000,
            }}
            whileHover={{
                y: -10,
                scale: 1.02,
                transition: { type: "spring", ...springConfig }
            }}
            whileTap={{
                scale: 0.97,
                y: -5,
                transition: { type: "spring", stiffness: 500, damping: 30 }
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group"
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={t('features.modal.try_it') + ': ' + feature.title}
        >
            <Card
                variant="interactive"
                className="relative text-center h-full bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/40 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Glow effect */}
                <motion.div
                    className={`absolute -inset-px bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                    style={{ zIndex: -1 }}
                />

                <CardContent className="p-6 relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div
                                className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-shadow duration-500 cursor-pointer overflow-visible relative`}
                                initial={{ scale: 1, rotate: 0 }}
                                whileHover={{
                                    scale: 1.12,
                                    rotate: [0, -3, 3, 0],
                                    transition: {
                                        scale: { type: "spring", stiffness: 400, damping: 15 },
                                        rotate: { duration: 0.4, ease: "easeInOut" }
                                    }
                                }}
                                whileTap={{
                                    scale: 0.95,
                                    transition: { type: "spring", stiffness: 500, damping: 20 }
                                }}
                            >
                                <AnimatedIcon>
                                    <feature.icon className="h-7 w-7 text-white" />
                                </AnimatedIcon>

                                {/* Pulse ring - smoother animation */}
                                <motion.div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient}`}
                                    animate={{
                                        scale: [1, 1.4],
                                        opacity: [0.5, 0]
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: [0.25, 0.46, 0.45, 0.94]
                                    }}
                                />

                                {/* Secondary pulse for depth */}
                                <motion.div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient}`}
                                    animate={{
                                        scale: [1, 1.25],
                                        opacity: [0.3, 0]
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                        delay: 0.5
                                    }}
                                />
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{feature.description}</p>
                        </TooltipContent>
                    </Tooltip>

                    <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                    </p>

                    {/* Arrow indicator with smooth bounce animation */}
                    <motion.div
                        className="mt-4 flex items-center justify-center gap-1 text-primary"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 0, y: 5 }}
                        whileInView={{ opacity: 0, y: 5 }}
                        variants={{
                            hover: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                    delay: 0.1
                                }
                            }
                        }}
                    >
                        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {t('features.modal.try_it')}
                        </span>
                        <motion.span
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            animate={{
                                x: [0, 4, 0]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 0.5
                            }}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </motion.span>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
