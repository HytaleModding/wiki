import { router, usePage } from '@inertiajs/react';
import { Ban, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { SharedData } from '@/types';
import type { AdminUser, Paginated } from '@/types/admin';

export default function Users({
  users,
  filters,
}: {
  users: Paginated<AdminUser>;
  filters: { q: string; status: string };
}) {
  const currentUser = usePage<SharedData>().props.auth.user;
  const [query, setQuery] = useState(filters.q);
  const search = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      '/dashboard/admin/users',
      { q: query, status: filters.status },
      { preserveState: true, replace: true },
    );
  };
  const filter = (status: string) =>
    router.get(
      '/dashboard/admin/users',
      { q: query, status },
      { preserveState: true, replace: true },
    );
  const suspend = (user: AdminUser) => {
    if (
      window.confirm(
        `${user.is_suspended ? 'Reactivate' : 'Suspend'} ${user.name}?`,
      )
    )
      router.patch(
        `/dashboard/admin/users/${user.id}/suspension`,
        {},
        { preserveScroll: true },
      );
  };
  const toggleAdmin = (user: AdminUser) => {
    if (
      window.confirm(
        `${user.is_admin ? 'Remove platform admin access from' : 'Grant platform admin access to'} ${user.name}?`,
      )
    )
      router.patch(
        `/dashboard/admin/users/${user.id}/admin`,
        {},
        { preserveScroll: true },
      );
  };

  return (
    <AdminLayout
      title="Users"
      description="Search every account and control platform access."
    >
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <form onSubmit={search} className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, username, or email"
              className="pl-9"
            />
          </form>
          <select
            value={filters.status}
            onChange={(event) => filter(event.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="admins">Platform admins</option>
          </select>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Resources</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.data.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt=""
                          className="size-9 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email} · @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        {user.is_admin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                        {user.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {user.owned_mods_count} mods · {user.api_keys_count} keys
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={user.id === currentUser.id}
                          onClick={() => toggleAdmin(user)}
                        >
                          {user.is_admin ? (
                            <ShieldOff className="size-3.5" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                          {user.is_admin ? 'Remove admin' : 'Make admin'}
                        </Button>
                        <Button
                          variant={
                            user.is_suspended ? 'outline' : 'destructive'
                          }
                          size="sm"
                          disabled={user.id === currentUser.id}
                          onClick={() => suspend(user)}
                        >
                          <Ban className="size-3.5" />
                          {user.is_suspended ? 'Reactivate' : 'Suspend'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.data.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No users matched your filters.
              </div>
            )}
          </div>
        </CardContent>
        <Pagination
          links={users.links}
          from={users.from}
          to={users.to}
          total={users.total}
        />
      </Card>
    </AdminLayout>
  );
}
