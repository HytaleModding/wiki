import { Toaster } from 'sileo';
import AppNavbar from '@/components/app-navbar';
import AppFooter from '@/components/app-footer';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { AppLayoutProps } from '@/types';

export default function AppNavbarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppNavbar />
            <main className="flex-1 mx-auto max-w-7xl px-4 py-6 w-full">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <div className="mb-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                )}
                <div className="space-y-6">
                    {children}
                </div>
            </main>
            <AppFooter />
            <Toaster theme="light" position="top-right" />
        </div>
    );
}
