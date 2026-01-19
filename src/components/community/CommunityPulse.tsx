import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommunityPulse() {
    const [activeUsers, setActiveUsers] = useState(128);
    const [recentAction, setRecentAction] = useState<string | null>(null);

    // Simulate active user count fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Simulate recent actions
    useEffect(() => {
        const actions = [
            "Someone just finished a Chest Workout",
            "New PR: Bench Press (225 lbs)",
            "Alex started a new plan",
            "Sarah completed 5k run",
            "Someone unlocked 'Early Bird' badge"
        ];

        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const action = actions[Math.floor(Math.random() * actions.length)];
                setRecentAction(action);
                setTimeout(() => setRecentAction(null), 3000);
            }
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold">{activeUsers}</span>
                <span className="text-white/60">active now</span>
            </div>

            <div className="h-3 w-px bg-white/10" />

            <div className="w-[220px] h-5 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {recentAction ? (
                        <motion.div
                            key="action"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="absolute inset-0 text-white/80 truncate flex items-center gap-1"
                        >
                            <Activity className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">{recentAction}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="default"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="absolute inset-0 flex items-center gap-1 truncate text-white/80"
                        >
                            <span className="truncate">Get moving with the community!</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
