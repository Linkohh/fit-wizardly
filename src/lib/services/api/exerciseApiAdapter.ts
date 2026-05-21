import type {
  ExerciseApiAdapter,
  NormalizedExercise,
  WgerExercise,
  WgerExerciseResponse,
} from './types';

const WGER_BASE_URL = 'https://wger.de/api/v2';

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').trim();
}

function getBestTranslation(exercise: WgerExercise) {
  return (
    exercise.translations?.find(
      (translation) => translation.language === 2 && translation.name.trim() !== ''
    ) ??
    exercise.translations?.find((translation) => translation.name.trim() !== '') ??
    null
  );
}

export class WgerAdapter implements ExerciseApiAdapter {
  async search(query: string): Promise<NormalizedExercise[]> {
    try {
      const response = await fetch(
        `${WGER_BASE_URL}/exerciseinfo/?search=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(12000),
        }
      );

      if (!response.ok) {
        throw new Error(`Wger API error: ${response.statusText}`);
      }

      const data = (await response.json()) as WgerExerciseResponse;
      if (!Array.isArray(data.results) || data.results.length === 0) {
        return [];
      }

      return data.results.map((exercise) => this.normalizeExercise(exercise));
    } catch (error) {
      console.error('Wger API error:', error);
      return [];
    }
  }

  private normalizeExercise(exercise: WgerExercise): NormalizedExercise {
    const translation = getBestTranslation(exercise);
    const name = translation?.name || exercise.name || `Exercise ${exercise.id}`;
    const description = translation?.description || exercise.description || '';

    return {
      id: `wger-${exercise.id}`,
      name,
      targetMuscles: [
        ...exercise.muscles.map((muscle) => muscle.name_en || muscle.name),
        ...exercise.muscles_secondary.map((muscle) => muscle.name_en || muscle.name),
      ],
      equipment: exercise.equipment.map((item) => item.name),
      description: description ? stripHtml(description) : undefined,
      source: 'wger',
    };
  }

  getName(): 'wger' {
    return 'wger';
  }
}

export function getAdapters(): Record<'wger', ExerciseApiAdapter> {
  return {
    wger: new WgerAdapter(),
  };
}
