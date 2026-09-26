import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";

/** "Lub-dub" double beat (~0.9s), then a calm rest before the next one. */
const HEARTBEAT: { animate: TargetAndTransition; transition: Transition } = {
    animate: { scale: [1, 1.25, 1, 1.18, 1] },
    transition: {
        duration: 0.9,
        times: [0, 0.15, 0.3, 0.45, 0.7],
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.3,
    },
};

const FOOTER_LINKS = [
    { to: "/about", labelKey: "footer.about" },
    { to: "/guide", labelKey: "footer.guide_short" },
    // Legal is one page; each link deep-links to its tab.
    { to: "/legal?tab=privacy", labelKey: "footer.privacy_short" },
    { to: "/legal?tab=terms", labelKey: "footer.terms_short" },
    { to: "/legal?tab=disclaimer", labelKey: "footer.disclaimer_short" },
] as const;

export function Footer() {
    const { t } = useTranslation();
    const { shouldReduceMotion } = useMotionPreferences();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full py-6 mt-auto safe-area-bottom relative">
            {/* Hairline top border */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container w-full flex flex-col-reverse md:flex-row items-center justify-between gap-2 md:gap-4 px-4">
                <p className="flex items-center gap-1 whitespace-nowrap text-[11px] md:text-xs text-muted-foreground/60">
                    <span>{t('footer.copyright_short', { year })}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t('footer.made_with_before')}</span>
                    <motion.span
                        data-testid="footer-heart"
                        className="inline-flex"
                        animate={shouldReduceMotion ? undefined : HEARTBEAT.animate}
                        transition={shouldReduceMotion ? undefined : HEARTBEAT.transition}
                    >
                        <Heart className="h-3 w-3 text-secondary fill-secondary" aria-label={t('footer.love')} />
                    </motion.span>
                    <span>{t('footer.made_with_after')}</span>
                </p>

                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground/80">
                    {FOOTER_LINKS.map(({ to, labelKey }) => (
                        <Link
                            key={to}
                            to={to}
                            className="-my-2 px-1 py-2 whitespace-nowrap transition-colors duration-200 hover:text-foreground active:text-foreground"
                        >
                            {t(labelKey)}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
