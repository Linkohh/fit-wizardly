export type ReadinessRating = 1 | 2 | 3 | 4 | 5;

export interface ReadinessEntry {
    date: string;
    sleepQuality: ReadinessRating;
    muscleSoreness: ReadinessRating;
    energyLevel: ReadinessRating;
    stressLevel: ReadinessRating;
    overallScore: number;
}
