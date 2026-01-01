import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  className?: string;
}

const colors = [
  "hsl(262 83% 66%)", // primary purple
  "hsl(330 81% 60%)", // secondary pink
  "hsl(270 91% 75%)", // accent lavender
  "hsl(330 86% 70%)", // success rose
  "hsl(262 83% 80%)", // light purple
  "hsl(330 81% 75%)", // light pink
];

export function Confetti({
  isActive,
  duration = 3000,
  pieceCount = 50,
  className,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setVisible(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isActive, duration, pieceCount]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-50 overflow-hidden",
        className
      )}
    >
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          <div
            className="rounded-sm"
            style={{
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              boxShadow: `0 0 6px ${piece.color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function SuccessCheckmark({ className }: { className?: string }) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className="w-16 h-16"
        viewBox="0 0 52 52"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="fill-none stroke-success"
          cx="26"
          cy="26"
          r="24"
          strokeWidth="2"
          style={{
            strokeDasharray: 166,
            strokeDashoffset: 166,
            animation: "checkmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards",
          }}
        />
        <path
          className="fill-none stroke-success origin-center"
          d="m14.1 27.2 7.1 7.2 16.7-16.8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: 48,
            animation: "checkmark 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards",
          }}
        />
      </svg>
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(330 86% 70% / 0.2) 0%, transparent 70%)",
          animation: "pulse-glow 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}
