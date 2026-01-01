import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer";
}

function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        variant === "shimmer" 
          ? "shimmer-purple animate-shimmer" 
          : "animate-pulse bg-muted",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
