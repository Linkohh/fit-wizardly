import { create } from 'zustand';
import type { MuscleGroup } from '@/types/fitness';

type AnatomyView = 'front' | 'back';

interface AnatomyState {
  view: AnatomyView;
  hoveredMuscle: MuscleGroup | null;
  
  // Actions
  setView: (view: AnatomyView) => void;
  toggleView: () => void;
  setHoveredMuscle: (muscle: MuscleGroup | null) => void;
}

export const useAnatomyStore = create<AnatomyState>((set) => ({
  view: 'front',
  hoveredMuscle: null,

  setView: (view) => set({ view }),
  
  toggleView: () => set((state) => ({ 
    view: state.view === 'front' ? 'back' : 'front' 
  })),
  
  setHoveredMuscle: (muscle) => set({ hoveredMuscle: muscle }),
}));
