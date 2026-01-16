import { motion } from 'framer-motion';
import { useOnboardingStore, UserRole } from '@/stores/onboardingStore';
import { Card, CardContent } from '@/components/ui/card';
import { User, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface RoleOption {
    id: UserRole;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
}

const getRoleOptions = (t: (key: string) => string): RoleOption[] => [
    {
        id: 'user',
        title: t('onboarding.role.options.user.title'),
        description: t('onboarding.role.options.user.description'),
        icon: <User className="h-8 w-8" />,
        features: [
            t('onboarding.role.options.user.features.personalized_plans'),
            t('onboarding.role.options.user.features.progress_tracking'),
            t('onboarding.role.options.user.features.exercise_library'),
        ],
    },
    {
        id: 'coach',
        title: t('onboarding.role.options.coach.title'),
        description: t('onboarding.role.options.coach.description'),
        icon: <Crown className="h-8 w-8" />,
        features: [
            t('onboarding.role.options.coach.features.everything_personal'),
            t('onboarding.role.options.coach.features.client_management'),
            t('onboarding.role.options.coach.features.bulk_creation'),
            t('onboarding.role.options.coach.features.private_notes'),
        ],
    },
];

export function RoleStep() {
    const { userData, setRole } = useOnboardingStore();
    const { t } = useTranslation();
    const roleOptions = getRoleOptions(t);

    return (
        <div className="space-y-8 text-center">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl font-bold text-foreground">
                    {t('onboarding.role.title')}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    {t('onboarding.role.description')}
                </p>
            </motion.div>

            {/* Role cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {roleOptions.map((role, index) => {
                    const isSelected = userData.role === role.id;

                    return (
                        <motion.button
                            key={role.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            onClick={() => setRole(role.id)}
                            className="text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                        >
                            <Card
                                className={cn(
                                    "relative h-full transition-all duration-300 overflow-hidden",
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-glow"
                                        : "border-border hover:border-primary/50 hover:shadow-md"
                                )}
                            >
                                <CardContent className="p-6 space-y-4">
                                    {/* Icon + Badge */}
                                    <div className="flex items-start justify-between">
                                        <motion.div
                                            className={cn(
                                                "p-3 rounded-xl transition-colors duration-300",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            )}
                                            animate={{ scale: isSelected ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 400 }}
                                        >
                                            {role.icon}
                                        </motion.div>

                                        {/* Selection indicator */}
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isSelected ? 1 : 0,
                                                opacity: isSelected ? 1 : 0,
                                            }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                                        >
                                            <Check className="h-4 w-4 text-primary-foreground" />
                                        </motion.div>
                                    </div>

                                    {/* Title + Description */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {role.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {role.description}
                                        </p>
                                    </div>

                                    {/* Features list */}
                                    <ul className="space-y-2">
                                        {role.features.map((feature, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + i * 0.05 }}
                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                                <div className={cn(
                                                    "h-1.5 w-1.5 rounded-full",
                                                    isSelected ? "bg-primary" : "bg-muted-foreground/50"
                                                )} />
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </CardContent>

                                {/* Coach badge */}
                                {role.id === 'coach' && (
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/20 text-secondary">
                                            {t('onboarding.role.pro_badge')}
                                        </span>
                                    </div>
                                )}
                            </Card>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
