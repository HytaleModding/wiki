import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link, router } from '@inertiajs/react';
import {
  ArrowLeft,
  Ban,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AdminMod, AuditItem } from '@/types/admin';

type ModDetail = AdminMod & {
  description: string | null;
  github_repository_url: string | null;
  github_repository_path: string | null;
  published_pages_count: number;
  owner: { name: string; username: string; email: string };
  collaborators: { id: number; name: string; username: string; role: string }[];
};
type RecentPage = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  source_type: string | null;
  updated_by: string;
  updated_at: string;
};
type RecentView = {
  id: number;
  page: string;
  viewer: string;
  viewed_at: string;
};

export default function ModShow({
  mod,
  recentPages,
  recentViews,
  audit,
  viewsCount,
}: {
  mod: ModDetail;
  recentPages: RecentPage[];
  recentViews: RecentView[];
  audit: AuditItem[];
  viewsCount: number;
}) {
  const [tab, setTab] = useState<'pages' | 'views' | 'audit'>('pages');
  const suspend = () => {
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
  const sync = () => {
    if (window.confirm(`Queue a GitHub sync for ${mod.name}?`))
      router.post(
        `/dashboard/admin/mods/${mod.slug}/sync`,
        {},
        { preserveScroll: true },
      );
  };
  const lastSync = audit.find(
    (item) =>
      item.action === 'mod.github_sync_completed' ||
      item.action === 'mod.github_sync_failed',
  );

  return (
    <AdminLayout
      title={mod.name}
      description={`Platform record · /${mod.slug}`}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin/mods">
            <ArrowLeft className="size-4" />
            Back to mods
          </Link>
        </Button>
      }
    >
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-r from-primary/10 via-violet-500/5 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-background text-xl font-semibold text-primary shadow-sm">
              {mod.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{mod.name}</h2>
                {mod.is_suspended ? (
                  <Badge variant="destructive" className="rounded-full">
                    Suspended
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">
                  {mod.visibility}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {mod.description ||
                  'No description has been provided for this mod.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span>
                  Owner{' '}
                  <strong className="font-medium text-foreground">
                    {mod.owner.name}
                  </strong>
                </span>
                <span>
                  Updated{' '}
                  <strong className="font-medium text-foreground">
                    {mod.updated_at}
                  </strong>
                </span>
                {mod.github_connected && (
                  <span className="flex items-center gap-1.5">
                    <SiGithub className="size-3.5" />
                    <strong className="font-medium text-foreground">
                      GitHub managed
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {mod.github_connected && (
              <Button variant="outline" onClick={sync}>
                <RefreshCw className="size-4" />
                Run sync
              </Button>
            )}
            <Button
              variant={mod.is_suspended ? 'outline' : 'destructive'}
              onClick={suspend}
            >
              <Ban className="size-4" />
              {mod.is_suspended ? 'Reactivate mod' : 'Suspend mod'}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total pages"
          value={mod.pages_count}
          note={`${mod.published_pages_count} published`}
          icon={BookOpen}
        />
        <Stat
          label="All-time views"
          value={viewsCount}
          note="Recorded page views"
          icon={Eye}
        />
        <Stat
          label="Collaborators"
          value={mod.collaborators_count ?? 0}
          note="Plus the owner"
          icon={Users}
        />
        <Stat
          label="GitHub sync"
          value={mod.github_connected ? 'Connected' : 'Not connected'}
          note={lastSync ? lastSync.created_at : 'No sync recorded'}
          icon={mod.github_connected ? CheckCircle2 : Clock3}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <div className="flex items-center justify-between border-b px-5">
            <div className="flex">
              {(['pages', 'views', 'audit'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={cn(
                    'border-b-2 px-4 py-4 text-sm font-medium capitalize transition-colors',
                    tab === item
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Latest activity
            </span>
          </div>
          <CardContent className="p-0">
            {tab === 'pages' && (
              <ActivityRows
                rows={recentPages.map((page) => ({
                  title: page.title,
                  detail: `${page.updated_by} · ${page.source_type || 'manual'} · ${page.published ? 'Published' : 'Draft'}`,
                  time: page.updated_at,
                  tone: page.published ? 'success' : 'neutral',
                }))}
                empty="No page changes yet."
              />
            )}
            {tab === 'views' && (
              <ActivityRows
                rows={recentViews.map((view) => ({
                  title: view.page,
                  detail: view.viewer,
                  time: view.viewed_at,
                  tone: 'neutral',
                }))}
                empty="No page views yet."
              />
            )}
            {tab === 'audit' && (
              <ActivityRows
                rows={audit.map((item) => ({
                  title: item.description,
                  detail: `${item.actor} · ${item.action}`,
                  time: item.created_at,
                  tone: item.action.endsWith('failed') ? 'danger' : 'neutral',
                }))}
                empty="No admin actions for this mod yet."
              />
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Ownership & configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Info
                label="Owner"
                value={`${mod.owner.name} (@${mod.owner.username})`}
              />
              <Info label="Email" value={mod.owner.email} />
              <Info label="Slug" value={mod.slug} mono />
              {mod.github_repository_url && (
                <>
                  <Info
                    label="Repository"
                    value={mod.github_repository_url}
                    mono
                  />
                  <Info
                    label="Documentation path"
                    value={mod.github_repository_path || '/'}
                    mono
                  />
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Team access</CardTitle>
              <Badge variant="secondary">{mod.collaborators.length}</Badge>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {mod.collaborators.length ? (
                mod.collaborators.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  No collaborators have access.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-sm break-all', mono && 'font-mono text-xs')}>
        {value}
      </p>
    </div>
  );
}
function ActivityRows({
  rows,
  empty,
}: {
  rows: { title: string; detail: string; time: string; tone: string }[];
  empty: string;
}) {
  return rows.length ? (
    <div className="divide-y">
      {rows.map((row, index) => (
        <div
          key={`${row.title}-${index}`}
          className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/20"
        >
          <span
            className={cn(
              'mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40',
              row.tone === 'success' && 'bg-emerald-500',
              row.tone === 'danger' && 'bg-destructive',
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{row.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {row.detail}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {row.time}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="p-16 text-center text-sm text-muted-foreground">
      {empty}
    </div>
  );
}
