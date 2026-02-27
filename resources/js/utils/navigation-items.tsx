import { dashboard } from '@/routes';
import { NavItem } from '@/types/navigation';
import { LayoutGrid } from 'lucide-react';

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
  },
];
