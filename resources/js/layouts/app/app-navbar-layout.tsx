import { Toaster } from 'sileo';
import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';

export default function AppNavbarLayout({
  children,
  breadcrumbs = [],
  contentWidth = 'default',
  editorial = false,
}: AppLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background font-sans',
        editorial && 'dashboard-shell',
      )}
    >
      <AppNavbar />
      <main
        className={cn(
          'w-full flex-1 px-4 py-6',
          contentWidth === 'full' ? 'max-w-none' : 'mx-auto max-w-7xl',
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        )}
        <div className="space-y-6">{children}</div>
      </main>
      <AppFooter />
      <Toaster theme="light" position="top-right" />
    </div>
  );
}
