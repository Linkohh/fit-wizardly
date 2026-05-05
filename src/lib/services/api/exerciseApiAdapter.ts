import type {
  ExerciseApiAdapter,
  NormalizedExercise,
  WgerExerciseResponse,
  WgerExercise,
  ExerciseDbResponse,
  ApiNinjasExerciseResponse,
} from './types';

const WGER_BASE_URL = 'https://wger.de/api/v2';
const EXERCISEDB_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1';

// Wger API Adapter
export class WgerAdapter implements ExerciseApiAdapter {
  async search(query: string): Promise<NormalizedExercise[]> {
    try {
      const response = await fetch(
        `${WGER_BASE_URL}/exerciseinfo/?search=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(12000),
        }
      );

      if (!response.ok) {
        throw new Error(`Wger API error: ${response.statusText}`);
      }

      const data = (await response.json()) as WgerExerciseResponse;

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((exercise) => this.normalizeExercise(exercise));
    } catch (error) {
      console.error('Wger API error:', error);
      return [];
    }
  }

  private normalizeExercise(exercise: WgerExercise): NormalizedExercise {
    return {
      id: `wger-${exercise.id}`,
      name: exercise.name,
      targetMuscles: [
        ...exercise.muscles.map((m) => m.name),
        ...exercise.muscles_secondary.map((m) => m.name),
      ],
      equipment: exercise.equipment.map((e) => e.name),
      description: exercise.description || undefined,
      source: 'wger',
    };
  }

  getName(): 'wger' {
    return 'wger';
  }
}

// ExerciseDB API Adapter (RapidAPI)
export class ExerciseDbAdapter implements ExerciseApiAdapter {
  private apiKey = import.meta.env.VITE_EXERCISEDB_API_KEY;

  async search(query: string): Promise<NormalizedExercise[]> {
    if (!this.apiKey) {
      console.warn('ExerciseDB API key not configured');
      return [];
    }

    try {
      // ExerciseDB search by exercise name
      const response = await fetch(
        `${EXERCISEDB_BASE_URL}/exercises/name/${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`ExerciseDB API error: ${response.statusText}`);
      }

      const data = (await response.json()) as ExerciseDbResponse[];

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      // Deduplicate by exercise name and limit results
      const seen = new Set<string>();
      return data
        .filter((exercise) => {
          if (seen.has(exercise.name.toLowerCase())) {
            return false;
          }
          seen.add(exercise.name.toLowerCase());
          return true;
        })
        .slice(0, 20)
        .map((exercise) => this.normalizeExercise(exercise));
    } catch (error) {
      console.error('ExerciseDB API error:', error);
      return [];
    }
  }

  private normalizeExercise(exercise: ExerciseDbResponse): NormalizedExercise {
    return {
      id: `exercisedb-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: exercise.name,
      targetMuscles: exercise.muscle ? [exercise.muscle] : [],
      equipment: exercise.equipment ? [exercise.equipment] : undefined,
      difficulty: exercise.difficulty as
        | 'beginner'
        | 'intermediate'
        | 'advanced'
        | undefined,
      description: exercise.instructions || undefined,
      source: 'exercisedb',
    };
  }

  getName(): 'exercisedb' {
    return 'exercisedb';
  }
}

// API Ninjas Adapter
export class ApiNinjasAdapter implements ExerciseApiAdapter {
  private apiKey = import.meta.env.VITE_API_NINJAS_API_KEY;

  async search(query: string): Promise<NormalizedExercise[]> {
    if (!this.apiKey) {
      console.warn('API Ninjas API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${API_NINJAS_BASE_URL}/exercises?name=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error(`API Ninjas error: ${response.statusText}`);
      }

      const data = (await response.json()) as ApiNinjasExerciseResponse[];

      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      // Deduplicate by exercise name and limit results
      const seen = new Set<string>();
      return data
        .filter((exercise) => {
          if (seen.has(exercise.name.toLowerCase())) {
            return false;
          }
          seen.add(exercise.name.toLowerCase());
          return true;
        })
        .slice(0, 20)
        .map((exercise) => this.normalizeExercise(exercise));
    } catch (error) {
      console.error('API Ninjas error:', error);
      return [];
    }
  }

  private normalizeExercise(
    exercise: ApiNinjasExerciseResponse
  ): NormalizedExercise {
    return {
      id: `api-ninjas-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: exercise.name,
      targetMuscles: exercise.muscle ? [exercise.muscle] : [],
      equipment: exercise.equipment ? [exercise.equipment] : undefined,
      difficulty: exercise.difficulty || undefined,
      description: exercise.instructions || undefined,
      source: 'api-ninjas',
    };
  }

  getName(): 'api-ninjas' {
    return 'api-ninjas';
  }
}

// Factory to get all adapters
export function getAdapters(): Record<
  'wger' | 'exercisedb' | 'api-ninjas',
  ExerciseApiAdapter
> {
  return {
    wger: new WgerAdapter(),
    exercisedb: new ExerciseDbAdapter(),
    'api-ninjas': new ApiNinjasAdapter(),
  };
}
