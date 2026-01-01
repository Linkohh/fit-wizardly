import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timeout);
  }, [location.pathname, children]);

  return (
    <div
      className={cn(
        "transition-all duration-400 ease-out",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-3",
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

export function AnimatedIcon({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <span 
      className={cn(
        "inline-flex icon-hover transition-all duration-200",
        className
      )}
    >
      {children}
    </span>
  );
}

export function GradientBorder({ 
  children, 
  className,
  animated = true,
}: { 
  children: ReactNode; 
  className?: string;
  animated?: boolean;
}) {
  return (
    <div 
      className={cn(
        "relative p-[2px] rounded-xl overflow-hidden group",
        className
      )}
    >
      <div 
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300",
          animated && "animate-gradient"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(262 83% 66%), hsl(330 81% 60%), hsl(270 91% 75%), hsl(262 83% 66%))",
          backgroundSize: "300% 300%",
        }}
      />
      <div className="relative bg-card rounded-[10px]">
        {children}
      </div>
    </div>
  );
}

export function FloatingElement({ 
  children, 
  className,
  delay = 0,
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={cn("animate-float", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function GlowPulse({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("animate-glow-pulse rounded-full", className)}>
      {children}
    </div>
  );
}
