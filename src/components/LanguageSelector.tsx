import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changeLanguage, getCurrentLanguage, AVAILABLE_LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

    const handleLanguageChange = async (langCode: string) => {
        await changeLanguage(langCode as 'en' | 'es');
        setCurrentLang(langCode);
        setIsOpen(false);
        // Persist to localStorage
        localStorage.setItem('fitwizard-language', langCode);
    };

    const currentLanguage = AVAILABLE_LANGUAGES.find((l) => l.code === currentLang);

    return (
        <div className="relative">
            {/* Trigger button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2 px-3"
            >
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm hidden sm:inline">{currentLanguage?.name || 'English'}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </motion.div>
            </Button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-lg border bg-popover p-1 shadow-lg"
                        >
                            {AVAILABLE_LANGUAGES.map((lang) => {
                                const isSelected = lang.code === currentLang;
                                return (
                                    <motion.button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                            isSelected
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="flex-1 text-left">{lang.name}</span>
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                >
                                                    <Check className="h-4 w-4 text-primary" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
