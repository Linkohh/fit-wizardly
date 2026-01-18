import { MuscleGroupInfo } from '../types';

export const muscleGroups: MuscleGroupInfo[] = [
  {
    id: 'chest',
    name: 'Chest',
    color: '#EF4444',
    description: 'Pectoral muscles responsible for arm adduction and rotation'
  },
  {
    id: 'back',
    name: 'Back',
    color: '#F97316',
    description: 'Upper and lower back muscles for pulling and posture'
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    color: '#EAB308',
    description: 'Deltoid muscles for arm elevation and rotation'
  },
  {
    id: 'arms',
    name: 'Arms',
    color: '#22C55E',
    description: 'Biceps, triceps, and forearm muscles'
  },
  {
    id: 'core',
    name: 'Core',
    color: '#3B82F6',
    description: 'Abdominal and oblique muscles for stability'
  },
  {
    id: 'legs',
    name: 'Legs',
    color: '#8B5CF6',
    description: 'Quadriceps, hamstrings, and adductors'
  },
  {
    id: 'glutes',
    name: 'Glutes',
    color: '#EC4899',
    description: 'Gluteal muscles for hip extension and stability'
  },
  {
    id: 'calves',
    name: 'Calves',
    color: '#06B6D4',
    description: 'Lower leg muscles for ankle movement'
  }
];

export const getMuscleGroupColor = (group: string): string => {
  const groupInfo = muscleGroups.find(g => g.id === group);
  return groupInfo?.color || '#6B7280';
};

export const getMuscleGroupName = (group: string): string => {
  const groupInfo = muscleGroups.find(g => g.id === group);
  return groupInfo?.name || group;
};
