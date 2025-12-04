import { SimpleSport } from '@/src/entities/sport/model/sport';
import { DifficultyLevel } from '@/src/types/difficulty';

export interface SportFilterCriteria {
  sportId: string;
  difficulty?: DifficultyLevel;
  minRating?: number;
}

export interface SpotSearchFilters {
  sports: SimpleSport[];
  sportCriteria: SportFilterCriteria[];
  maxDistance?: number; // Optional: only applies when defined
  minRating: number;
  onlyVerified: boolean;
}

export default SpotSearchFilters;
