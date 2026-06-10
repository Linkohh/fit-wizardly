import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

type NavDirection = "forward" | "backward" | "neutral";

const NAV_ORDER = [
  "/",
  "/wizard",
  "/plan",
  "/exercises",
  "/history",
  "/analytics",
  "/circles",
  "/nutrition",
];

const NavigationDirectionContext = createContext<NavDirection>("neutral");

// eslint-disable-next-line react-refresh/only-export-components
export function useNavigationDirection(): NavDirection {
  return useContext(NavigationDirectionContext);
}

export function NavigationDirectionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);
  const [direction, setDirection] = useState<NavDirection>("neutral");

  useEffect(() => {
    const prev = prevPathRef.current;
    const next = location.pathname;

    if (prev !== next) {
      const prevBase = "/" + prev.split("/")[1];
      const nextBase = "/" + next.split("/")[1];
      const prevIdx = NAV_ORDER.indexOf(prevBase === "/" ? "/" : prevBase);
      const nextIdx = NAV_ORDER.indexOf(nextBase === "/" ? "/" : nextBase);

      if (prevIdx !== -1 && nextIdx !== -1) {
        setDirection(nextIdx > prevIdx ? "forward" : "backward");
      } else {
        setDirection("neutral");
      }

      prevPathRef.current = next;
    }
  }, [location.pathname]);

  return (
    <NavigationDirectionContext.Provider value={direction}>
      {children}
    </NavigationDirectionContext.Provider>
  );
}
