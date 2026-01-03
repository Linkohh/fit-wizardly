import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingElement } from "@/components/ui/page-transition";

export function WelcomeHero() {
    return (
        <section className="relative pt-24 pb-48 px-4 overflow-hidden hero-bloom">
            {/* Background Glows - Reduced Intensity (10-15% reduction) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 opacity-40 animate-pulse-glow pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -z-10 opacity-30 pointer-events-none" />

            <div className="container max-w-5xl mx-auto text-center relative z-10">
                <FloatingElement delay={0}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium border-primary/20 text-primary mb-8 animate-fade-in hover:shadow-glow transition-shadow cursor-default">
                        <Zap className="h-4 w-4 fill-current animate-bounce" />
                        <span className="text-sm font-bold tracking-wide uppercase">Ignite Your Fitness Journey</span>
                    </div>
                </FloatingElement>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/70 mb-6 drop-shadow-md tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
                        <Button size="xl" className="relative h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-glow hover:scale-105 transition-all duration-300 group overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                Start Your Evolution
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </Link>

                    <Link to="/plan">
                        <Button variant="outline" size="xl" className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                            View Current Plan
                        </Button>
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
