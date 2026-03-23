import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full py-5 md:py-4 mt-auto safe-area-bottom relative">
            {/* Glass background layer */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
            />

            {/* Premium gradient top border */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute inset-x-0 top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 px-4 text-xs md:text-sm text-muted-foreground/80">

                <div className="flex items-center gap-1.5 text-center">
                    <span className="font-display text-xs font-bold gradient-text tracking-wide">FitWizard</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span>{t('footer.copyright', { year })}</span>
                    <Heart className="h-3 w-3 text-secondary fill-secondary animate-pulse" />
                    <span>{t('footer.for_fitness')}</span>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-6">
                    <Link to="/legal" className="hover:text-foreground transition-colors duration-200 whitespace-nowrap">
                        {t('footer.terms')}
                    </Link>
                    <Link to="/guide" className="hover:text-primary transition-colors duration-200 font-medium whitespace-nowrap">
                        {t('footer.how_to_use')}
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors duration-200 whitespace-nowrap">
                        {t('footer.privacy')}
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors duration-200 whitespace-nowrap">
                        {t('footer.medical')}
                    </Link>
                </nav>

            </div>
        </footer>
    );
}
