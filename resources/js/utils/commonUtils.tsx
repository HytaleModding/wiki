import { LayoutGrid } from 'lucide-react';
import type { NavItem } from '@/types/navigation';
import { dashboard } from '@/routes';

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
  },
];

export const visibilityOptions = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view this mod',
  },
  {
    value: 'unlisted',
    label: 'Unlisted',
    description: 'Only people with the link can view',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you and collaborators can view',
  },
];

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getVisibilityColor = (visibility: string) => {
  switch (visibility) {
    case 'public':
      return 'bg-transparent text-cyan-400 border border-cyan-400 font-bold';
    case 'private':
      return 'bg-transparent text-lime-400 border border-lime-400 font-bold';
    case 'unlisted':
      return 'bg-transparent text-yellow-400 border border-yellow-400 font-bold';
    default:
      return 'bg-transparent text-gray-400 border border-gray-400 font-bold';
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-transparent text-red-400 border border-red-400 font-bold';
    case 'admin':
      return 'bg-transparent text-blue-400 border border-blue-400 font-bold';
    case 'editor':
      return 'bg-transparent text-green-400 border border-green-400 font-bold';
    case 'viewer':
      return 'bg-transparent text-gray-400 border border-gray-400 font-bold';
    default:
      return 'bg-transparent text-gray-400 border border-gray-400 font-bold';
  }
};
