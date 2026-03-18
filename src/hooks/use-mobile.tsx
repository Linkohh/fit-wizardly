import * as React from "react";

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

export type ViewportTier = "phone" | "tablet" | "desktop";

export function getViewportTier(width: number): ViewportTier {
  if (width < MOBILE_BREAKPOINT) {
    return "phone";
  }

  if (width < TABLET_BREAKPOINT) {
    return "tablet";
  }

  return "desktop";
}

function readViewportTier(): ViewportTier {
  if (typeof window === "undefined") {
    return "desktop";
  }

  return getViewportTier(window.innerWidth);
}

export function useViewportTier() {
  const [viewportTier, setViewportTier] = React.useState<ViewportTier>(readViewportTier);

  React.useEffect(() => {
    const updateViewportTier = () => {
      setViewportTier(readViewportTier());
    };

    updateViewportTier();
    window.addEventListener("resize", updateViewportTier);

    return () => window.removeEventListener("resize", updateViewportTier);
  }, []);

  return viewportTier;
}

export function useIsMobile() {
  return useViewportTier() === "phone";
}

export function useIsTablet() {
  return useViewportTier() === "tablet";
}
