import { getAllCategories } from '@/lib/exercise-utils';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
    Activity, Dumbbell, Anchor, Footprints, LayoutGrid, Zap,
    ShieldPlus, Truck, PersonStanding, RotateCw, HeartPulse,
    MoveHorizontal, Workflow, Cat, LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    Activity, Dumbbell, Anchor, Footprints, LayoutGrid, Zap,
    ShieldPlus, Truck, PersonStanding, RotateCw, HeartPulse,
    StretchHorizontal: MoveHorizontal, // Using MoveHorizontal as fallback for Stretch
    Workflow, Cat
};

export default function ExerciseCategories() {
    const categories = getAllCategories();

    return (
        <div className="container py-8 fade-in min-h-screen">
            <div className="mb-12 text-center max-w-2xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text tracking-tight">Exercise Library</h1>
                <p className="text-muted-foreground text-lg">
                    Browse our comprehensive collection of exercises, organized by body part and movement pattern.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map(cat => {
                    const Icon = iconMap[cat.iconKey] || Activity;
                    return (
                        <Link to={`/exercises/${cat.id}`} key={cat.id} className="group h-full">
                            <Card className="h-full p-6 bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden">
                                {/* Subtle Texture/Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 group-hover:ring-primary/40 shadow-inner">
                                        <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2 group-hover:text-white transition-colors text-foreground">{cat.title}</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
