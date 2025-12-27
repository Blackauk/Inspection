// Frequency Category
export type FrequencyCategory = 'TIME' | 'HOURS' | 'DISTANCE';

// Time Unit (for TIME category)
export type TimeUnit = 'day' | 'week' | 'month' | 'year';

// Distance Unit (for DISTANCE category)
export type DistanceUnit = 'm' | 'km' | 'metres' | 'kilometres';

// Frequency Definition
export interface Frequency {
  id: string;
  name: string; // e.g. "Daily", "Every 250 hours", "Every 10,000 m"
  category: FrequencyCategory;
  intervalValue?: number; // e.g. 250, 10, 6
  intervalUnit?: TimeUnit | 'hours' | DistanceUnit; // e.g. "hours", "month", "km"
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Frequency Form Data (for creating/editing)
export interface FrequencyFormData {
  name: string;
  category: FrequencyCategory;
  intervalValue?: number;
  intervalUnit?: TimeUnit | 'hours' | DistanceUnit;
  isActive: boolean;
  sortOrder: number;
}

