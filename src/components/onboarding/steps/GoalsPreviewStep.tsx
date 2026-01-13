import { motion } from 'framer-motion';
import { useOnboardingStore, InterestGoal } from '@/stores/onboardingStore';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, Scale, Wind, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalOption {
    id: InterestGoal;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
    {
        id: 'strength',
        title: 'Build Strength',
        description: 'Increase power and lift heavier',
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    },
    {
        id: 'muscle',
        title: 'Gain Muscle',
        description: 'Maximize muscle growth',
        icon: <Target className="h-6 w-6" />,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
        id: 'weight_loss',
        title: 'Lose Weight',
        description: 'Burn fat and get lean',
        icon: <Scale className="h-6 w-6" />,
        color: 'text-green-500 bg-green-500/10 border-green-500/20',
    },
    {
        id: 'endurance',
        title: 'Improve Endurance',
        description: 'Build stamina and conditioning',
        icon: <Wind className="h-6 w-6" />,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
        id: 'flexibility',
        title: 'Increase Flexibility',
        description: 'Enhance mobility and recovery',
        icon: <Sparkles className="h-6 w-6" />,
        color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    },
];

export function GoalsPreviewStep() {
    const { userData, toggleGoal } = useOnboardingStore();

    return (
        <div className="space-y-8 text-center">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h1 className="text-3xl font-bold text-foreground">
                    What interests you most?
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Select any that apply — this helps us personalize your recommendations. You can always change these later.
                </p>
            </motion.div>

            {/* Goals grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                {GOAL_OPTIONS.map((goal, index) => {
                    const isSelected = userData.interestedGoals.includes(goal.id);

                    return (
                        <motion.button
                            key={goal.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + index * 0.05 }}
                            onClick={() => toggleGoal(goal.id)}
                            className="text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
                        >
                            <Card
                                className={cn(
                                    "relative h-full transition-all duration-200 overflow-hidden border-2",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-glow"
                                        : "border-transparent hover:border-primary/30 hover:shadow-md bg-card"
                                )}
                            >
                                <CardContent className="p-4 space-y-2">
                                    {/* Icon */}
                                    <motion.div
                                        className={cn(
                                            "inline-flex p-2 rounded-lg transition-colors duration-200",
                                            goal.color
                                        )}
                                        animate={{ scale: isSelected ? 1.1 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400 }}
                                    >
                                        {goal.icon}
                                    </motion.div>

                                    {/* Title */}
                                    <h3 className="font-semibold text-foreground text-sm">
                                        {goal.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {goal.description}
                                    </p>

                                    {/* Selection indicator */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isSelected ? 1 : 0,
                                            opacity: isSelected ? 1 : 0,
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                                    >
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </motion.div>
                                </CardContent>
                            </Card>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selection count */}
            <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {userData.interestedGoals.length === 0 ? (
                    <span>Select your interests to get personalized recommendations</span>
                ) : (
                    <span className="text-primary font-medium">
                        {userData.interestedGoals.length} goal{userData.interestedGoals.length !== 1 ? 's' : ''} selected
                    </span>
                )}
            </motion.p>
        </div>
    );
}
