import type { ReactNode } from 'react';
import type { BreadcrumbItem } from './navigation';

export type AppLayoutProps = {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  contentWidth?: 'default' | 'full';
  editorial?: boolean;
};

export type AuthLayoutProps = {
  children?: ReactNode;
  name?: string;
  title?: string;
  description?: string;
};
