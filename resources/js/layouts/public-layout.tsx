import { Toaster } from 'sileo';
import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { BreadcrumbItem } from '@/types';

interface PublicLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  modName?: string;
  modSlug?: string;
  showPublicBadge?: boolean;
}

export default function PublicLayout({
  children,
  breadcrumbs = [],
  modName,
  modSlug,
  showPublicBadge = true,
}: PublicLayoutProps) {
  const enhancedBreadcrumbs: BreadcrumbItem[] = [
    { title: 'Docs', href: '/docs' },
    ...(modName && modSlug
      ? [{ title: modName, href: `/docs/${modSlug}` }]
      : []),
    ...breadcrumbs,
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNavbar />

      {/* Public Documentation Header */}
      {modName && (
        <div className="border-b bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{modName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public Documentation
                </p>
              </div>
              {showPublicBadge && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/10">
                    Public
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {enhancedBreadcrumbs && enhancedBreadcrumbs.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={enhancedBreadcrumbs} />
          </div>
        )}
        {children}
      </main>
      <AppFooter />
      <Toaster theme="light" position="top-right" />
    </div>
  );
}
