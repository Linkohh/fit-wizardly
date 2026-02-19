import { useEffect, useState } from 'react';
import type { Exercise } from '@/types/fitness';

let exerciseCache: Exercise[] | null = null;
let exercisePromise: Promise<Exercise[]> | null = null;

export async function loadExerciseDatabase(): Promise<Exercise[]> {
    if (exerciseCache) return exerciseCache;

    if (!exercisePromise) {
        exercisePromise = import('@/data/exercises').then((module) => {
            exerciseCache = module.EXERCISE_DATABASE;
            return exerciseCache;
        });
    }

    return exercisePromise;
}

export function getCachedExerciseDatabase(): Exercise[] {
    return exerciseCache ?? [];
}

export function useExerciseDatabase() {
    const [exercises, setExercises] = useState<Exercise[]>(() => getCachedExerciseDatabase());
    const [isLoading, setIsLoading] = useState(() => getCachedExerciseDatabase().length === 0);

    useEffect(() => {
        let isMounted = true;
        loadExerciseDatabase().then((loaded) => {
            if (!isMounted) return;
            setExercises(loaded);
            setIsLoading(false);
        });
        return () => {
            isMounted = false;
        };
    }, []);

    return { exercises, isLoading };
}
