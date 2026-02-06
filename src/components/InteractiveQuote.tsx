import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronDown, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface InteractiveQuoteProps {
    quote: string;
    author?: string;
    tip?: string;
    className?: string;
}

/**
 * Expandable motivational quote component.
 * Clicking expands to reveal a related tip.
 * Tracks engagement via analytics.
 */
export function InteractiveQuote({ quote, author, tip, className }: InteractiveQuoteProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { trackFeature } = useAnalytics();

    const handleToggle = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);

        // Track engagement
        trackFeature('interactive_quote', newState ? 'expand' : 'collapse', {
            quote_preview: quote.substring(0, 50),
            has_tip: !!tip,
        });
    };

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all duration-300 cursor-pointer group",
                "hover:shadow-md hover:border-primary/30",
                isExpanded && "border-primary/50 shadow-glow",
                className
            )}
            onClick={handleToggle}
        >
            <CardContent className="p-5">
                {/* Quote section */}
                <div className="flex gap-3">
                    <motion.div
                        className="shrink-0"
                        animate={{
                            rotate: isExpanded ? 10 : 0,
                            scale: isExpanded ? 1.1 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <Quote className={cn(
                            "h-6 w-6 transition-colors duration-300",
                            isExpanded ? "text-primary" : "text-muted-foreground"
                        )} />
                    </motion.div>

                    <div className="flex-1 space-y-2">
                        <p className="text-foreground font-medium italic leading-relaxed">
                            "{quote}"
                        </p>

                        {author && (
                            <p className="text-sm text-muted-foreground">
                                — {author}
                            </p>
                        )}
                    </div>

                    {/* Expand indicator */}
                    {tip && (
                        <motion.div
                            className="shrink-0 self-center"
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </motion.div>
                    )}
                </div>

                {/* Expandable tip section */}
                <AnimatePresence>
                    {isExpanded && tip && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-border/50">
                                <div className="flex gap-3 items-start">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                                        className="shrink-0 p-2 rounded-lg bg-secondary/10"
                                    >
                                        <Lightbulb className="h-4 w-4 text-secondary" />
                                    </motion.div>

                                    <div>
                                        <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                                            <Sparkles className="h-3 w-3 text-primary" />
                                            Pro Tip
                                        </p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {tip}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
