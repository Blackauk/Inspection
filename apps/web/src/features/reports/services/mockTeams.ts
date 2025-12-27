// Mock teams for scheduled reports
// TODO: Replace with real team service API call
export interface MockTeam {
  id: string;
  name: string;
  siteIds: string[];
}

export const mockTeams: MockTeam[] = [
  {
    id: 'team-1',
    name: 'Plant Team',
    siteIds: ['1', '2'],
  },
  {
    id: 'team-2',
    name: 'Workshop',
    siteIds: ['1'],
  },
  {
    id: 'team-3',
    name: 'Maintenance Crew',
    siteIds: ['2', '3'],
  },
];

