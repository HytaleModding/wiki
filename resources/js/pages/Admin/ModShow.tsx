import { Link, router } from '@inertiajs/react';
import {
  ArrowLeft,
  Ban,
  BookOpen,
  Eye,
  RefreshCw,
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
        `/dashboard/admin/mods/${mod.id}/suspension`,
        {},
        { preserveScroll: true },
      );
  };
  const sync = () => {
    if (window.confirm(`Queue a GitHub sync for ${mod.name}?`))
      router.post(
        `/dashboard/admin/mods/${mod.id}/sync`,
        {},
        { preserveScroll: true },
      );
  };

  return (
    <AdminLayout
      title={mod.name}
      description="Administrative mod record, operations, and activity."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/mods">
              <ArrowLeft className="size-4" />
              All mods
            </Link>
          </Button>
          {mod.github_connected && (
            <Button variant="outline" onClick={sync}>
              <RefreshCw className="size-4" />
              Run GitHub sync
            </Button>
          )}
          <Button
            variant={mod.is_suspended ? 'outline' : 'destructive'}
            onClick={suspend}
          >
            <Ban className="size-4" />
            {mod.is_suspended ? 'Reactivate' : 'Suspend'}
          </Button>
        </div>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Pages" value={mod.pages_count} icon={BookOpen} />
        <Stat
          label="Published"
          value={mod.published_pages_count}
          icon={BookOpen}
        />
        <Stat label="Views" value={viewsCount} icon={Eye} />
        <Stat
          label="Collaborators"
          value={mod.collaborators_count ?? 0}
          icon={Users}
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Mod details</CardTitle>
                {mod.is_suspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="outline">{mod.visibility}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Info
                label="Owner"
                value={`${mod.owner.name} (@${mod.owner.username})`}
              />
              <Info label="Owner email" value={mod.owner.email} />
              <Info label="Slug" value={mod.slug} mono />
              <Info label="Last updated" value={mod.updated_at} />
              {mod.github_repository_url && (
                <>
                  <Info
                    label="GitHub repository"
                    value={mod.github_repository_url}
                    mono
                  />
                  <Info
                    label="Repository path"
                    value={mod.github_repository_path || '/'}
                    mono
                  />
                </>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <p className="mt-1">
                  {mod.description || 'No description provided.'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Collaborators</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {mod.collaborators.length ? (
                mod.collaborators.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  No collaborators.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <div className="flex border-b px-4 pt-2">
            {(['pages', 'views', 'audit'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={cn(
                  'border-b-2 px-4 py-3 text-sm font-medium capitalize',
                  tab === item
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <CardContent className="p-0">
            {tab === 'pages' && (
              <ActivityRows
                rows={recentPages.map((page) => ({
                  title: page.title,
                  detail: `${page.updated_by} · ${page.source_type || 'manual'} · ${page.published ? 'published' : 'draft'}`,
                  time: page.updated_at,
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
                }))}
                empty="No page views yet."
              />
            )}
            {tab === 'audit' && (
              <ActivityRows
                rows={audit.map((item) => ({
                  title: item.description,
                  detail: item.actor,
                  time: item.created_at,
                }))}
                empty="No admin actions for this mod yet."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </AdminLayout>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">
            {value.toLocaleString()}
          </p>
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 break-all', mono && 'font-mono text-xs')}>
        {value}
      </p>
    </div>
  );
}
function ActivityRows({
  rows,
  empty,
}: {
  rows: { title: string; detail: string; time: string }[];
  empty: string;
}) {
  return rows.length ? (
    <div className="divide-y">
      {rows.map((row, index) => (
        <div
          key={`${row.title}-${index}`}
          className="flex items-start justify-between gap-4 px-6 py-4"
        >
          <div>
            <p className="text-sm font-medium">{row.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {row.time}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="p-12 text-center text-sm text-muted-foreground">
      {empty}
    </div>
  );
}
