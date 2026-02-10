import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, Dumbbell, Award, ArrowRight, RotateCcw } from 'lucide-react';

interface QuizState {
    daysPerWeek: string;
    experience: string;
    goal: string;
}

export function SplitRecommender() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizState>({
        daysPerWeek: '4',
        experience: 'intermediate',
        goal: 'hypertrophy'
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleReset = () => {
        setStep(0);
        setAnswers({
            daysPerWeek: '4',
            experience: 'intermediate',
            goal: 'hypertrophy'
        });
    };

    const calculateRecommendation = () => {
        const days = parseInt(answers.daysPerWeek);
        const { experience, goal } = answers;

        if (days <= 3) return {
            name: "Full Body Split",
            description: "Hit every muscle group 3x per week. High frequency, managing fatigue per session.",
            pros: ["High frequency (3x/week)", "Great for busy schedules", "Maximizes recovery days"],
            cons: ["Longer sessions", "Hard to focus on specific weak points"]
        };

        if (days === 4) return {
            name: "Upper / Lower Split",
            description: "Split training into Upper Body and Lower Body days. Balanced frequency and recovery.",
            pros: ["Hit muscles 2x/week", "Good balance of volume vs recovery", "Flexible scheduling"],
            cons: ["Leg days can be brutal"]
        };

        if (days === 5) {
            if (experience === 'advanced') return {
                name: "Body Part Split (Bro Split)",
                description: "Focus on 1-2 muscle groups per session with high volume.",
                pros: ["Maximum focus per muscle", "shorter sessions", "Great pump"],
                cons: ["Low frequency (1x/week)", "Missed sessions throw off whole week"]
            };
            return {
                name: "Upper / Lower / PPL Hybrid",
                description: "A mix of Upper/Lower and Push/Pull/Legs to maximize frequency on 5 days.",
                pros: ["High volume", "Prioritizes weak points", "Fun variety"],
                cons: ["Complex scheduling", "High fatigue"]
            };
        }

        if (days >= 6) return {
            name: "Push / Pull / Legs (PPL)",
            description: "The gold standard for 6-day training. Push (Chest/Shoulders/Triceps), Pull (Back/Biceps), Legs.",
            pros: ["High volume & frequency", "Logical muscle grouping", "Very popular"],
            cons: ["Requires 6 days commit", "Low recovery time"]
        };

        return { name: "Custom", description: "Consult a coach.", pros: [], cons: [] };
    };

    const recommendation = calculateRecommendation();

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <Card variant="glass" className="w-full max-w-md mx-auto overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Split Recommender
                </CardTitle>
                <CardDescription>
                    AI-powered suggestion for your optimal training split.
                </CardDescription>
            </CardHeader>

            <CardContent className="min-h-[300px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                            <Label className="text-lg">How many days can you train?</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[2, 3, 4, 5, 6].map(d => (
                                    <Button
                                        key={d}
                                        variant={answers.daysPerWeek === d.toString() ? "default" : "outline"}
                                        onClick={() => setAnswers({ ...answers, daysPerWeek: d.toString() })}
                                        className="w-full"
                                    >
                                        {d} Days
                                    </Button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                            <Label className="text-lg">What is your experience level?</Label>
                            <RadioGroup value={answers.experience} onValueChange={(v) => setAnswers({ ...answers, experience: v })}>
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <RadioGroupItem value="beginner" id="r1" />
                                    <Label htmlFor="r1" className="cursor-pointer flex-1">Beginner (&lt; 1 year)</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <RadioGroupItem value="intermediate" id="r2" />
                                    <Label htmlFor="r2" className="cursor-pointer flex-1">Intermediate (1-3 years)</Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                                    <RadioGroupItem value="advanced" id="r3" />
                                    <Label htmlFor="r3" className="cursor-pointer flex-1">Advanced (3+ years)</Label>
                                </div>
                            </RadioGroup>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Dumbbell className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold gradient-text mb-2">{recommendation.name}</h3>
                                <p className="text-muted-foreground">{recommendation.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left text-sm">
                                <div className="space-y-1">
                                    <span className="font-semibold text-emerald-500">Pros</span>
                                    <ul className="list-disc pl-4 text-muted-foreground">
                                        {recommendation.pros.map(p => <li key={p}>{p}</li>)}
                                    </ul>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-semibold text-red-500">Cons</span>
                                    <ul className="list-disc pl-4 text-muted-foreground">
                                        {recommendation.cons.map(c => <li key={c}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between">
                {step < 2 ? (
                    <>
                        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
                        <Button onClick={handleNext} className="gap-2">
                            Next <ArrowRight className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleReset} variant="outline" className="w-full gap-2">
                        <RotateCcw className="w-4 h-4" /> Start Over
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
