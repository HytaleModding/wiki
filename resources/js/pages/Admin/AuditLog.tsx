import { router } from '@inertiajs/react';
import { Activity } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AuditItem, Paginated } from '@/types/admin';

export default function AuditLog({
  logs,
  filters,
}: {
  logs: Paginated<AuditItem>;
  filters: { action: string };
}) {
  return (
    <AdminLayout
      title="Audit log"
      description="A persistent record of platform administration and background sync results."
    >
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex justify-end border-b p-4">
          <select
            value={filters.action}
            onChange={(event) =>
              router.get(
                '/dashboard/admin/audit-log',
                { action: event.target.value },
                { preserveState: true, replace: true },
              )
            }
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All actions</option>
            <option value="user.suspended">User suspended</option>
            <option value="user.reactivated">User reactivated</option>
            <option value="user.admin_granted">Admin granted</option>
            <option value="user.admin_revoked">Admin revoked</option>
            <option value="mod.suspended">Mod suspended</option>
            <option value="mod.reactivated">Mod reactivated</option>
            <option value="mod.github_sync_queued">Sync queued</option>
            <option value="mod.github_sync_completed">Sync completed</option>
            <option value="mod.github_sync_failed">Sync failed</option>
            <option value="api_key.revoked">API key revoked</option>
            <option value="api_key.created">API key created</option>
            <option value="api_key.updated">API key updated</option>
            <option value="api_key.rotated">API key rotated</option>
          </select>
        </div>
        <CardContent className="p-0">
          <div className="divide-y">
            {logs.data.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 px-5 py-4 sm:px-6"
              >
                <div className="mt-0.5 rounded-lg bg-muted p-2">
                  <Activity className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.description}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.action}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actor} · {item.subject_type} #{item.subject_id} ·{' '}
                    {item.created_at}
                  </p>
                  {item.metadata && (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted/50 p-2 text-[11px]">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
            {logs.data.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No audit entries matched this filter.
              </div>
            )}
          </div>
        </CardContent>
        <Pagination
          links={logs.links}
          from={logs.from}
          to={logs.to}
          total={logs.total}
        />
      </Card>
    </AdminLayout>
  );
}
