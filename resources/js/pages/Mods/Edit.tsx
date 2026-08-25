import { Head, useForm } from '@inertiajs/react';
import {
  ExternalLink,
  GitBranch,
  Globe2,
  Palette,
  Settings2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { visibilityOptions } from '@/utils/commonUtils';

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  storage_driver: 'local';
  external_access: boolean;
  github_repository_url?: string | null;
  github_repository_path?: string | null;
  custom_css?: string | null;
  custom_domain?: string | null;
  domain_status?: 'not_configured' | 'pending_dns' | 'provisioning' | 'ready';
}
interface Props {
  mod: Mod;
  githubConnected: boolean;
  customDomainTarget: string;
  section: 'general' | 'domain' | 'github' | 'appearance' | 'danger';
}
interface GitHubRepository {
  id: number;
  full_name: string;
  html_url: string;
  private: boolean;
}

const navigation = [
  {
    id: 'general',
    label: 'General',
    description: 'Identity & access',
    icon: Settings2,
  },
  {
    id: 'domain',
    label: 'Custom domain',
    description: 'DNS & publishing',
    icon: Globe2,
  },
  {
    id: 'github',
    label: 'GitHub sync',
    description: 'Repository source',
    icon: GitBranch,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Custom styling',
    icon: Palette,
  },
  {
    id: 'danger',
    label: 'Danger zone',
    description: 'Delete this wiki',
    icon: Trash2,
  },
] as const;

