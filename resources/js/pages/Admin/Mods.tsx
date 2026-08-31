import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link, router } from '@inertiajs/react';
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  PauseCircle,
  RefreshCw,
  Search,
  ShieldBan,
  Users,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AdminMod, Paginated } from '@/types/admin';

type Metrics = {
  total: number;
  active: number;
  suspended: number;
  github: number;
};

export default function Mods({
  mods,
  filters,
  metrics,
}: {
  mods: Paginated<AdminMod>;
  filters: { q: string; status: string };
  metrics: Metrics;
}) {
  const [query, setQuery] = useState(filters.q);
  const search = (event: FormEvent) => {
    event.preventDefault();
    navigate(filters.status);
  };
  const navigate = (status: string) =>
    router.get(
      '/dashboard/admin/mods',
      { q: query, status },
      { preserveState: true, replace: true },
    );
  const suspend = (mod: AdminMod) => {
    if (
      window.confirm(
        `${mod.is_suspended ? 'Reactivate' : 'Suspend'} ${mod.name}?`,
      )
    )
      router.patch(
        `/dashboard/admin/mods/${mod.slug}/suspension`,
        {},
        { preserveScroll: true },
      );
  };
  const sync = (mod: AdminMod) => {
    if (window.confirm(`Queue a GitHub sync for ${mod.name}?`))
      router.post(
        `/dashboard/admin/mods/${mod.slug}/sync`,
        {},
        { preserveScroll: true },
      );
  };

  return (
    <AdminLayout
      title="Mod operations"
      description="Control publishing, GitHub synchronization, and platform access for every mod."
    >
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary
          label="All mods"
          value={metrics.total}
          icon={Layers3}
          active={filters.status === 'all'}
          onClick={() => navigate('all')}
        />
        <Summary
          label="Active"
          value={metrics.active}
          icon={CheckCircle2}
          tone="green"
          active={filters.status === 'active'}
          onClick={() => navigate('active')}
        />
        <Summary
          label="Suspended"
          value={metrics.suspended}
          icon={PauseCircle}
          tone="red"
          active={filters.status === 'suspended'}
          onClick={() => navigate('suspended')}
        />
        <Summary
          label="GitHub managed"
          value={metrics.github}
          icon={SiGithub}
          active={filters.status === 'github'}
          onClick={() => navigate('github')}
        />
      </section>
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-4">
          <div>
            <h2 className="font-semibold">All platform mods</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {mods.total} records match this view
            </p>
          </div>
          <form onSubmit={search} className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mods or slugs"
              className="h-9 pl-9"
            />
          </form>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b bg-muted/25 text-[11px] tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Mod</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Content</th>
                  <th className="px-4 py-3 font-medium">Integration</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mods.data.map((mod) => (
                  <tr
                    key={mod.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/admin/mods/${mod.slug}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-linear-to-br from-primary/15 to-violet-500/10 font-semibold text-primary">
                          {mod.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium group-hover:text-primary">
                            {mod.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            /{mod.slug} · {String(mod.owner)}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      {mod.is_suspended ? (
                        <Badge
                          variant="destructive"
                          className="gap-1.5 rounded-full"
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1.5 rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active
                        </Badge>
                      )}
                      <p className="mt-1.5 pl-1 text-[11px] text-muted-foreground capitalize">
                        {mod.visibility}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{mod.pages_count} pages</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        {mod.collaborators_count ?? 0} collaborators
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {mod.github_connected ? (
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-foreground/5 p-1.5">
                            <SiGithub className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-medium">
                              GitHub connected
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Manual sync available
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Manual content
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8"
                        >
                          <Link href={`/dashboard/admin/mods/${mod.slug}`}>
                            Manage <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                        {mod.github_connected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => sync(mod)}
                          >
                            <RefreshCw className="size-3.5" />
                            Sync
                          </Button>
                        )}
                        <Button
                          variant={mod.is_suspended ? 'outline' : 'ghost'}
                          size="sm"
                          className={cn(
                            'h-8',
                            !mod.is_suspended &&
                              'text-destructive hover:bg-destructive/10 hover:text-destructive',
                          )}
                          onClick={() => suspend(mod)}
                        >
                          <ShieldBan className="size-3.5" />
                          {mod.is_suspended ? 'Reactivate' : 'Suspend'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mods.data.length === 0 && (
              <div className="p-16 text-center">
                <Layers3 className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 font-medium">No mods found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search or status filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <Pagination
          links={mods.links}
          from={mods.from}
          to={mods.to}
          total={mods.total}
        />
      </Card>
    </AdminLayout>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  tone = 'default',
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'green' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        active && 'border-primary ring-2 ring-primary/10',
      )}
    >
      <div
        className={cn(
          'rounded-lg bg-primary/10 p-2 text-primary',
          tone === 'green' && 'bg-emerald-500/10 text-emerald-600',
          tone === 'red' && 'bg-destructive/10 text-destructive',
        )}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-2xl leading-none font-semibold">
          {value.toLocaleString()}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}
