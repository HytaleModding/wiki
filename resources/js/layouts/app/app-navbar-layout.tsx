import { Toaster } from 'sileo';
import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { AppLayoutProps } from '@/types';

export default function AppNavbarLayout({
  children,
  breadcrumbs = [],
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <AppNavbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
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
