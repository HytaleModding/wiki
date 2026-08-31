import { Head, Link, usePage } from '@inertiajs/react';
import {
  Activity,
  Gauge,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Overview', href: '/dashboard/admin', icon: Gauge },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Mods', href: '/dashboard/admin/mods', icon: LayoutDashboard },
  { label: 'API keys', href: '/dashboard/admin/api-keys', icon: KeyRound },
  { label: 'Audit log', href: '/dashboard/admin/audit-log', icon: Activity },
];

export default function AdminLayout({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  useFlashMessages();
  const { url } = usePage();
  return (
    <DashboardLayout>
      <Head title={title} />
      <div className="min-h-screen bg-muted/20">
        <header className="relative overflow-hidden border-b bg-background">
          <div className="absolute inset-0 bg-linear-to-r from-primary/[0.07] via-transparent to-violet-500/[0.06]" />
          <div className="relative mx-auto max-w-7xl px-4 pt-7 sm:px-6 lg:px-8">
            <Link
              href="/dashboard/admin"
              className="mb-5 flex w-fit items-center gap-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase"
            >
              <ShieldCheck className="size-3.5" /> Platform administration
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {title}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
              {actions}
            </div>
            <nav className="flex gap-1 overflow-x-auto">
              {items.map((item) => {
                const active =
                  item.href === '/dashboard/admin'
                    ? url === item.href
                    : url.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </DashboardLayout>
  );
}
