import { Link } from '@inertiajs/react';
import {
  Activity,
  ArrowRight,
  KeyRound,
  LayoutDashboard,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminMod, AuditItem } from '@/types/admin';

type Metrics = {
  users: number;
  suspended_users: number;
  mods: number;
  suspended_mods: number;
  api_keys: number;
  requests_today: number;
};

export default function Overview({
  metrics,
  recentMods,
  recentAudit,
}: {
  metrics: Metrics;
  recentMods: AdminMod[];
  recentAudit: AuditItem[];
}) {
  return (
    <AdminLayout
      title="Platform overview"
      description="Monitor the platform and jump directly into administrative work."
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Users"
          value={metrics.users}
          note={`${metrics.suspended_users} suspended`}
          icon={Users}
          href="/dashboard/admin/users"
        />
        <Metric
          label="Mods"
          value={metrics.mods}
          note={`${metrics.suspended_mods} suspended`}
          icon={LayoutDashboard}
          href="/dashboard/admin/mods"
        />
        <Metric
          label="API keys"
          value={metrics.api_keys}
          note="Issued credentials"
          icon={KeyRound}
          href="/dashboard/admin/api-keys"
        />
        <Metric
          label="Requests today"
          value={metrics.requests_today}
          note="Across API endpoints"
          icon={Activity}
          href="/dashboard/admin/api-keys"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b">
            <div>
              <CardTitle>Recently updated mods</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Open an admin record to inspect and manage it.
              </p>
            </div>
            <Link
              href="/dashboard/admin/mods"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All mods <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recentMods.map((mod) => (
              <Link
                key={mod.id}
                href={`/dashboard/admin/mods/${mod.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                  {mod.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{mod.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(mod.owner)} · {mod.pages_count} pages ·{' '}
                    {mod.updated_at}
                  </p>
                </div>
                {mod.is_suspended && (
                  <Badge variant="destructive">Suspended</Badge>
                )}
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b">
            <div>
              <CardTitle>Administrator activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Recorded platform changes.
              </p>
            </div>
            <Link
              href="/dashboard/admin/audit-log"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recentAudit.length ? (
              recentAudit.map((item) => (
                <div key={item.id} className="flex gap-3 px-5 py-4">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    <ShieldAlert className="size-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm">{item.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.actor} · {item.created_at}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No administrator actions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </AdminLayout>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition-transform group-hover:scale-105">
            <Icon className="size-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
