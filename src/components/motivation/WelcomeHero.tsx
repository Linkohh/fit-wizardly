import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingElement } from "@/components/ui/page-transition";
import { motion } from "framer-motion";

export function WelcomeHero() {
    return (
        <section className="relative pt-24 pb-16 px-4 overflow-hidden hero-bloom bg-gradient-to-b from-background via-muted/50 to-transparent dark:from-[#140821] dark:via-[#1a0b2e] dark:to-transparent">
            {/* Background Glows - Reduced Intensity (10-15% reduction) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-40 animate-pulse-glow pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -z-10 opacity-30 pointer-events-none" />

            <div className="container max-w-5xl mx-auto text-center relative z-10">
                <FloatingElement delay={0}>
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
                            boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)"
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium border-primary/20 text-primary mb-8 hover:shadow-glow transition-shadow cursor-default"
                    >
                        <motion.span
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                        >
                            <Zap className="h-4 w-4 fill-current" />
                        </motion.span>
                        <span className="text-sm font-bold tracking-wide uppercase">Ignite Your Fitness Journey</span>
                    </motion.div>
                </FloatingElement>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-white dark:via-white dark:to-white/70 mb-6 drop-shadow-md tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    Unleash Your <br />
                    <span className="gradient-text-animated filter drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                        Full Potential
                    </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Craft the perfect workout plan tailored to your goals.
                    <span className="text-foreground font-semibold"> Intelligent</span>,
                    <span className="text-foreground font-semibold"> personalized</span>, and
                    <span className="text-foreground font-semibold"> undeniably effective</span>.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Link to="/wizard">
                        <motion.div
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 30px rgba(139, 92, 246, 0.5)"
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Button size="xl" className="relative h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-glow transition-all duration-300 group overflow-hidden">
                                <span className="relative z-10 flex items-center gap-2">
                                    Start Your Evolution
                                    <motion.span
                                        className="inline-block"
                                        whileHover={{ x: 4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </motion.span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 3,
                                        ease: "easeInOut"
                                    }}
                                />
                            </Button>
                        </motion.div>
                    </Link>

                    <Link to="/plan">
                        <motion.div
                            whileHover={{
                                scale: 1.05,
                                borderColor: "rgba(139, 92, 246, 0.5)"
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <Button variant="outline" size="xl" className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                                View Current Plan
                            </Button>
                        </motion.div>
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 animate-float opacity-30 pointer-events-none hidden md:block">
                    <Sparkles className="w-12 h-12 text-accent" />
                </div>
                <div className="absolute bottom-20 right-10 animate-float opacity-30 pointer-events-none hidden md:block" style={{ animationDelay: '1.5s' }}>
                    <Sparkles className="w-8 h-8 text-secondary" />
                </div>
            </div>
        </section>
    );
}
