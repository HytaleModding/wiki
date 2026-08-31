import { router, useForm } from '@inertiajs/react';
import {
  Ban,
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/admin-layout';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminApiKey, Paginated } from '@/types/admin';

type UserOption = { id: number; name: string; email: string };
type NewKey = { name: string; key: string; rotated: boolean } | null;

export default function ApiKeys({
  keys,
  filters,
  users,
  availableScopes,
  newKey,
}: {
  keys: Paginated<AdminApiKey>;
  filters: { q: string };
  users: UserOption[];
  availableScopes: string[];
  newKey: NewKey;
}) {
  const [query, setQuery] = useState(filters.q);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminApiKey | null>(null);
  const [secretOpen, setSecretOpen] = useState(Boolean(newKey));
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (newKey) setSecretOpen(true);
  }, [newKey]);

  const createForm = useForm({
    user_id: '',
    name: '',
    scopes: ['read:mods', 'read:mods:*'],
    rate_limit: 60,
    expires_at: '',
  });
  const editForm = useForm({
    name: '',
    scopes: [] as string[],
    rate_limit: 60,
    expires_at: '',
  });
  const search = (event: FormEvent) => {
    event.preventDefault();
    router.get(
      '/dashboard/admin/api-keys',
      { q: query },
      { preserveState: true, replace: true },
    );
  };
  const openEdit = (key: AdminApiKey) => {
    setEditing(key);
    editForm.setData({
      name: key.name,
      scopes: key.scopes,
      rate_limit: key.rate_limit,
      expires_at: key.expires_at?.slice(0, 10) ?? '',
    });
    editForm.clearErrors();
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
  const rotate = (key: AdminApiKey) => {
    if (
      window.confirm(
        `Rotate ${key.name}? The current secret will stop working immediately.`,
      )
    )
      router.post(
        `/dashboard/admin/api-keys/${key.id}/rotate`,
        {},
        { preserveScroll: true },
      );
  };
  const copySecret = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <AdminLayout
      title="API credentials"
      description="Create and control scoped credentials, limits, expiry, and access."
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create API key
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat
        label="Issued credentials"
          value={keys.total}
          icon={KeyRound}
        />
        <MiniStat
        label="Requests on this page"
          value={keys.data.reduce((sum, key) => sum + key.logs_count, 0)}
          icon={RefreshCw}
        />
        <MiniStat
          label="Expired on this page"
          value={keys.data.filter((key) => key.expired).length}
          icon={ShieldCheck}
        />
      </section>
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Issued keys</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Secrets are only displayed when created or rotated.
            </p>
          </div>
          <form onSubmit={search} className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search key or owner"
              className="h-9 pl-9"
            />
          </form>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b bg-muted/25 text-[11px] tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">Credential</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Access policy</th>
                  <th className="px-4 py-3 font-medium">Traffic</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {keys.data.map((key) => (
                  <tr key={key.id} className="group hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                          <KeyRound className="size-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{key.name}</p>
                            {key.expired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {key.prefix}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{key.user.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {key.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {key.scopes.slice(0, 3).map((scope) => (
                          <Badge
                            key={scope}
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {scope === '*' ? 'Full access' : scope}
                          </Badge>
                        ))}
                        {key.scopes.length > 3 && (
                          <Badge variant="secondary">
                            +{key.scopes.length - 3}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {key.rate_limit.toLocaleString()} requests/minute
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {key.logs_count.toLocaleString()} requests
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {key.last_used_at
                          ? `Used ${key.last_used_at}`
                          : 'Never used'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => openEdit(key)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => rotate(key)}
                        >
                          <RefreshCw className="size-3.5" />
                          Rotate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => revoke(key)}
                        >
                          <Ban className="size-3.5" />
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {keys.data.length === 0 && (
              <div className="p-16 text-center">
                <KeyRound className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 font-medium">No API keys found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a credential or change your search.
                </p>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Issue a new scoped credential for a platform user.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createForm.post('/dashboard/admin/api-keys', {
                preserveScroll: true,
                onSuccess: () => {
                  setCreateOpen(false);
                  createForm.reset();
                },
              });
            }}
            className="space-y-5"
          >
            <Field label="Owner" error={createForm.errors.user_id}>
              <select
                value={createForm.data.user_id}
                onChange={(event) =>
                  createForm.setData('user_id', event.target.value)
                }
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Key name" error={createForm.errors.name}>
              <Input
                value={createForm.data.name}
                onChange={(event) =>
                  createForm.setData('name', event.target.value)
                }
                placeholder="Production integration"
              />
            </Field>
            <ScopeEditor
              scopes={createForm.data.scopes}
              available={availableScopes}
              onChange={(scopes) => createForm.setData('scopes', scopes)}
              error={createForm.errors.scopes}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Requests per minute"
                error={createForm.errors.rate_limit}
              >
                <Input
                  type="number"
                  min={1}
                  max={100000}
                  value={createForm.data.rate_limit}
                  onChange={(event) =>
                    createForm.setData('rate_limit', Number(event.target.value))
                  }
                />
              </Field>
              <Field
                label="Expires on"
                hint="Optional"
                error={createForm.errors.expires_at}
              >
                <Input
                  type="date"
                  value={createForm.data.expires_at}
                  onChange={(event) =>
                    createForm.setData('expires_at', event.target.value)
                  }
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createForm.processing ||
                  !createForm.data.user_id ||
                  !createForm.data.scopes.length
                }
              >
                {createForm.processing ? 'Creating…' : 'Create key'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              Changes apply immediately without changing the current secret.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                editForm.patch(`/dashboard/admin/api-keys/${editing.id}`, {
                  preserveScroll: true,
                  onSuccess: () => setEditing(null),
                });
              }}
              className="space-y-5"
            >
              <Field label="Key name" error={editForm.errors.name}>
                <Input
                  value={editForm.data.name}
                  onChange={(event) =>
                    editForm.setData('name', event.target.value)
                  }
                />
              </Field>
              <ScopeEditor
                scopes={editForm.data.scopes}
                available={availableScopes}
                onChange={(scopes) => editForm.setData('scopes', scopes)}
                error={editForm.errors.scopes}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Requests per minute"
                  error={editForm.errors.rate_limit}
                >
                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    value={editForm.data.rate_limit}
                    onChange={(event) =>
                      editForm.setData('rate_limit', Number(event.target.value))
                    }
                  />
                </Field>
                <Field
                  label="Expires on"
                  hint="Optional"
                  error={editForm.errors.expires_at}
                >
                  <Input
                    type="date"
                    value={editForm.data.expires_at}
                    onChange={(event) =>
                      editForm.setData('expires_at', event.target.value)
                    }
                  />
                </Field>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.processing || !editForm.data.scopes.length}
                >
                  {editForm.processing ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={secretOpen && Boolean(newKey)} onOpenChange={setSecretOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Check className="size-5" />
            </div>
            <DialogTitle>
              {newKey?.rotated ? 'API key rotated' : 'API key created'}
            </DialogTitle>
            <DialogDescription>
              Copy this secret now. For security, it will not be displayed
              again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {newKey?.name}
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 rounded-lg bg-background p-3 text-xs break-all">
                {newKey?.key}
              </code>
              <Button type="button" size="icon" onClick={copySecret}>
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretOpen(false)}>
              I have saved the key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function ScopeEditor({
  scopes,
  available,
  onChange,
  error,
}: {
  scopes: string[];
  available: string[];
  onChange: (scopes: string[]) => void;
  error?: string;
}) {
  const [custom, setCustom] = useState('');
  const toggle = (scope: string) => {
    if (scope === '*') return onChange(scopes.includes('*') ? [] : ['*']);
    const withoutFull = scopes.filter((item) => item !== '*');
    onChange(
      withoutFull.includes(scope)
        ? withoutFull.filter((item) => item !== scope)
        : [...withoutFull, scope],
    );
  };
  const addCustom = () => {
    const value = custom.trim();
    if (!value || scopes.includes(value)) return;
    onChange([...scopes.filter((item) => item !== '*'), value]);
    setCustom('');
  };
  return (
    <Field label="Scopes" hint="At least one required" error={error}>
      <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
        {available.map((scope) => (
          <label
            key={scope}
            className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-xs hover:bg-muted"
          >
            <Checkbox
              checked={scopes.includes(scope)}
              onCheckedChange={() => toggle(scope)}
            />
            <span className="font-mono">
              {scope === '*' ? 'Full access (*)' : scope}
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Custom scope, e.g. read:analytics"
        />
        <Button type="button" variant="outline" onClick={addCustom}>
          Add
        </Button>
      </div>
      {scopes.filter((scope) => !available.includes(scope)).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {scopes
            .filter((scope) => !available.includes(scope))
            .map((scope) => (
              <Badge
                key={scope}
                variant="secondary"
                className="gap-1 font-mono"
              >
                <span>{scope}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(scopes.filter((item) => item !== scope))
                  }
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}
    </Field>
  );
}
