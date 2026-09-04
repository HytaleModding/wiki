import { Toaster } from 'sileo';
import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
  editorial = false,
}: {
  children: React.ReactNode;
  editorial?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background font-sans',
        editorial && 'dashboard-shell',
      )}
    >
      <AppNavbar />
      <main className="w-full flex-1">
        <div className="space-y-6">{children}</div>
      </main>
      <AppFooter />
      <Toaster theme="light" position="top-right" />
    </div>
  );
}
