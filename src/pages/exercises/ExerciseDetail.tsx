import { useParams, Link } from 'react-router-dom';
import { getExerciseById, getCategoryById } from '@/lib/exercise-utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Activity, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ExerciseDetail() {
    const { categoryId, exerciseId } = useParams();
    const exercise = exerciseId ? getExerciseById(exerciseId) : undefined;
    const category = categoryId ? getCategoryById(categoryId) : undefined;

    if (!exercise || !category) return (
        <div className="container py-20 text-center fade-in">
            <h2 className="text-2xl font-bold mb-4">Exercise Not Found</h2>
            <Link to={`/exercises/${categoryId}`}><Button>Back to List</Button></Link>
        </div>
    );

    return (
        <div className="container py-8 fade-in min-h-screen">
            {/* Header / Nav */}
            <div className="mb-6">
                <Link to={`/exercises/${categoryId}`}>
                    <Button variant="ghost" className="gap-2 pl-0 text-muted-foreground hover:text-white">
                        <ArrowLeft size={16} /> Back to {category.title}
                    </Button>
                </Link>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Decorative Background Mesh */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold mb-3 gradient-text">{exercise.name}</h1>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.difficulty && (
                                        <Badge variant="outline" className={`
                                            ${exercise.difficulty === 'Beginner' ? 'border-green-500/30 text-green-400' : ''}
                                            ${exercise.difficulty === 'Intermediate' ? 'border-yellow-500/30 text-yellow-400' : ''}
                                            ${exercise.difficulty === 'Advanced' ? 'border-red-500/30 text-red-400' : ''}
                                        `}>
                                            {exercise.difficulty}
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                                        {category.title}
                                    </Badge>
                                </div>
                            </div>

                            {/* Action Button - Hook for Future Trainer/Plan Features */}
                            <Button className="w-full md:w-auto shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all">
                                Add to Plan
                            </Button>
                        </div>

                        {/* Grid of Details */}
                        <div className="grid md:grid-cols-2 gap-8">

                            {/* Muscles */}
                            <div className="space-y-4">
                                <section>
                                    <div className="flex items-center gap-2 mb-3 text-primary">
                                        <Activity size={20} />
                                        <h2 className="text-xl font-semibold">Targets</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {exercise.primaryMuscles.map(m => (
                                            <Badge key={m} className="bg-primary/20 hover:bg-primary/30 text-primary-foreground border-none text-md py-1 px-3">
                                                {m}
                                            </Badge>
                                        ))}
                                    </div>
                                    {exercise.secondaryMuscles && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {exercise.secondaryMuscles.map(m => (
                                                <Badge key={m} variant="outline" className="text-muted-foreground border-white/10">
                                                    {m}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Equipment */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                                        <Dumbbell size={20} />
                                        <h2 className="text-xl font-semibold">Equipment</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        {exercise.equipment.map(e => (
                                            <span key={e} className="text-lg text-white/90 font-medium">
                                                {e}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Instructions / Cues */}
                            <div className="space-y-6">
                                {/* Instructions would go here if we had them in the JSON data, 
                                    currently utilizing placeholders effectively for MVP */}
                                <Card className="bg-black/20 border-white/5 p-4 rounded-xl">
                                    <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-400" /> Form Cues
                                    </h3>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4 marker:text-primary/50">
                                        <li>Maintain a neutral spine throughout the movement.</li>
                                        <li>Control the eccentric (lowering) phase.</li>
                                        <li>Breathe steadily; exhale on effort.</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
