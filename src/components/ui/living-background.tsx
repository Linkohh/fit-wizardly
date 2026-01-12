
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function LivingBackground() {
    const { getEffectiveTheme } = useThemeStore();
    const [mounted, setMounted] = useState(false);
    const theme = getEffectiveTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Primary Ambient Blob */}
            <motion.div
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20 mixed-blend-screen
          ${isDark ? "bg-primary/30" : "bg-primary/20"}`}
            />

            {/* Secondary Ambient Blob (Accent) */}
            <motion.div
                animate={{
                    x: [0, -70, 30, 0],
                    y: [0, 60, -40, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2,
                }}
                className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-20 mixed-blend-screen
          ${isDark ? "bg-secondary/30" : "bg-secondary/20"}`}
            />

            {/* Third Blob (Roaming) */}
            <motion.div
                animate={{
                    x: [0, 150, -100, 0],
                    y: [0, -100, 50, 0],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className={`absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full blur-[90px] opacity-10 mixed-blend-overlay
          ${isDark ? "bg-accent/20" : "bg-accent/15"}`}
            />
        </div>
    );
}
