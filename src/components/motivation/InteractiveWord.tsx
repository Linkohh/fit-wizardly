import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, Flame, MoveUp } from 'lucide-react';

type AnimationType = 'unleash' | 'your' | 'full' | 'potential' | 'default';

interface InteractiveWordProps {
    word: string;
    type?: AnimationType;
    className?: string;
    delay?: number;
}

export function InteractiveWord({ word, type = 'default', className, delay = 0 }: InteractiveWordProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handleClick = () => {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 1500); // Reset after animation
    };

    const variants = {
        unleash: {
            animate: {
                scale: [1, 1.2, 0.9, 1.05, 1],
                rotate: [0, -5, 5, -5, 0],
                color: ["#ffffff", "#ef4444", "#f97316", "#ffffff"], // White -> Red -> Orange -> White
                transition: { duration: 0.6, ease: "easeInOut" as const }
            }
        },
        your: {
            animate: {
                scale: [1, 1.15, 1],
                y: [0, -5, 0],
                textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 20px rgba(139,92,246,0.6)",
                    "0 0 0px rgba(255,255,255,0)"
                ],
                transition: { duration: 0.8, ease: "easeOut" as const }
            }
        },
        full: {
            animate: {
                letterSpacing: ["0em", "0.1em", "0em"],
                fontWeight: [800, 900, 800],
                scaleX: [1, 1.1, 1],
                color: ["#a855f7", "#d8b4fe", "#a855f7"],
                transition: { duration: 0.7, ease: "easeInOut" as const }
            }
        },
        potential: {
            animate: {
                y: [0, -15, 0],
                filter: [
                    "brightness(1) blur(0px)",
                    "brightness(1.5) blur(2px)",
                    "brightness(1) blur(0px)"
                ],
                transition: { duration: 1.2, ease: "circOut" as const }
            }
        },
        default: {
            animate: {
                scale: [1, 1.1, 1],
                color: ["#ffffff", "#d8b4fe", "#ffffff"],
                transition: { duration: 0.3 }
            }
        }
    };

    // Particles for "Unleash"
    const UnleashParticles = () => (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                        x: (Math.random() - 0.5) * 150,
                        y: (Math.random() - 0.5) * 150,
                        opacity: 0,
                        scale: Math.random() * 1.5
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute"
                >
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500 opacity-80" />
                </motion.div>
            ))}
        </div>
    );

    // Particles for "Potential"
    const PotentialParticles = () => (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                        y: -100,
                        x: (Math.random() - 0.5) * 60,
                        opacity: [0, 1, 0],
                        scale: 0.5 + Math.random() * 0.5
                    }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                    className="absolute"
                >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                </motion.div>
            ))}
        </div>
    );

    return (
        <div className="relative inline-block mx-[0.2em]">
            <motion.span
                className={cn(
                    "inline-block cursor-pointer select-none relative z-10",
                    type !== 'default' && "hover:text-primary/80 transition-colors",
                    className
                )}
                onClick={handleClick}
                variants={variants[type]}
                animate={isPlaying ? "animate" : undefined}
                whileHover={{ scale: 1.05 }}
            >
                {word}
            </motion.span>

            <AnimatePresence>
                {isPlaying && type === 'unleash' && <UnleashParticles key="unleash-p" />}
                {isPlaying && type === 'potential' && <PotentialParticles key="potential-p" />}
            </AnimatePresence>
        </div>
    );
}
