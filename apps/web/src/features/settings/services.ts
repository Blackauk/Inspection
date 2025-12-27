import type { Frequency, FrequencyFormData } from './types';

// Re-export types for convenience
export type { Frequency, FrequencyFormData, FrequencyCategory, TimeUnit, DistanceUnit } from './types';

// In-memory storage for frequencies (will be replaced with API calls later)
let frequencies: Frequency[] = [
  {
    id: 'freq-1',
    name: 'Daily',
    category: 'TIME',
    intervalValue: 1,
    intervalUnit: 'day',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-2',
    name: 'Weekly',
    category: 'TIME',
    intervalValue: 1,
    intervalUnit: 'week',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-2b',
    name: 'Bi-Weekly',
    category: 'TIME',
    intervalValue: 2,
    intervalUnit: 'week',
    isActive: true,
    sortOrder: 2.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-2t',
    name: 'Tri-Weekly',
    category: 'TIME',
    intervalValue: 3,
    intervalUnit: 'week',
    isActive: true,
    sortOrder: 2.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-3',
    name: 'Monthly',
    category: 'TIME',
    intervalValue: 1,
    intervalUnit: 'month',
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-4',
    name: 'Quarterly',
    category: 'TIME',
    intervalValue: 3,
    intervalUnit: 'month',
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-4b',
    name: '6-Monthly',
    category: 'TIME',
    intervalValue: 6,
    intervalUnit: 'month',
    isActive: true,
    sortOrder: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-5',
    name: 'Yearly',
    category: 'TIME',
    intervalValue: 1,
    intervalUnit: 'year',
    isActive: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-h1',
    name: 'Every 250 hours',
    category: 'HOURS',
    intervalValue: 250,
    intervalUnit: 'hours',
    isActive: true,
    sortOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-h2',
    name: 'Every 500 hours',
    category: 'HOURS',
    intervalValue: 500,
    intervalUnit: 'hours',
    isActive: true,
    sortOrder: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-d1',
    name: 'Every 10,000 m',
    category: 'DISTANCE',
    intervalValue: 10000,
    intervalUnit: 'm',
    isActive: true,
    sortOrder: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freq-d2',
    name: 'Every 10,000 km',
    category: 'DISTANCE',
    intervalValue: 10000,
    intervalUnit: 'km',
    isActive: true,
    sortOrder: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Load frequencies from localStorage on init
const STORAGE_KEY = 'ppm-frequencies';
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      frequencies = JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load frequencies from localStorage', e);
    }
  }
}

// Save to localStorage
const saveFrequencies = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frequencies));
  }
};

export function getFrequencies(options?: { includeInactive?: boolean }): Frequency[] {
  let result = [...frequencies];
  
  if (!options?.includeInactive) {
    result = result.filter(f => f.isActive);
  }
  
  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFrequencyById(id: string): Frequency | undefined {
  return frequencies.find(f => f.id === id);
}

export function createFrequency(data: FrequencyFormData): Frequency {
  const newFrequency: Frequency = {
    id: `freq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  frequencies.push(newFrequency);
  saveFrequencies();
  return newFrequency;
}

export function updateFrequency(id: string, data: Partial<FrequencyFormData>): Frequency | null {
  const index = frequencies.findIndex(f => f.id === id);
  if (index === -1) return null;
  
  frequencies[index] = {
    ...frequencies[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  saveFrequencies();
  return frequencies[index];
}

export function deleteFrequency(id: string): boolean {
  // Check if frequency is in use (would need to check templates/schedules)
  // For now, we'll just deactivate instead of deleting
  const index = frequencies.findIndex(f => f.id === id);
  if (index === -1) return false;
  
  frequencies[index] = {
    ...frequencies[index],
    isActive: false,
    updatedAt: new Date().toISOString(),
  };
  
  saveFrequencies();
  return true;
}

export function isFrequencyInUse(id: string): boolean {
  // TODO: Check if frequency is used in any templates or schedules
  // For now, return false
  return false;
}

// Format frequency for display
export function formatFrequency(frequency: Frequency): string {
  if (frequency.category === 'TIME') {
    if (frequency.intervalValue === 1) {
      return frequency.name; // Use the name if it's a standard one
    }
    // Custom time-based: "Every 6 months"
    return `Every ${frequency.intervalValue} ${frequency.intervalUnit}${frequency.intervalValue! > 1 ? 's' : ''}`;
  } else if (frequency.category === 'HOURS') {
    return `Every ${frequency.intervalValue} hour${frequency.intervalValue! > 1 ? 's' : ''}`;
  } else if (frequency.category === 'DISTANCE') {
    const unit = frequency.intervalUnit === 'km' || frequency.intervalUnit === 'kilometres' ? 'km' : 'm';
    return `Every ${frequency.intervalValue?.toLocaleString()} ${unit}`;
  }
  return frequency.name;
}

