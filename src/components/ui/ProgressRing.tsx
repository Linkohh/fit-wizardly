import { cn } from "@/lib/utils";
import React from "react";

interface ProgressRingProps {
    label: string;
    current: number;
    target: number;
    color?: string;
    unit?: string;
    size?: 'sm' | 'md' | 'lg';
    showRemaining?: boolean;
}

export function ProgressRing({
    label,
    current,
    target,
    color = "text-primary",
    unit = "",
    size = 'md',
    showRemaining = false
}: ProgressRingProps) {
    const [animatedCurrent, setAnimatedCurrent] = React.useState(0);

    React.useEffect(() => {
        const timer = setTimeout(() => setAnimatedCurrent(current), 100);
        return () => clearTimeout(timer);
    }, [current]);

    const percentage = target > 0 ? Math.min(100, (animatedCurrent / target) * 100) : 0;
    const radius = size === 'sm' ? 24 : size === 'md' ? 36 : 48;
    const strokeWidth = size === 'sm' ? 4 : 8;
    const width = radius * 2 + strokeWidth * 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const remaining = Math.max(0, target - current);

    return (
        <div className="flex flex-col items-center justify-center p-2 group">
            <div className="relative mb-2" style={{ width: width, height: width }}>
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        cx="50%" cy="50%" r={radius}
                        stroke="currentColor" strokeWidth={strokeWidth}
                        fill="transparent"
                        className="text-muted/20"
                    />
                    <circle
                        cx="50%" cy="50%" r={radius}
                        stroke="currentColor" strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", color)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {showRemaining ? (
                        <>
                            <span className="text-sm font-bold">{remaining}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">left</span>
                        </>
                    ) : (
                        <>
                            <span className={cn("font-bold", size === 'sm' ? "text-sm" : "text-lg")}>{current}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{unit}</span>
                        </>
                    )}
                </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                {showRemaining ? `${Math.round(percentage)}%` : `/ ${target}${unit}`}
            </span>
        </div>
    )
}
