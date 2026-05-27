import { AnimatePresence, motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { fetchDailyMotivationQuote, formatRemoteMotivationQuote } from "@/lib/motivation/motivationQuoteClient";
import { getDailyQuoteIndex, LOCAL_MOTIVATION_QUOTES } from "./quotes";

export function DailyQuote({ className }: { className?: string }) {
    const quotePoolRef = useRef<readonly string[]>(LOCAL_MOTIVATION_QUOTES);
    const [quotePool, setQuotePool] = useState<readonly string[]>(LOCAL_MOTIVATION_QUOTES);
    const [quoteIndex, setQuoteIndex] = useState(() =>
        getDailyQuoteIndex(new Date(), LOCAL_MOTIVATION_QUOTES.length)
    );
    const isMobile = useIsMobile();
    const { shouldReduceMotion } = useMotionPreferences();
    const staticMode = shouldReduceMotion;
    const rotateIntervalMs = isMobile ? 8000 : 12000;
    const currentQuote = quotePool[quoteIndex] ?? LOCAL_MOTIVATION_QUOTES[0];

    useEffect(() => {
        let isMounted = true;

        fetchDailyMotivationQuote().then((remoteQuote) => {
            if (!isMounted || !remoteQuote) {
                return;
            }

            const formattedQuote = formatRemoteMotivationQuote(remoteQuote);
            const currentPool = quotePoolRef.current;
            const existingIndex = currentPool.indexOf(formattedQuote);

            if (existingIndex >= 0) {
                setQuoteIndex(existingIndex);
                return;
            }

            const nextPool = [...currentPool, formattedQuote];
            quotePoolRef.current = nextPool;
            setQuotePool(nextPool);
            setQuoteIndex(nextPool.length - 1);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (staticMode || quotePool.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % quotePool.length);
        }, rotateIntervalMs);

        return () => clearInterval(interval);
    }, [quotePool.length, rotateIntervalMs, staticMode]);

    return (
        <div className={cn("relative p-8 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 overflow-hidden group hover:shadow-glow hover:border-primary/30 transition-all duration-500", className)}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-24 h-24 text-primary rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 p-2 rounded-full bg-primary/10 text-primary">
                    <Sparkles className={staticMode ? "w-5 h-5" : "w-5 h-5 animate-pulse"} />
                </div>

                <div className="min-h-[100px] flex items-center justify-center">
                    {staticMode ? (
                        <p className="text-xl md:text-2xl font-medium italic text-foreground/90 leading-relaxed max-w-2xl">
                            "{currentQuote}"
                        </p>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={quoteIndex}
                                initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="text-xl md:text-2xl font-medium italic text-foreground/90 leading-relaxed max-w-2xl"
                            >
                                "{currentQuote}"
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>

                {staticMode ? (
                    <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary" />
                ) : (
                    <motion.div
                        layoutId="quote-underline"
                        className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"
                    />
                )}

                <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Daily Motivation
                </p>
            </div>
        </div>
    );
}
