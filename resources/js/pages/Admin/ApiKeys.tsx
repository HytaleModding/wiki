import { router } from '@inertiajs/react';
import { Ban, KeyRound, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { AdminApiKey, Paginated } from '@/types/admin';

export default function ApiKeys({
  keys,
  filters,
}: {
  keys: Paginated<AdminApiKey>;
  filters: { q: string };
}) {
  const [query, setQuery] = useState(filters.q);
  const search = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      '/dashboard/admin/api-keys',
      { q: query },
      { preserveState: true, replace: true },
    );
  };
  const revoke = (key: AdminApiKey) => {
    if (
      window.confirm(
        `Permanently revoke ${key.name}? Applications using it will immediately lose access.`,
      )
    )
      router.delete(`/dashboard/admin/api-keys/${key.id}`, {
        preserveScroll: true,
      });
  };
  return (
    <AdminLayout
      title="API keys"
      description="Inspect credentials, usage, scopes, and revoke access immediately."
    >
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="border-b p-4">
          <form onSubmit={search} className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search key, owner, or email"
              className="pl-9"
            />
          </form>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Credential</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Scopes</th>
                  <th className="px-4 py-3 font-medium">Usage</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys.data.map((key) => (
                  <tr key={key.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <KeyRound className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {key.prefix}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p>{key.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {key.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {key.scopes.length ? (
                          key.scopes.slice(0, 3).map((scope) => (
                            <Badge
                              key={scope}
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {scope}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No scopes
                          </span>
                        )}
                        {key.scopes.length > 3 && (
                          <Badge variant="secondary">
                            +{key.scopes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p>{key.logs_count.toLocaleString()} requests</p>
                      <p className="text-xs text-muted-foreground">
                        {key.last_used_at
                          ? `Last used ${key.last_used_at}`
                          : 'Never used'}{' '}
                        · {key.rate_limit}/min
                      </p>
                      {key.expired && (
                        <Badge variant="destructive" className="mt-1">
                          Expired
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revoke(key)}
                      >
                        <Ban className="size-3.5" />
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {keys.data.length === 0 && (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No API keys matched your search.
              </div>
            )}
          </div>
        </CardContent>
        <Pagination
          links={keys.links}
          from={keys.from}
          to={keys.to}
          total={keys.total}
        />
      </Card>
    </AdminLayout>
  );
}