export default function EditMod({
  mod,
  githubConnected,
  customDomainTarget,
  section,
}: Props) {
  const [iconPreview, setIconPreview] = useState<string | null>(
    mod.icon_url || null,
  );
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const repositoriesRef = useRef<GitHubRepository[]>([]);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(
    null,
  );
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [isSelectingRepository, setIsSelectingRepository] = useState(false);
  const form = useForm({
    name: mod.name,
    description: mod.description || '',
    visibility: mod.visibility,
    storage_driver: mod.storage_driver,
    external_access: mod.external_access || false,
    github_repository_url: mod.github_repository_url || '',
    github_repository_path: mod.github_repository_path || '',
    custom_css: mod.custom_css || '',
    settings_section: section,
    icon: null as File | null,
  });
  const domainForm = useForm({ custom_domain: mod.custom_domain || '' });

  useEffect(() => {
    if (section !== 'github' || !githubConnected) return;
    setIsLoadingRepositories(true);
    fetch(`/dashboard/mods/${mod.slug}/github/repositories`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          repositories?: GitHubRepository[];
          message?: string;
        };
        if (!response.ok)
          throw new globalThis.Error(
            payload.message || 'Unable to load repositories.',
          );
        repositoriesRef.current = payload.repositories || [];
        setRepositories(repositoriesRef.current);
      })
      .catch((error: Error) => setRepositoriesError(error.message))
      .finally(() => setIsLoadingRepositories(false));
  }, [githubConnected, mod.slug, section]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    form.patch(`/dashboard/mods/${mod.slug}`, { forceFormData: true });
  };
  const saveDomain = () =>
    domainForm.patch(`/dashboard/mods/${mod.slug}/domain`);
  const selectRepository = async (id: string) => {
    const repository = repositoriesRef.current.find(
      (item) => item.id === Number(id),
    );
    if (!repository) return;
    setIsSelectingRepository(true);
    setRepositoriesError(null);
    try {
      const response = await fetch(
        `/dashboard/mods/${mod.slug}/github/repository`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
              document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '',
          },
          body: JSON.stringify({
            repository_id: repository.id,
            repository_url: repository.html_url,
          }),
        },
      );
      const payload = (await response.json()) as {
        repository?: GitHubRepository;
        message?: string;
      };
      if (!response.ok || !payload.repository)
        throw new globalThis.Error(
          payload.message || 'Unable to select the repository.',
        );
      form.setData('github_repository_url', payload.repository.html_url);
    } catch (error) {
      setRepositoriesError(
        error instanceof globalThis.Error
          ? error.message
          : 'Unable to select the repository.',
      );
    } finally {
      setIsSelectingRepository(false);
    }
  };
  const disconnectGithub = async () => {
    if (!window.confirm('Disconnect GitHub from this wiki?')) return;
    await fetch(`/dashboard/mods/${mod.slug}/github/connect`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-CSRF-TOKEN':
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
      },
    });
    window.location.reload();
  };
  const deleteMod = async () => {
    if (
      !window.confirm(`Permanently delete ${mod.name} and all of its content?`)
    )
      return;
    await fetch(`/dashboard/mods/${mod.slug}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN':
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
      },
    });
    window.location.href = '/dashboard/mods';
  };
  const status =
    mod.domain_status === 'ready'
      ? ['Live', 'bg-emerald-500']
      : mod.domain_status === 'provisioning'
        ? ['Provisioning HTTPS', 'bg-amber-500']
        : ['Awaiting DNS', 'bg-sky-500'];

  return (
    <AppLayout>
      <Head
        title={`${navigation.find((item) => item.id === section)?.label} · ${mod.name}`}
      />
      <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <a
            href={`/dashboard/mods/${mod.slug}`}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to {mod.name}
          </a>
          <div className="mt-5 flex flex-col gap-3 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Wiki settings</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {mod.name}
              </h1>
              <p className="mt-1 text-muted-foreground">
                A calm home for the details behind your documentation.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={`/mod/${mod.slug}`} target="_blank" rel="noreferrer">
                View live wiki <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[245px_minmax(0,1fr)]">
            <aside>
              <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === section;
                  return (
                    <a
                      key={item.id}
                      href={`/dashboard/mods/${mod.slug}/settings/${item.id}`}
                      className={cn(
                        'group flex min-w-44 items-center gap-3 rounded-xl px-3 py-3 transition',
                        active
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'block text-xs',
                            active
                              ? 'text-background/65'
                              : 'text-muted-foreground',
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </nav>
            </aside>
            <main className="min-w-0">
              <form onSubmit={save}>
                {section === 'general' && (
                  <section className="space-y-6">
                    <PageIntro
                      eyebrow="Workspace"
                      title="General settings"
                      text="Give your wiki a recognizable identity and decide who can access it."
                    />
                    <Card>
                      <CardContent className="space-y-7 p-6 sm:p-8">
                        <Field
                          label="Wiki name"
                          hint="Changing this also updates the wiki's URL slug."
                        >
                          <Input
                            value={form.data.name}
                            onChange={(e) =>
                              form.setData('name', e.target.value)
                            }
                            className="max-w-xl"
                          />
                          {form.errors.name && (
                            <Error>{form.errors.name}</Error>
                          )}
                        </Field>
                        <Field
                          label="Description"
                          hint="A short explanation for people browsing your wiki."
                        >
                          <Textarea
                            value={form.data.description}
                            onChange={(e) =>
                              form.setData('description', e.target.value)
                            }
                            rows={4}
                            className="max-w-xl resize-y"
                          />
                        </Field>
                        <div className="grid gap-6 border-t pt-7 sm:grid-cols-2">
                          <Field
                            label="Visibility"
                            hint="Who can discover and visit this wiki."
                          >
                            <Select
                              value={form.data.visibility}
                              onValueChange={(
                                value: 'public' | 'private' | 'unlisted',
                              ) => form.setData('visibility', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {visibilityOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label} — {option.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field
                            label="Wiki icon"
                            hint="PNG, JPG, GIF, or WebP, up to 2 MB."
                          >
                            <div className="flex items-center gap-4">
                              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
                                <Upload className="h-4 w-4" /> Choose image
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      form.setData('icon', file);
                                      setIconPreview(URL.createObjectURL(file));
                                    }
                                  }}
                                />
                              </label>
                              {iconPreview && (
                                <img
                                  src={iconPreview}
                                  alt="Wiki icon preview"
                                  className="h-11 w-11 rounded-lg border object-cover"
                                />
                              )}
                            </div>
                          </Field>
                        </div>
                        <div className="flex items-center justify-between gap-6 rounded-xl bg-muted/50 p-4">
                          <div>
                            <Label htmlFor="external_access">
                              External API access
                            </Label>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Let approved external applications access this
                              wiki.
                            </p>
                          </div>
                          <Switch
                            id="external_access"
                            checked={form.data.external_access}
                            onCheckedChange={(checked) =>
                              form.setData('external_access', checked)
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <SaveBar processing={form.processing} />
                  </section>
                )}
                {section === 'github' && (
                  <section className="space-y-6">
                    <PageIntro
                      eyebrow="Source control"
                      title="GitHub sync"
                      text="Keep your documentation in GitHub and publish changes from a single source."
                    />
                    <Card>
                      <CardContent className="space-y-7 p-6 sm:p-8">
                        <Field
                          label="GitHub connection"
                          hint={
                            githubConnected
                              ? 'Choose a repository your connected GitHub App can access.'
                              : 'Connect GitHub to select a repository.'
                          }
                        >
                          {!githubConnected ? (
                            <Button asChild>
                              <a
                                href={`/dashboard/mods/${mod.slug}/github/connect`}
                              >
                                Connect GitHub
                              </a>
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Select
                                value={
                                  repositories
                                    .find(
                                      (item) =>
                                        item.html_url ===
                                        form.data.github_repository_url,
                                    )
                                    ?.id.toString() || ''
                                }
                                onValueChange={selectRepository}
                                disabled={
                                  isLoadingRepositories || isSelectingRepository
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      isLoadingRepositories
                                        ? 'Loading repositories…'
                                        : 'Select a repository'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {repositories.map((repo) => (
                                    <SelectItem
                                      key={repo.id}
                                      value={repo.id.toString()}
                                    >
                                      {repo.full_name}
                                      {repo.private ? ' · private' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button asChild type="button" variant="outline">
                                  <a
                                    href={`/dashboard/mods/${mod.slug}/github/connect`}
                                  >
                                    Reconnect
                                  </a>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={disconnectGithub}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            </div>
                          )}
                          {repositoriesError && (
                            <Error>{repositoriesError}</Error>
                          )}
                        </Field>
                        <Field
                          label="Repository path"
                          hint="Optional. Use a subfolder such as docs/guides, or leave empty for the root."
                        >
                          <Input
                            value={form.data.github_repository_path}
                            onChange={(e) =>
                              form.setData(
                                'github_repository_path',
                                e.target.value,
                              )
                            }
                            placeholder="docs"
                          />
                          {form.errors.github_repository_path && (
                            <Error>{form.errors.github_repository_path}</Error>
                          )}
                        </Field>
                      </CardContent>
                    </Card>
                    <SaveBar processing={form.processing} />
                  </section>
                )}
                {section === 'appearance' && (
                  <section className="space-y-6">
                    <PageIntro
                      eyebrow="Look & feel"
                      title="Appearance"
                      text="Add the finishing touches to every public page in your wiki."
                    />
                    <Card>
                      <CardContent className="space-y-6 p-6 sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-violet-500/10 p-5">
                          <div>
                            <h3 className="font-medium">
                              Need a larger canvas?
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Use the dedicated CSS editor with a live preview.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              form.patch(`/dashboard/mods/${mod.slug}`, {
                                forceFormData: true,
                                onSuccess: () =>
                                  (window.location.href = `/dashboard/mods/${mod.slug}/css-editor`),
                              })
                            }
                          >
                            Open CSS editor
                          </Button>
                        </div>
                        <Field
                          label="Custom CSS"
                          hint="Applied to all public-facing pages of this wiki."
                        >
                          <Textarea
                            value={form.data.custom_css}
                            onChange={(e) =>
                              form.setData('custom_css', e.target.value)
                            }
                            rows={18}
                            spellCheck={false}
                            className="resize-y bg-zinc-950 font-mono text-sm text-zinc-100"
                            placeholder={
                              '/* Make it yours */\n\n.prose h1 {\n  color: #7c3aed;\n}'
                            }
                          />
                          {form.errors.custom_css && (
                            <Error>{form.errors.custom_css}</Error>
                          )}
                        </Field>
                      </CardContent>
                    </Card>
                    <SaveBar processing={form.processing} />
                  </section>
                )}
              </form>
              {section === 'domain' && (
                <section className="space-y-6">
                  <PageIntro
                    eyebrow="Publishing"
                    title="Custom domain"
                    text="Point a domain you own at this wiki. This page has its own URL, so refreshing always keeps you here."
                  />
                  <Card>
                    <CardContent className="space-y-7 p-6 sm:p-8">
                      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
                        <span
                          className={cn('h-2.5 w-2.5 rounded-full', status[1])}
                        />
                        <div>
                          <p className="text-sm font-medium">{status[0]}</p>
                          <p className="text-xs text-muted-foreground">
                            {mod.custom_domain || 'No domain configured yet'}
                          </p>
                        </div>
                      </div>
                      <Field
                        label="Domain"
                        hint="Use a subdomain such as docs.example.com."
                      >
                        <Input
                          value={domainForm.data.custom_domain}
                          onChange={(e) =>
                            domainForm.setData(
                              'custom_domain',
                              e.target.value.toLowerCase(),
                            )
                          }
                          placeholder="docs.example.com"
                        />
                        {domainForm.errors.custom_domain && (
                          <Error>{domainForm.errors.custom_domain}</Error>
                        )}
                      </Field>
                      <div className="rounded-xl bg-sky-500/10 p-5">
                        <h3 className="font-medium">Set up your DNS</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Create a CNAME record for your domain that points to{' '}
                          <code className="rounded bg-background px-1.5 py-0.5 text-foreground">
                            {customDomainTarget}
                          </code>
                          . We automatically check the record every five minutes
                          and issue HTTPS when it is ready.
                        </p>
                      </div>
                      <Button
                        onClick={saveDomain}
                        disabled={domainForm.processing}
                      >
                        {domainForm.processing
                          ? 'Saving domain…'
                          : 'Save domain'}
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )}
              {section === 'danger' && (
                <section className="space-y-6">
                  <PageIntro
                    eyebrow="Irreversible"
                    title="Danger zone"
                    text="Deleting a wiki permanently removes its pages, files, and collaborator access."
                  />
                  <Card className="border-destructive/50">
                    <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                      <div>
                        <h3 className="font-medium text-destructive">
                          Delete this wiki
                        </h3>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                          This cannot be undone. Export anything you need before
                          deleting {mod.name}.
                        </p>
                      </div>
                      <Button variant="destructive" onClick={deleteMod}>
                        Delete permanently
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{text}</p>
    </div>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}
function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>;
}
const Error = FormError;
function SaveBar({ processing }: { processing: boolean }) {
  return (
    <div className="flex justify-end border-t pt-5">
      <Button type="submit" disabled={processing}>
        {processing ? 'Saving changes…' : 'Save changes'}
      </Button>
    </div>
  );
}
