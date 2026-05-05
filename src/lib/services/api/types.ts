// Normalized exercise type returned by all adapters
export interface NormalizedExercise {
  id: string;
  name: string;
  targetMuscles: string[];
  equipment?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  source: 'wger' | 'exercisedb' | 'api-ninjas';
}

// API-specific response types
export interface WgerExerciseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WgerExercise[];
}

export interface WgerExercise {
  id: number;
  name: string;
  description: string;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  category: WgerCategory;
  images: WgerImage[];
}

export interface WgerMuscle {
  id: number;
  name: string;
}

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface WgerCategory {
  id: number;
  name: string;
}

export interface WgerImage {
  id: number;
  image: string;
  is_main: boolean;
}

// ExerciseDB API response types
export interface ExerciseDbResponse {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty?: string;
  instructions?: string;
}

// API Ninjas response type
export interface ApiNinjasExerciseResponse {
  name: string;
  type: string;
  muscle: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  instructions: string;
  equipment?: string;
}

// Adapter interface
export interface ExerciseApiAdapter {
  search(query: string): Promise<NormalizedExercise[]>;
  getName(): 'wger' | 'exercisedb' | 'api-ninjas';
}
