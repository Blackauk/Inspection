// Standard unit options for Number type checklist items
export const STANDARD_UNITS = [
  'bar',
  'psi',
  'kPa',
  '°C',
  '°F',
  'mm',
  'cm',
  'm',
  'kg',
  'g',
  'L',
  'ml',
  '%',
  'hours',
  'volts',
  'amps',
  'rpm',
] as const;

export type StandardUnit = typeof STANDARD_UNITS[number];

export const UNIT_OPTIONS = [
  ...STANDARD_UNITS.map((unit) => ({ value: unit, label: unit })),
  { value: '__OTHER__', label: 'Other...' },
];


