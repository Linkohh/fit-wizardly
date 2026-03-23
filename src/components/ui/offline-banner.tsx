import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setVisible(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setVisible(false);
    };

    if (!navigator.onLine) {
      setIsOffline(true);
      setVisible(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{
            y: -56,
            opacity: 0,
            filter: "blur(20px)",
            scale: 0.92,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 22,
              mass: 0.8,
              opacity: { duration: 0.35, ease: "easeIn" },
              filter: { duration: 0.4, ease: "easeIn", delay: 0.05 },
            },
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-14 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <div className="w-full max-w-md mx-4 mt-2 pointer-events-auto">
            <div
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white/90"
              style={{
                background: "rgba(220, 38, 38, 0.25)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                border: "1px solid rgba(255, 100, 100, 0.2)",
                boxShadow:
                  "0 4px 24px rgba(220, 38, 38, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }}
            >
              <WifiOff className="h-3.5 w-3.5 text-red-300" />
              <span>You're offline</span>
              <span className="text-white/50 text-xs">·</span>
              <span className="text-white/60 text-xs">
                Some features may be limited
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
