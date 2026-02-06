import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategoryById, getExercisesByCategory, getExerciseById } from '@/lib/exercise-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Dumbbell, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Exercise } from '@/types/fitness';

export default function ExerciseList() {
    const { categoryId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');

    const category = categoryId ? getCategoryById(categoryId) : undefined;

    // Get all exercises for this category (flat list) to filter
    const allExercises = categoryId ? getExercisesByCategory(categoryId) : [];

    // Filter exercises based on search
    const filteredExercises = allExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ex.equipment.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Grouping Logic: If we rely on subcategories from JSON
    // Mapping helper to get Exercise object from ID
    const getExerciseObj = (id: string): Exercise | undefined => getExerciseById(id);

    if (!category) return (
        <div className="container py-20 text-center fade-in">
            <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
            <Link to="/exercises"><Button>Return to Library</Button></Link>
        </div>
    );

    // Render Function for a Grid of Exercises
    const renderExerciseGrid = (exercises: Exercise[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map(ex => (
                <Link key={ex.id} to={`/exercises/${categoryId}/${ex.id}`}>
                    <Card className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-primary/40 transition-all duration-200 cursor-pointer flex justify-between items-center backdrop-blur-sm h-full">
                        <div className="flex gap-4 items-center flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                <Dumbbell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{ex.name}</h3>
                                {ex.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{ex.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {ex.primaryMuscles.slice(0, 2).map(muscle => (
                                        <span key={muscle} className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">{muscle}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            {ex.difficulty && (
                                <Badge variant="outline" className={`
                                    ${ex.difficulty === 'Beginner' ? 'border-green-500/30 text-green-400' : ''}
                                    ${ex.difficulty === 'Intermediate' ? 'border-yellow-500/30 text-yellow-400' : ''}
                                    ${ex.difficulty === 'Advanced' ? 'border-red-500/30 text-red-400' : ''}
                                `}>
                                    {ex.difficulty}
                                </Badge>
                            )}
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );

    return (
        <div className="container py-8 fade-in min-h-screen">
            {/* Header Section */}
            <div className="mb-8">
                <Link to="/exercises" className="inline-block mb-6">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-white pl-0">
                        <ArrowLeft size={16} /> Back to Categories
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">{category.title}</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">{category.description}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-12 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder={`Search ${category.title} exercises...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50"
                />
            </div>

            {/* Content Rendering Logic */}
            {searchQuery ? (
                // If Searching, show flat filtered list
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Search Results</h2>
                    {filteredExercises.length > 0 ? renderExerciseGrid(filteredExercises) : (
                        <div className="py-12 text-center text-muted-foreground bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                            <Zap className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p>No exercises found matching "{searchQuery}"</p>
                            <Button variant="link" onClick={() => setSearchQuery('')} className="text-primary mt-2">
                                Clear Search
                            </Button>
                        </div>
                    )}
                </div>
            ) : category.subcategories && category.subcategories.length > 0 ? (
                // If Subcategories exist, render distinct sections
                <div className="space-y-12">
                    {category.subcategories.map(sub => {
                        // Resolve IDs to Objects
                        const subExercises = sub.exerciseIds
                            .map(id => getExerciseObj(id))
                            .filter((ex): ex is Exercise => ex !== undefined);

                        if (subExercises.length === 0) return null;

                        return (
                            <div key={sub.id}>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    {sub.title}
                                </h2>
                                {renderExerciseGrid(subExercises)}
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Fallback to Flat List (No Subcategories)
                renderExerciseGrid(allExercises)
            )}
        </div>
    );
}
