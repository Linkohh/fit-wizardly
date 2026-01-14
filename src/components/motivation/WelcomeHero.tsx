import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Star, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingElement } from "@/components/ui/page-transition";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { InteractiveWord } from "./InteractiveWord";
import { useRef, useEffect, useState } from "react";

// Floating orbs component
function FloatingOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large primary orb */}
            <motion.div
                className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl"
                animate={{
                    x: [0, 100, 50, 0],
                    y: [0, -50, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ top: '10%', left: '10%' }}
            />
            {/* Secondary orb */}
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-secondary/15 to-accent/10 blur-3xl"
                animate={{
                    x: [0, -80, 40, 0],
                    y: [0, 80, -40, 0],
                    scale: [1, 0.8, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                style={{ top: '30%', right: '15%' }}
            />
            {/* Accent orb */}
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/15 blur-2xl"
                animate={{
                    x: [0, 60, -30, 0],
                    y: [0, -60, 30, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                style={{ bottom: '20%', left: '20%' }}
            />
        </div>
    );
}

// Particle effect component
function Particles() {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 10,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-primary/30 dark:bg-primary/40"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        bottom: '-5%',
                    }}
                    animate={{
                        y: [0, -800],
                        opacity: [0, 1, 1, 0],
                        x: [0, Math.sin(p.id) * 50],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}

// Animated badge component
function AnimatedBadge() {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
            }}
            whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)"
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/30 backdrop-blur-sm text-primary mb-8 hover:border-primary/50 transition-all cursor-default group"
        >
            <motion.span
                animate={{ 
                    rotate: [0, -15, 15, -10, 10, 0],
                    scale: [1, 1.2, 1.2, 1.1, 1.1, 1]
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
            >
                <Zap className="h-4 w-4 fill-current" />
            </motion.span>
            <span className="text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Ignite Your Fitness Journey
            </span>
            <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
                <Star className="h-3 w-3 text-secondary fill-current opacity-60" />
            </motion.span>
        </motion.div>
    );
}

export function WelcomeHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), { stiffness: 100, damping: 30 });
    const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), { stiffness: 100, damping: 30 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            mouseX.set(e.clientX - rect.left - rect.width / 2);
            mouseY.set(e.clientY - rect.top - rect.height / 2);
        }
    };

    return (
        <section 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative pt-24 pb-20 px-4 overflow-hidden hero-bloom bg-gradient-to-b from-[#F8F5FC] via-[#EDE4F5] to-[#F0E8F8] dark:from-[#1a0a2e] dark:via-[#2D1548] dark:to-[#1a0a2e]"
        >
            {/* Animated Background Elements */}
            <FloatingOrbs />
            <Particles />

            {/* Mesh gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.25),transparent)] pointer-events-none" />
            
            {/* Premium Layered Horizon Glow - 3D Depth with Aurora Color Cycling */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Primary Layer - Main horizon with full 48s color cycle */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[30%] animate-horizon-glow" />

                {/* Secondary Layer - Above for depth */}
                <div className="absolute left-0 right-0 top-[45%] -translate-y-1/2 h-[22%] opacity-80 animate-horizon-glow-secondary" />

                {/* Tertiary Layer - Below for grounding */}
                <div className="absolute left-0 right-0 top-[55%] -translate-y-1/2 h-[18%] opacity-60 animate-horizon-glow-tertiary" />
            </div>

            <motion.div 
                style={{ rotateX, rotateY, transformPerspective: 1000 }}
                className="container max-w-5xl mx-auto text-center relative z-10"
            >
                <FloatingElement delay={0}>
                    <AnimatedBadge />
                </FloatingElement>

                <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-6 tracking-tight flex flex-col items-center justify-center leading-tight"
                >
                    <motion.div 
                        className="flex items-center justify-center flex-wrap gap-2 md:gap-4"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <InteractiveWord word="Unleash" type="unleash" />
                        <InteractiveWord word="Your" type="your" />
                    </motion.div>
                    <motion.span 
                        className="relative mt-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <span className="flex items-center justify-center gap-2 md:gap-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                            <InteractiveWord word="Full" type="full" className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary" />
                            <InteractiveWord word="Potential" type="potential" className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary" />
                        </span>
                        {/* Glow effect behind text */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-400/30 to-secondary/30 blur-2xl -z-10"
                            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    Craft the perfect workout plan tailored to your goals.
                    <motion.span 
                        className="text-foreground font-semibold"
                        whileHover={{ color: "hsl(var(--primary))" }}
                    > Intelligent</motion.span>,
                    <motion.span 
                        className="text-foreground font-semibold"
                        whileHover={{ color: "hsl(var(--primary))" }}
                    > personalized</motion.span>, and
                    <motion.span 
                        className="text-foreground font-semibold"
                        whileHover={{ color: "hsl(var(--primary))" }}
                    > undeniably effective</motion.span>.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link to="/wizard">
                        <motion.div
                            whileHover={{
                                scale: 1.05,
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="rounded-full relative group"
                        >
                            <Button size="xl" className="relative h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 group overflow-hidden border-0">
                                <span className="relative z-10 flex items-center gap-2">
                                    <Flame className="h-5 w-5 group-hover:animate-pulse" />
                                    Start Your Evolution
                                    <motion.span
                                        className="inline-block"
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </motion.span>
                                </span>
                                {/* Animated gradient overlay */}
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                                />
                                {/* Glow ring on hover */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-full opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500 -z-10" />
                            </Button>
                        </motion.div>
                    </Link>

                    <Link to="/plan">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="rounded-full"
                        >
                            <Button variant="outline" size="xl" className="h-14 px-8 text-lg rounded-full border-2 border-primary/30 hover:bg-primary/5 hover:border-primary/60 transition-all duration-300 backdrop-blur-sm">
                                View Current Plan
                            </Button>
                        </motion.div>
                    </Link>
                </motion.div>

                {/* Decorative floating elements */}
                <div className="absolute top-16 left-8 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ 
                            y: [0, -15, 0],
                            rotate: [0, 10, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles className="w-10 h-10 text-primary/40" />
                    </motion.div>
                </div>
                <div className="absolute top-32 right-12 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ 
                            y: [0, 15, 0],
                            rotate: [0, -15, 0]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                        <Star className="w-8 h-8 text-secondary/50 fill-secondary/30" />
                    </motion.div>
                </div>
                <div className="absolute bottom-24 left-16 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ 
                            y: [0, -10, 0],
                            x: [0, 5, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-secondary" />
                    </motion.div>
                </div>
                <div className="absolute bottom-16 right-20 hidden lg:block pointer-events-none">
                    <motion.div
                        animate={{ 
                            y: [0, 12, 0],
                            rotate: [0, 360]
                        }}
                        transition={{ 
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                        }}
                    >
                        <Sparkles className="w-6 h-6 text-accent/60" />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}