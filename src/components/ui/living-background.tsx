import { useEffect, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { useIsMobile } from "@/hooks/use-mobile";
import styles from "./living-background.module.css";

const BLOBS = [
  {
    // Purple — matches primary
    color: "rgba(150, 110, 225, 0.8)",
    size: "55vmax",
    position: { top: "-15%", left: "-10%" },
  },
  {
    // Blue/Cyan — matches accent
    color: "rgba(130, 190, 255, 0.8)",
    size: "50vmax",
    position: { bottom: "-10%", right: "-15%" },
  },
  {
    // Pink — matches secondary
    color: "rgba(230, 147, 218, 0.8)",
    size: "45vmax",
    position: { top: "30%", left: "5%" },
  },
  {
    // Purple Rose — deep variant
    color: "rgba(180, 80, 160, 0.75)",
    size: "40vmax",
    position: { top: "10%", right: "5%" },
  },
  {
    // Rose Pink — vibrant variant
    color: "rgba(255, 100, 160, 0.75)",
    size: "48vmax",
    position: { bottom: "5%", left: "20%" },
  },
  {
    // Indigo — balancing cool tone
    color: "rgba(90, 100, 240, 0.75)",
    size: "42vmax",
    position: { top: "50%", left: "45%" },
  },
] as const;

const BLOB_CLASSES = [styles.blob1, styles.blob2, styles.blob3, styles.blob4, styles.blob5, styles.blob6] as const;

export function LivingBackground() {
  const { getEffectiveTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const theme = getEffectiveTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isMobile) return null;

  const isDark = theme === "dark";

  return (
    <div
      className={styles.root}
      aria-hidden="true"
    >
      {/* Container-level blur: overlapping blobs blend into liquid */}
      <div
        className={styles.blurLayer}
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
            className={`${styles.blob} ${BLOB_CLASSES[index]}`}
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
