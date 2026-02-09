import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';

interface SupersetIndicatorProps {
    groupLabel: string; // e.g., "A", "B"
    exerciseIndex: number; // 1 or 2 within the superset
    totalInGroup: number;
    isActive?: boolean;
}

/**
 * Visual indicator showing superset grouping.
 * Displays A1/A2 style labels with colored bracket.
 */
export function SupersetIndicator({ groupLabel, exerciseIndex, totalInGroup, isActive }: SupersetIndicatorProps) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
            isActive
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-muted/50 text-muted-foreground border border-border/50"
        )}>
            <Link2 className="w-3 h-3" />
            <span>Superset {groupLabel}{exerciseIndex}</span>
            {exerciseIndex < totalInGroup && (
                <span className="text-[10px] opacity-70">→ then {groupLabel}{exerciseIndex + 1}</span>
            )}
        </div>
    );
}

/**
 * Get superset label (A, B, C...) from group number
 */
export function getSupersetLabel(groupNumber: number): string {
    return String.fromCharCode(64 + groupNumber); // 1 -> A, 2 -> B, etc.
}
