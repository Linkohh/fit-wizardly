import { Signal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AnalyticsConfidence } from '@/lib/analyticsIntelligence';
import { cn } from '@/lib/utils';

type InsightQuality = AnalyticsConfidence | 'needs_data' | 'readiness_stale';

interface InsightQualityBadgeProps {
  quality: InsightQuality;
  className?: string;
}

const qualityMeta: Record<InsightQuality, { label: string; className: string }> = {
  high: {
    label: 'High confidence',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  medium: {
    label: 'Medium confidence',
    className: 'border-primary/30 bg-primary/10 text-primary',
  },
  low: {
    label: 'Low confidence',
    className: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  },
  needs_data: {
    label: 'Needs more logs',
    className: 'border-muted-foreground/20 bg-muted/40 text-muted-foreground',
  },
  readiness_stale: {
    label: 'Readiness stale',
    className: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
  },
};

export function InsightQualityBadge({ quality, className }: InsightQualityBadgeProps) {
  const meta = qualityMeta[quality];

  return (
    <Badge variant="outline" className={cn('gap-1.5 whitespace-nowrap', meta.className, className)}>
      <Signal className="h-3.5 w-3.5" />
      {meta.label}
    </Badge>
  );
}
