import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { NormalizedExercise } from '@/lib/services/api/types';

interface ExerciseResultsProps {
  exercises: NormalizedExercise[];
  onSelectExercise?: (exerciseId: string, exerciseName: string) => void;
}

const SOURCE_COLORS: Record<
  'wger' | 'exercisedb' | 'api-ninjas',
  'default' | 'secondary' | 'destructive'
> = {
  wger: 'default',
  exercisedb: 'secondary',
  'api-ninjas': 'destructive',
};

const SOURCE_LABELS: Record<
  'wger' | 'exercisedb' | 'api-ninjas',
  string
> = {
  wger: 'Wger',
  exercisedb: 'ExerciseDB',
  'api-ninjas': 'API Ninjas',
};

export function ExerciseResults({
  exercises,
  onSelectExercise,
}: ExerciseResultsProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700">
        Found {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
      </div>

      <div className="space-y-2">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">
                    {exercise.name}
                  </h3>
                  <Badge variant={SOURCE_COLORS[exercise.source]}>
                    {SOURCE_LABELS[exercise.source]}
                  </Badge>
                </div>

                {exercise.targetMuscles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exercise.targetMuscles.map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                )}

                {exercise.equipment && exercise.equipment.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Equipment: </span>
                    {exercise.equipment.join(', ')}
                  </div>
                )}

                {exercise.difficulty && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Difficulty: </span>
                    <span className="capitalize">{exercise.difficulty}</span>
                  </div>
                )}

                {exercise.description && (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {exercise.description}
                  </p>
                )}
              </div>

              {onSelectExercise && (
                <Button
                  onClick={() =>
                    onSelectExercise(exercise.id, exercise.name)
                  }
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Select
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
