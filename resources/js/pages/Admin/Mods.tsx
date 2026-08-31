import { Link, router } from '@inertiajs/react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import { Ban, Search, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AdminMod, Paginated } from '@/types/admin';

export default function Mods({
  mods,
  filters,
}: {
  mods: Paginated<AdminMod>;
  filters: { q: string; status: string };
}) {
  const [query, setQuery] = useState(filters.q);
  const search = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      '/dashboard/admin/mods',
      { q: query, status: filters.status },
      { preserveState: true, replace: true },
    );
  };
  const filter = (status: string) =>
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
        `/dashboard/admin/mods/${mod.id}/suspension`,
        {},
        { preserveScroll: true },
      );
  };
  const sync = (mod: AdminMod) => {
    if (window.confirm(`Queue a GitHub sync for ${mod.name}?`))
      router.post(
        `/dashboard/admin/mods/${mod.id}/sync`,
        {},
        { preserveScroll: true },
      );
  };

  return (
    <AdminLayout
      title="Mods"
      description="Inspect and operate every mod from the administrative workspace."
    >
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <form onSubmit={search} className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mod name or slug"
              className="pl-9"
            />
          </form>
          <select
            value={filters.status}
            onChange={(event) => filter(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All mods</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="github">GitHub connected</option>
          </select>
        </div>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mods.data.map((mod) => (
              <div
                key={mod.id}
                className="rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/dashboard/admin/mods/${mod.id}`}
                    className="min-w-0"
                  >
                    <h2 className="truncate font-semibold hover:underline">
                      {mod.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{mod.slug} · {String(mod.owner)}
                    </p>
                  </Link>
                  {mod.is_suspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="outline">{mod.visibility}</Badge>
                  )}
                </div>
                <div className="mt-5 flex gap-4 text-xs text-muted-foreground">
                  <span>{mod.pages_count} pages</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {mod.collaborators_count ?? 0}
                  </span>
                  {mod.github_connected && (
                    <span className="flex items-center gap-1">
                      <Github className="size-3" /> GitHub
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'mt-5 grid gap-2',
                    mod.github_connected ? 'grid-cols-3' : 'grid-cols-2',
                  )}
                >
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/admin/mods/${mod.id}`}>Manage</Link>
                  </Button>
                  {mod.github_connected && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sync(mod)}
                    >
                      <Github className="size-3.5" />
                      Sync
                    </Button>
                  )}
                  <Button
                    variant={mod.is_suspended ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => suspend(mod)}
                  >
                    <Ban className="size-3.5" />
                    {mod.is_suspended ? 'Reactivate' : 'Suspend'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {mods.data.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No mods matched your filters.
            </div>
          )}
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
