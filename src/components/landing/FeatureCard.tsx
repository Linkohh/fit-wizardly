import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedIcon } from '@/components/ui/page-transition';
import { ArrowRight } from 'lucide-react';

export function FeatureCard({ feature, index }: { feature: any; index: number }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
            whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            className="group"
        >
            <Card
                variant="interactive"
                className="relative text-center h-full bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/40 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden"
            >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Glow effect */}
                <motion.div
                    className={`absolute -inset-px bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                    style={{ zIndex: -1 }}
                />

                <CardContent className="p-6 relative">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <motion.div
                                className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl transition-all duration-500 cursor-pointer overflow-visible relative`}
                                whileHover={{
                                    scale: 1.1,
                                    rotate: [0, -5, 5, 0],
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <AnimatedIcon>
                                    <feature.icon className="h-7 w-7 text-white" />
                                </AnimatedIcon>

                                {/* Pulse ring */}
                                <motion.div
                                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient}`}
                                    animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                />
                            </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">{feature.description}</p>
                        </TooltipContent>
                    </Tooltip>

                    <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                    </p>

                    {/* Arrow indicator */}
                    <motion.div
                        className="mt-4 flex items-center justify-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                    >
                        <span className="text-sm font-medium">Learn more</span>
                        <ArrowRight className="h-4 w-4" />
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
