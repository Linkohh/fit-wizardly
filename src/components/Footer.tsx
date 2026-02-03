import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border bg-background/50 backdrop-blur py-4 md:py-2 mt-auto safe-area-bottom">
            <div className="container w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 px-4 text-xs md:text-sm text-muted-foreground">

                <div className="flex items-center gap-1 text-center">
                    <span>{t('footer.copyright', { year })}</span>
                    <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                    <span>{t('footer.for_fitness')}</span>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-6">
                    <Link to="/legal" className="hover:text-foreground transition-colors whitespace-nowrap">
                        {t('footer.terms')}
                    </Link>
                    <Link to="/guide" className="hover:text-foreground transition-colors font-medium text-primary whitespace-nowrap">
                        How to Use
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors whitespace-nowrap">
                        {t('footer.privacy')}
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors whitespace-nowrap">
                        {t('footer.medical')}
                    </Link>
                </nav>

            </div>
        </footer>
    );
}
