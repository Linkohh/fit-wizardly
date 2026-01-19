import { motion } from 'framer-motion';
import { useOnboardingStore, AVATAR_OPTIONS } from '@/stores/onboardingStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WelcomeStep() {
    const { userData, setDisplayName, setAvatarEmoji } = useOnboardingStore();

    return (
        <div className="space-y-8 text-center">
            {/* Hero text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Welcome to FitWizard</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                    Let's personalize your experience
                </h1>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    First, tell us a bit about yourself so we can create the perfect workout journey for you.
                </p>
            </motion.div>

            {/* Preview card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
                    <CardContent className="p-6">
                        {/* Avatar + Name preview */}
                        <div className="flex items-center gap-4 mb-6">
                            <motion.div
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl border-2 border-primary/30"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                {userData.avatarEmoji}
                            </motion.div>
                            <div className="text-left">
                                <motion.p
                                    className="text-lg font-semibold text-foreground"
                                    key={userData.displayName}
                                    initial={{ opacity: 0.5 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {userData.displayName || 'Your Name'}
                                </motion.p>
                                <p className="text-sm text-muted-foreground">Ready to start training</p>
                            </div>
                        </div>

                        {/* Name input */}
                        <div className="space-y-2 text-left">
                            <Label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                What should we call you?
                            </Label>
                            <Input
                                id="displayName"
                                value={userData.displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name or nickname..."
                                className="bg-background/50"
                                autoFocus
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Avatar picker */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
            >
                <Label className="text-sm font-medium text-muted-foreground">
                    Choose your avatar
                </Label>
                <div className="flex flex-wrap justify-center gap-2">
                    {AVATAR_OPTIONS.map((emoji, index) => (
                        <motion.button
                            key={emoji}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.03 }}
                            onClick={() => setAvatarEmoji(emoji)}
                            className={cn(
                                "w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all duration-200",
                                "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                userData.avatarEmoji === emoji
                                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                                    : "bg-muted/30"
                            )}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {emoji}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
