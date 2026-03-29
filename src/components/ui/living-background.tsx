import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { useIsMobile } from "@/hooks/use-mobile";
import styles from "./living-background.module.css";

const BLOBS = [
  {
    id: "primary-purple",
    className: styles.blob1,
    // Purple — aligned with primary HSL(270,90%,65%)
    color: "rgba(138, 92, 246, 0.75)",
    size: { desktop: "55vmax", mobile: "33vmax" },
    position: { top: "-15%", left: "-10%" },
  },
  {
    id: "accent-cyan",
    className: styles.blob2,
    // Cyan — true accent cyan-400
    color: "rgba(34, 211, 238, 0.6)",
    size: { desktop: "50vmax", mobile: "30vmax" },
    position: { bottom: "-10%", right: "-15%" },
  },
  {
    id: "hot-pink",
    className: styles.blob3,
    // Pink — aligned with secondary HSL(330)
    color: "rgba(244, 114, 182, 0.65)",
    size: { desktop: "45vmax", mobile: "27vmax" },
    position: { top: "30%", left: "5%" },
  },
  {
    id: "deep-violet",
    className: styles.blob4,
    // Violet — deep depth variant
    color: "rgba(126, 34, 206, 0.6)",
    size: { desktop: "40vmax", mobile: "24vmax" },
    position: { top: "10%", right: "5%" },
  },
  {
    id: "warm-amber",
    className: styles.blob5,
    // Amber — warm anchor (screen-blended with purple = gold shimmer)
    color: "rgba(251, 146, 60, 0.45)",
    size: { desktop: "48vmax", mobile: "29vmax" },
    position: { bottom: "5%", left: "20%" },
  },
  {
    id: "cool-teal",
    className: styles.blob6,
    // Teal — cool balance
    color: "rgba(6, 182, 212, 0.55)",
    size: { desktop: "42vmax", mobile: "25vmax" },
    position: { top: "50%", left: "45%" },
  },
  {
    id: "soft-lavender",
    className: styles.blob7,
    // Soft Lavender — midtone fill (desktop only)
    color: "rgba(196, 167, 255, 0.4)",
    size: { desktop: "38vmax", mobile: "23vmax" },
    position: { top: "25%", right: "25%" },
  },
  {
    id: "deep-teal",
    className: styles.blob8,
    // Deep Teal — cool counterweight (desktop only)
    color: "rgba(20, 184, 166, 0.35)",
    size: { desktop: "36vmax", mobile: "22vmax" },
    position: { bottom: "20%", right: "10%" },
  },
] as const;

const MOBILE_BLOB_IDS = new Set([
  "primary-purple",
  "accent-cyan",
  "hot-pink",
  "warm-amber",
  "cool-teal",
  "deep-teal",
]);

// SVG noise texture for film grain effect (~0.5KB inline)
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E`;

export function LivingBackground() {
  const { getEffectiveTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const theme = getEffectiveTheme();
  const blurLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-driven opacity fade (desktop only)
  useEffect(() => {
    if (!mounted || isMobile) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const opacity = Math.max(0.3, 0.65 - scrollY / 2500);
        if (blurLayerRef.current) {
          blurLayerRef.current.style.opacity = String(opacity);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted, isMobile]);

  if (!mounted) return null;

  const isDark = theme === "dark";

  const visibleBlobs = isMobile
    ? BLOBS.filter((blob) => MOBILE_BLOB_IDS.has(blob.id))
    : BLOBS;

  const blurOpacity = isMobile
    ? (isDark ? 0.58 : 0.66)
    : (isDark ? 0.6 : 0.65);

  const grainOpacity = isMobile
    ? (isDark ? 0.04 : 0.024)
    : (isDark ? 0.045 : 0.03);

  const vignetteOpacity = isMobile
    ? (isDark ? 0.16 : 0.07)
    : (isDark ? 0.25 : 0.12);

  return (
    <div
      data-testid="living-background"
      className={`${styles.root} ${isMobile ? styles.rootMobile : ""}`}
      aria-hidden="true"
    >
      {/* Container-level blur: overlapping blobs blend into liquid */}
      <div
        ref={blurLayerRef}
        className={`${styles.blurLayer} ${isMobile ? styles.blurLayerMobile : ""}`}
        style={{
          mixBlendMode: isDark ? "screen" : "normal",
          opacity: blurOpacity,
        }}
      >
        {visibleBlobs.map((blob) => (
          <div
            key={blob.id}
            data-testid="living-background-blob"
            data-blob-color={blob.color}
            data-blob-id={blob.id}
            className={`${styles.blob} ${blob.className} ${isMobile ? styles.blobMobile : ""}`}
            style={{
              width: isMobile ? blob.size.mobile : blob.size.desktop,
              height: isMobile ? blob.size.mobile : blob.size.desktop,
              backgroundColor: blob.color,
              ...blob.position,
            }}
          />
        ))}
      </div>

      {/* Film grain texture — adds analog depth */}
      <div
        className={styles.grain}
        style={{
          opacity: grainOpacity,
          backgroundImage: `url("${NOISE_SVG}")`,
        }}
      />

      {/* Atmospheric vignette — focuses attention toward center */}
      <div
        className={styles.vignette}
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, transparent 50%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
        }}
      />
    </div>
  );
}
