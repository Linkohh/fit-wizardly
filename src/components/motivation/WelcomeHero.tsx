import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Star, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingElement } from "@/components/ui/page-transition";
import { motion } from "framer-motion";
import { InteractiveWord } from "./InteractiveWord";
import { useRef, memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { isNativeApp } from "@/lib/platform";
import { wasMotionPermissionGranted, requestMotionTiltPermission } from "@/lib/motion-tilt";
import { toast } from "sonner";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { usePreferencesStore } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHeroTilt } from "@/hooks/use-hero-tilt";
import styles from "./WelcomeHero.module.css";

// --- Sub-Components (Memoized) ---

const FloatingOrbs = memo(function FloatingOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large primary orb */}
            <motion.div
                className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl will-change-transform"
                animate={{
                    x: [0, 100, 50, 0],
                    y: [0, -50, 100, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ top: '10%', left: '10%' }}
            />
            {/* Secondary orb */}
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-secondary/15 to-accent/10 blur-3xl will-change-transform"
                animate={{
                    x: [0, -80, 40, 0],
                    y: [0, 80, -40, 0],
                    scale: [1, 0.8, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                style={{ top: '30%', right: '15%' }}
            />
            {/* Accent orb */}
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/15 blur-2xl will-change-transform"
                animate={{
                    x: [0, 60, -30, 0],
                    y: [0, -60, 30, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                style={{ bottom: '20%', left: '20%' }}
            />
        </div>
    );
});

// Generate particles once, outside of render cycle
const STATIC_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
}));

const Particles = memo(function Particles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {STATIC_PARTICLES.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-primary/30 dark:bg-primary/40 will-change-transform"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        bottom: '-5%',
                    }}
                    animate={{
                        y: [0, -800],
                        opacity: [0, 1, 1, 0],
                        x: [0, Math.sin(p.id) * 50],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
});

const AnimatedBadge = memo(function AnimatedBadge() {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
            }}
            whileHover={{
                scale: 1.05,
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/30 backdrop-blur-sm text-primary mb-8 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 cursor-default group"
        >
            <motion.span
                animate={{
                    rotate: [0, -15, 15, -10, 10, 0],
                    scale: [1, 1.2, 1.2, 1.1, 1.1, 1]
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
            >
                <Zap className="h-4 w-4 fill-current" />
            </motion.span>
            <span className="text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('hero.badge')}
            </span>
            <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
                <Star className="h-3 w-3 text-secondary fill-current opacity-60" />
            </motion.span>
        </motion.div>
    );
});

// --- Main Component ---

export function WelcomeHero() {
    const { t, i18n } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [showBackground, setShowBackground] = useState(false);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    const nativeApp = isNativeApp();
    const isMobile = useIsMobile();
    const { shouldReduceMotion } = useMotionPreferences();
    const motionTiltEnabled = usePreferencesStore((state) => state.settings.motionTilt !== false);
    const mobileMotionEnabled = usePreferencesStore((state) => state.motionTiltActivatedThisSession);
    const setMobileMotionEnabled = usePreferencesStore((state) => state.setMotionTiltActivatedThisSession);

    const isMobileContext = nativeApp || isMobile;
    const staticMode = shouldReduceMotion || (isMobileContext && !mobileMotionEnabled);
    const tiltEnabled = motionTiltEnabled && !shouldReduceMotion && (!isMobileContext || mobileMotionEnabled);

    const {
        rotateX,
        rotateY,
        handlePointerMove,
        handlePointerLeave,
        handlePointerUp,
        handlePointerCancel,
        enableMotion,
        sensorStatus,
    } = useHeroTilt({
        containerRef,
        isEnabled: tiltEnabled,
        isMobileContext,
    });

    // Defer heavy background animations to prioritize LCP.
    useEffect(() => {
        if (staticMode) {
            setShowBackground(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowBackground(true);
        }, 100); // Small delay to let the main content paint first
        return () => clearTimeout(timer);
    }, [staticMode]);

    // Auto-activate sensor if permission was previously granted (localStorage).
    // Only attempt once per mount to avoid an infinite retry loop on iOS where
    // the browser-level permission is session-scoped and expires on app kill.
    const hasAttemptedAutoActivation = useRef(false);
    useEffect(() => {
        if (!isMobileContext || !motionTiltEnabled || shouldReduceMotion || mobileMotionEnabled) {
            return;
        }

        if (hasAttemptedAutoActivation.current) {
            return;
        }

        if (wasMotionPermissionGranted()) {
            hasAttemptedAutoActivation.current = true;
            setMobileMotionEnabled(true);
        }
    }, [isMobileContext, motionTiltEnabled, shouldReduceMotion, mobileMotionEnabled, setMobileMotionEnabled]);

    useEffect(() => {
        if (!isMobileContext || !motionTiltEnabled || shouldReduceMotion || !mobileMotionEnabled) {
            return;
        }

        void enableMotion({ userInitiated: false });
    }, [enableMotion, isMobileContext, mobileMotionEnabled, motionTiltEnabled, shouldReduceMotion]);

    // Detect returning user who needs to re-authorize on iOS.
    // iOS Safari revokes DeviceOrientation permission when the app is killed from
    // the multitask tray, so returning users (who have a valid localStorage grant)
    // need to re-grant via a user gesture. Instead of showing a full "Enable" button,
    // we let them tap anywhere on the hero to trigger the re-authorization dialog.
    const isReturningUser = isMobileContext && wasMotionPermissionGranted();
    const showMotionButton = isMobileContext && motionTiltEnabled && !shouldReduceMotion && !mobileMotionEnabled && sensorStatus !== 'unsupported';
    const needsReGrant = showMotionButton && isReturningUser;

    const handleHeroReGrant = useCallback(
        (e: React.MouseEvent) => {
            if (!needsReGrant || isRequestingPermission) return;

            // Don't intercept taps on buttons or links — let those navigate normally.
            const target = e.target as HTMLElement;
            if (target.closest('button, a, [role="button"]')) return;

            setIsRequestingPermission(true);
            void requestMotionTiltPermission()
                .then((status) => {
                    if (status.permission === 'granted') {
                        setMobileMotionEnabled(true);
                    } else {
                        toast.error(t('hero.motion_tilt_denied', 'Motion tilt access was denied'));
                    }
                })
                .finally(() => setIsRequestingPermission(false));
        },
        [needsReGrant, isRequestingPermission, setMobileMotionEnabled, t],
    );

    // Notify user when their device doesn't support motion tilt.
    const hasShownUnsupportedRef = useRef(false);
    useEffect(() => {
        if (sensorStatus === 'unsupported' && isMobileContext && !hasShownUnsupportedRef.current) {
            hasShownUnsupportedRef.current = true;
            toast.info(t('hero.motion_tilt_unsupported', 'Motion tilt is not supported on this device'));
        }
    }, [sensorStatus, isMobileContext, t]);

    return (
        <section
            ref={containerRef}
            onClick={handleHeroReGrant}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={cn(
                styles.hero,
                "relative pb-4 lg:pt-24 lg:pb-20 px-4 bg-gradient-to-b from-[#F8F5FC]/90 via-[#EDE4F5]/80 to-[#F0E8F8]/70 dark:from-[#1a0a2e]/85 dark:via-[#2D1548]/75 dark:to-[#1a0a2e]/60 lg:min-h-[100dvh] flex flex-col justify-center",
                nativeApp ? "pt-12 min-h-[58dvh]" : "pt-14 min-h-[62dvh]"
            )}
        >
            {/* Animated Background Elements - Deferred */}
            {showBackground && !staticMode && (
                <>
                    <FloatingOrbs />
                    <Particles />
                </>
            )}

            {/* Mesh gradient overlay */}
            <div className={cn(styles.heroBloom, "absolute inset-0 dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.25),transparent)] pointer-events-none")} />

            {/* Premium Layered Horizon Glow - 3D Depth with Aurora Color Cycling */}
            <div className={cn(styles.horizonGlowWrapper, "absolute inset-0 pointer-events-none overflow-hidden -z-10")}>


                {/* Primary Layer - Hot Additive Core */}
                <div className={cn(styles.horizonGlowPrimary, "absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[60%] w-[90%] mix-blend-plus-lighter")} />

                {/* Secondary Layer - Wide Depth */}
                <div className={cn(styles.horizonGlowSecondary, "absolute left-1/2 -translate-x-1/2 top-[45%] -translate-y-1/2 h-[50%] w-[85%] mix-blend-screen")} />

                {/* Tertiary Layer - Grounding */}
                <div className={cn(styles.horizonGlowTertiary, "absolute left-1/2 -translate-x-1/2 top-[55%] -translate-y-1/2 h-[45%] w-[85%] mix-blend-screen")} />
            </div>

            <motion.div
                style={{ rotateX, rotateY, transformPerspective: 1000 }}
                className="container max-w-5xl mx-auto text-center relative z-10"
            >
                <FloatingElement delay={0}>
                    <AnimatedBadge />
                </FloatingElement>

                <h1
                    className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-foreground mb-6 leading-tight flex flex-col items-center justify-center"
                >
                    <div
                        className="flex items-center justify-center flex-wrap gap-2 md:gap-4"
                    >
                        <InteractiveWord word={t('hero.unleash')} type="unleash" />
                        <InteractiveWord word={t('hero.your')} type="your" />
                    </div>
                    <span
                        className="relative mt-2"
                    >
                        <span className="flex items-center justify-center gap-2 md:gap-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
                            <InteractiveWord word={t('hero.full')} type="full" className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary" />
                            <InteractiveWord word={t('hero.potential')} type="potential" className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary" />
                        </span>
                        {/* Glow effect behind text */}
                        {!staticMode && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-400/30 to-secondary/30 blur-2xl -z-10"
                                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}
                    </span>
                </h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    {t('hero.description')}
                    <motion.span
                        className="text-foreground font-semibold hover:text-primary transition-colors duration-300"
                    > {t('hero.intelligent')}</motion.span>,
                    <motion.span
                        className="text-foreground font-semibold hover:text-primary transition-colors duration-300"
                    > {t('hero.personalized')}</motion.span>, {i18n.language === 'es' ? 'e' : 'and'}
                    <motion.span
                        className="text-foreground font-semibold hover:text-primary transition-colors duration-300"
                    > {t('hero.effective')}</motion.span>.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link to="/wizard">
                        <motion.div
                            whileHover={{
                                scale: 1.05,
                            }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="rounded-full relative group"
                        >
                            <Button size="xl" className="relative h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 group overflow-hidden border-0">
                                <span className="relative z-10 flex items-center gap-2">
                                    <Flame className="h-5 w-5 group-hover:animate-pulse" />
                                    {t('hero.start')}
                                    {staticMode ? (
                                        <ArrowRight className="h-5 w-5" />
                                    ) : (
                                        <motion.span
                                            className="inline-block"
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <ArrowRight className="h-5 w-5" />
                                        </motion.span>
                                    )}
                                </span>
                                {/* Animated gradient overlay */}
                                {!staticMode && (
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                                        animate={{ x: ["-100%", "200%"] }}
                                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                                    />
                                )}
                                {/* Glow ring on hover */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-full opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500 -z-10" />
                            </Button>
                        </motion.div>
                    </Link>

                    <Link to="/plan">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="rounded-full"
                        >
                            <Button variant="outline" size="xl" className="h-14 px-8 text-lg rounded-full border-2 border-primary/30 hover:bg-primary/5 hover:border-primary/60 transition-all duration-300 backdrop-blur-sm">
                                {t('hero.view_plan')}
                            </Button>
                        </motion.div>
                    </Link>
                    {showMotionButton && (
                        needsReGrant ? (
                            // Returning user on iOS: tap-anywhere is active on the hero,
                            // show a subtle hint instead of the full button.
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 1.8 }}
                                className="text-sm text-muted-foreground/70 mt-1"
                            >
                                {isRequestingPermission
                                    ? t('hero.enabling_motion', 'Enabling motion...')
                                    : t('hero.tap_to_resume_tilt', 'Tap to resume tilt effect')}
                            </motion.p>
                        ) : (
                            // First-time user: show the explicit enable button.
                            <Button
                                type="button"
                                size="xl"
                                variant="secondary"
                                className="h-14 px-8 text-lg rounded-full"
                                onClick={() => {
                                    setIsRequestingPermission(true);
                                    void requestMotionTiltPermission()
                                        .then((status) => {
                                            if (status.permission === 'granted') {
                                                setMobileMotionEnabled(true);
                                            } else {
                                                toast.error(t('hero.motion_tilt_denied', 'Motion tilt access was denied'));
                                            }
                                        })
                                        .finally(() => setIsRequestingPermission(false));
                                }}
                                disabled={isRequestingPermission}
                                aria-label={t('hero.enable_motion', 'Enable motion tilt')}
                            >
                                {isRequestingPermission
                                    ? t('hero.enabling_motion', 'Enabling motion...')
                                    : t('hero.enable_motion', 'Enable motion tilt')}
                            </Button>
                        )
                    )}
                </motion.div>

                {/* Decorative floating elements */}
                {!staticMode && (
                    <>
                        <div className="absolute top-16 left-8 hidden lg:block pointer-events-none">
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [0, 10, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sparkles className="w-10 h-10 text-primary/40" />
                            </motion.div>
                        </div>
                        <div className="absolute top-32 right-12 hidden lg:block pointer-events-none">
                            <motion.div
                                animate={{
                                    y: [0, 15, 0],
                                    rotate: [0, -15, 0]
                                }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            >
                                <Star className="w-8 h-8 text-secondary/50 fill-secondary/30" />
                            </motion.div>
                        </div>
                        <div className="absolute bottom-24 left-16 hidden lg:block pointer-events-none">
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    x: [0, 5, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            >
                                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary to-secondary" />
                            </motion.div>
                        </div>
                        <div className="absolute bottom-16 right-20 hidden lg:block pointer-events-none">
                            <motion.div
                                animate={{
                                    y: [0, 12, 0],
                                    rotate: [0, 360]
                                }}
                                transition={{
                                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                                }}
                            >
                                <Sparkles className="w-6 h-6 text-accent/60" />
                            </motion.div>
                        </div>
                    </>
                )}
            </motion.div>
        </section>
    );
}
