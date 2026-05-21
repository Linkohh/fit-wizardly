export interface NormalizedExercise {
  id: string;
  name: string;
  targetMuscles: string[];
  equipment?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  source: 'wger';
}

export interface WgerExerciseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WgerExercise[];
}

export interface WgerExercise {
  id: number;
  name?: string;
  description?: string;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  translations?: WgerTranslation[];
}

export interface WgerTranslation {
  language: number;
  name: string;
  description: string;
}

export interface WgerMuscle {
  id: number;
  name: string;
  name_en?: string;
}

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface ExerciseApiAdapter {
  search(query: string): Promise<NormalizedExercise[]>;
  getName(): 'wger';
}
