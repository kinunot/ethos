import type { CategoryId } from './scenarios';

export type BadgeCategory = CategoryId | 'all';
export type BadgeIcon =
  | 'shield-checkmark'
  | 'git-compare'
  | 'ribbon'
  | 'briefcase'
  | 'trophy';

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: BadgeIcon;
  color: string;
};

export const badges: BadgeDefinition[] = [
  {
    id: 'confidentiality-guardian',
    name: 'Confidentiality Guardian',
    description: 'Completed every confidentiality and privacy scenario.',
    category: 'confidentiality',
    icon: 'shield-checkmark',
    color: '#0B5C7A',
  },
  {
    id: 'conflict-navigator',
    name: 'Conflict Navigator',
    description: 'Completed every conflicts of interest scenario.',
    category: 'conflicts',
    icon: 'git-compare',
    color: '#7256A8',
  },
  {
    id: 'integrity-champion',
    name: 'Integrity Champion',
    description: 'Completed every academic and work integrity scenario.',
    category: 'integrity',
    icon: 'ribbon',
    color: '#2E9E5B',
  },
  {
    id: 'workplace-professional',
    name: 'Workplace Professional',
    description: 'Completed every workplace conduct scenario.',
    category: 'workplace',
    icon: 'briefcase',
    color: '#B7791F',
  },
  {
    id: 'ethos-complete',
    name: 'Ethos Complete',
    description: 'Completed every Ethos scenario across all categories.',
    category: 'all',
    icon: 'trophy',
    color: '#D79B1A',
  },
];
