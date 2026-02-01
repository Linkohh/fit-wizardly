import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
    const { t } = useTranslation();
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border bg-background/50 backdrop-blur min-h-9 flex items-center mt-auto safe-area-bottom">
            <div className="container w-full flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-sm text-muted-foreground">

                <div className="flex items-center gap-1">
                    <span>{t('footer.copyright', { year })}</span>
                    <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
                    <span>{t('footer.for_fitness')}</span>
                </div>

                <nav className="flex items-center gap-6">
                    <Link to="/legal" className="hover:text-foreground transition-colors">
                        {t('footer.terms')}
                    </Link>
                    <Link to="/guide" className="hover:text-foreground transition-colors font-medium text-primary">
                        How to Use
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors">
                        {t('footer.privacy')}
                    </Link>
                    <Link to="/legal" className="hover:text-foreground transition-colors">
                        {t('footer.medical')}
                    </Link>
                </nav>

            </div>
        </footer>
    );
}
