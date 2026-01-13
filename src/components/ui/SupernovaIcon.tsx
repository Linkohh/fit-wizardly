import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SupernovaVariant = 'strength' | 'calm' | 'achievement' | 'magic' | 'cosmic';

interface SupernovaIconProps {
    icon: LucideIcon;
    variant?: SupernovaVariant;
    className?: string;
    size?: number;
    onClick?: () => void;
}

export function SupernovaIcon({ icon: Icon, variant = 'magic', className, size = 24, onClick }: SupernovaIconProps) {
    const [isExploding, setIsExploding] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        setIsExploding(true);
        setTimeout(() => setIsExploding(false), 1000);
        if (onClick) onClick();
        e.stopPropagation();
    };

    // Configuration for different particle effects
    const particleConfig = {
        strength: { color: ['#ef4444', '#f97316'], count: 8, spread: 20 }, // Red/Orange
        calm: { color: ['#3b82f6', '#06b6d4'], count: 6, spread: 15 },    // Blue/Cyan
        achievement: { color: ['#eab308', '#facc15'], count: 12, spread: 25 }, // Gold
        magic: { color: ['#a855f7', '#d8b4fe'], count: 8, spread: 20 },   // Purple
        cosmic: { color: ['#ec4899', '#8b5cf6'], count: 10, spread: 22 }  // Pink/Purple
    };

    const config = particleConfig[variant];

    return (
        <div
            className={cn("relative inline-flex items-center justify-center cursor-pointer group select-none", className)}
            onClick={handleClick}
        >
            <motion.div
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.8 }}
                animate={isExploding ? {
                    scale: [1, 1.4, 1],
                    rotate: [0, -10, 10, 0],
                    filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
                } : {}}
                transition={{ duration: 0.4 }}
                className="relative z-10"
            >
                <Icon size={size} />
            </motion.div>

            <AnimatePresence>
                {isExploding && (
                    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                        {[...Array(config.count)].map((_, i) => (
                            <Particle
                                key={i}
                                index={i}
                                total={config.count}
                                colors={config.color}
                                spread={config.spread}
                            />
                        ))}
                        {/* Central Burst Ring */}
                        <motion.div
                            initial={{ scale: 0, opacity: 1, borderWidth: 2 }}
                            animate={{ scale: 2, opacity: 0, borderWidth: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full border-primary"
                            style={{ borderColor: config.color[0] }}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const Particle = ({ index, total, colors, spread }: { index: number, total: number, colors: string[], spread: number }) => {
    const angle = (index / total) * 360;
    const color = colors[index % colors.length];

    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
                x: Math.cos(angle * Math.PI / 180) * (spread * (1 + Math.random())),
                y: Math.sin(angle * Math.PI / 180) * (spread * (1 + Math.random())),
                scale: 0,
                opacity: 0
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute rounded-full w-1.5 h-1.5"
            style={{ backgroundColor: color }}
        />
    );
};
