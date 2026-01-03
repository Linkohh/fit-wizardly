import { Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const QUOTES = [
    // Original quotes
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "Don't stop when you're tired. Stop when you're done.",
    "Discipline is doing what needs to be done, even if you don't want to do it.",
    "Sweat is just fat crying.",
    "The hard part isn't getting your body in shape. The hard part is getting your mind in shape.",
    
    // Fitness & Physical Health
    "Take care of your body. It's the only place you have to live. — Jim Rohn",
    "The body achieves what the mind believes. — Napoleon Hill",
    "Strength does not come from physical capacity. It comes from an indomitable will. — Mahatma Gandhi",
    "To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear. — Buddha",
    "Physical fitness is the first requisite of happiness. — Joseph Pilates",
    "The groundwork for all happiness is good health. — Leigh Hunt",
    "Movement is a medicine for creating change in a person's physical, emotional, and mental states. — Carol Welch",
    
    // Mental Health & Mindfulness
    "Mental health is not a destination, but a process. It's about how you drive, not where you're going. — Noam Shpancer",
    "You don't have to control your thoughts. You just have to stop letting them control you. — Dan Millman",
    "Self-care is not self-indulgence, it is self-preservation. — Audre Lorde",
    "Almost everything will work again if you unplug it for a few minutes, including you. — Anne Lamott",
    "Feelings are just visitors, let them come and go. — Mooji",
    "Be gentle with yourself, you're doing the best you can.",
    "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
    "Healing takes time, and asking for help is a courageous step. — Mariska Hargitay",
    
    // Holistic Wellness
    "Wellness is the complete integration of body, mind, and spirit. — Greg Anderson",
    "Health is a state of complete harmony of the body, mind, and spirit. — B.K.S. Iyengar",
    "The greatest wealth is health. — Virgil",
    "Nurturing yourself is not selfish — it's essential to your survival and your well-being. — Renee Peterson Trudeau",
    "When you recover or discover something that nourishes your soul and brings joy, care enough about yourself to make room for it in your life. — Jean Shinoda Bolen",
    "Balance is not something you find, it's something you create. — Jana Kingsford",
    
    // Self-Care & Self-Love
    "You yourself, as much as anybody in the entire universe, deserve your love and affection. — Buddha",
    "Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow. — Eleanor Brown",
    "Caring for myself is not self-indulgence. It is self-preservation, and that is an act of political warfare. — Audre Lorde",
    "Self-care means giving yourself permission to pause. — Cecilia Tran",
    "Love yourself first and everything else falls into line. — Lucille Ball",
    "Put yourself at the top of your to-do list every single day.",
    
    // Celebrity & Influencer Quotes
    "I really think a champion is defined not by their wins but by how they can recover when they fall. — Serena Williams",
    "Success is liking yourself, liking what you do, and liking how you do it. — Maya Angelou",
    "No matter how you feel, get up, dress up, show up, and never give up.",
    "The real workout starts when you want to stop. — Ronnie Coleman",
    "Don't limit your challenges. Challenge your limits. — Jerry Dunn",
    "If it doesn't challenge you, it doesn't change you. — Fred DeVito",
    "Training gives us an outlet for suppressed energies created by stress and thus tones the spirit just as exercise conditions the body. — Arnold Schwarzenegger",
    "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion. — Muhammad Ali",
    "Your health is an investment, not an expense.",
    "What seems impossible today will one day become your warm-up.",
    "Success isn't overnight. It's when every day you get a little better than the day before. — Dwayne Johnson",
    "Be humble. Be hungry. And always be the hardest worker in the room. — Dwayne Johnson",
    "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it. — Arnold Schwarzenegger",
    
    // Inspirational & Motivational
    "You are allowed to be both a masterpiece and a work in progress simultaneously. — Sophia Bush",
    "Happiness is not something ready-made. It comes from your own actions. — Dalai Lama",
    "The only person you are destined to become is the person you decide to be. — Ralph Waldo Emerson",
    "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
    "Every day is a new opportunity to change your life.",
    "Progress, not perfection.",
    "One day or day one. You decide.",
    "Your body hears everything your mind says. Stay positive.",
    "Breathe. It's just a bad day, not a bad life.",
    "Be the energy you want to attract.",
];

export function DailyQuote({ className }: { className?: string }) {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [animationState, setAnimationState] = useState<'visible' | 'exiting' | 'entering'>('visible');

    useEffect(() => {
        // Start with a deterministic quote based on date
        const today = new Date();
        const startIndex = (today.getDate() + today.getMonth()) % QUOTES.length;
        setQuoteIndex(startIndex);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Start exit animation
            setAnimationState('exiting');
            
            setTimeout(() => {
                // Change quote and start enter animation
                setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
                setAnimationState('entering');
                
                setTimeout(() => {
                    setAnimationState('visible');
                }, 600);
            }, 600);
        }, 12000);

        return () => clearInterval(interval);
    }, []);

    const getAnimationClasses = () => {
        switch (animationState) {
            case 'exiting':
                return 'opacity-0 scale-95 blur-sm -translate-y-4 rotate-1';
            case 'entering':
                return 'opacity-0 scale-105 blur-sm translate-y-4 -rotate-1';
            case 'visible':
            default:
                return 'opacity-100 scale-100 blur-0 translate-y-0 rotate-0';
        }
    };

    return (
        <div className={cn("relative p-8 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/20 overflow-hidden group hover:shadow-glow hover:border-primary/30 transition-all duration-500", className)}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-24 h-24 text-primary rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 p-2 rounded-full bg-primary/10 text-primary">
                    <Sparkles className={cn(
                        "w-5 h-5 transition-all duration-300",
                        animationState !== 'visible' ? "animate-spin" : "animate-pulse"
                    )} />
                </div>
                <p 
                    className={cn(
                        "text-xl md:text-2xl font-medium italic text-foreground/90 leading-relaxed max-w-2xl transition-all duration-500 ease-out transform",
                        getAnimationClasses()
                    )}
                >
                    "{QUOTES[quoteIndex]}"
                </p>
                <div className={cn(
                    "mt-4 h-1 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500",
                    animationState !== 'visible' ? "w-0" : "w-12"
                )} />
                <p className="mt-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Daily Motivation
                </p>
            </div>
        </div>
    );
}
