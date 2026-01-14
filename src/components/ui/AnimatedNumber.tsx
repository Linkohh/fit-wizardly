import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="tabular-nums"
        >
            {isInView ? (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {value}{suffix}
                </motion.span>
            ) : (
                '0'
            )}
        </motion.span>
    );
}
