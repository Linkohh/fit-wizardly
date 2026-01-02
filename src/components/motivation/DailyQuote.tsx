import { Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Don't stop when you're tired. Stop when you're done.",
    "Discipline is doing what needs to be done, even if you don't want to do it.",
    "Sweat is just fat crying.",
    "The hard part isn't getting your body in shape. The hard part is getting your mind in shape.",
];

export function DailyQuote({ className }: { className?: string }) {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        // Deterministic random quote based on date so it persists for the day
        const today = new Date();
        const index = (today.getDate() + today.getMonth()) % QUOTES.length;
        setQuote(QUOTES[index]);
    }, []);

    return (
        <div className={cn("relative p-6 mt-8 rounded-xl glass-card overflow-hidden group hover:shadow-glow transition-all duration-300", className)}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-24 h-24 text-primary rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 p-2 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-xl md:text-2xl font-medium italic text-foreground/90 leading-relaxed max-w-2xl">
                    "{quote}"
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary" />
                <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Daily Motivation
                </p>
            </div>
        </div>
    );
}
