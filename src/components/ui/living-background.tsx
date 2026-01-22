import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";

const BLOBS = [
  {
    // Purple — matches primary
    color: "rgba(150, 110, 225, 0.8)",
    size: "55vmax",
    position: { top: "-15%", left: "-10%" },
    animationClass: "animate-blob-drift-1",
  },
  {
    // Blue/Cyan — matches accent
    color: "rgba(130, 190, 255, 0.8)",
    size: "50vmax",
    position: { bottom: "-10%", right: "-15%" },
    animationClass: "animate-blob-drift-2",
  },
  {
    // Pink — matches secondary
    color: "rgba(230, 147, 218, 0.8)",
    size: "45vmax",
    position: { top: "30%", left: "5%" },
    animationClass: "animate-blob-drift-3",
  },
  {
    // Purple Rose — deep variant
    color: "rgba(180, 80, 160, 0.75)",
    size: "40vmax",
    position: { top: "10%", right: "5%" },
    animationClass: "animate-blob-drift-4",
  },
  {
    // Rose Pink — vibrant variant
    color: "rgba(255, 100, 160, 0.75)",
    size: "48vmax",
    position: { bottom: "5%", left: "20%" },
    animationClass: "animate-blob-drift-5",
  },
  {
    // Indigo — balancing cool tone
    color: "rgba(90, 100, 240, 0.75)",
    size: "42vmax",
    position: { top: "50%", left: "45%" },
    animationClass: "animate-blob-drift-6",
  },
] as const;

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
    <div
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Container-level blur: overlapping blobs blend into liquid */}
      <div
        className="absolute inset-0"
        style={{
          filter: "blur(80px)",
          mixBlendMode: isDark ? "screen" : "normal",
          opacity: isDark ? 0.5 : 0.55,
          willChange: "filter",
        }}
      >
        {BLOBS.map((blob, index) => (
          <div
            key={index}
            className={`absolute rounded-full ${blob.animationClass}`}
            style={{
              width: blob.size,
              height: blob.size,
              backgroundColor: blob.color,
              ...blob.position,
              willChange: "transform, opacity, filter",
            }}
          />
        ))}
      </div>
    </div>
  );
}
