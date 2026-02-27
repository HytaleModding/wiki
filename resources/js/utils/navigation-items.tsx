import { LayoutGrid } from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types/navigation';

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
  },
];
