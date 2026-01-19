import { cn } from "@/lib/utils";

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
    const percentage = Math.min(100, (current / target) * 100);
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
                        className="text-white/5"
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
            <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">{label}</span>
            <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
                {showRemaining ? `${Math.round(percentage)}%` : `/ ${target}${unit}`}
            </span>
        </div>
    )
}
