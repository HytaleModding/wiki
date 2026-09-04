import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ExternalLink, Globe2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  storage_driver: 'local' | 's3';
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
  },
  {
    id: 'domain',
    label: 'Custom domain',
  },
  {
    id: 'github',
    label: 'GitHub sync',
  },
  {
    id: 'appearance',
    label: 'Appearance',
  },
  {
    id: 'danger',
    label: 'Danger zone',
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
  const iconObjectUrlRef = useRef<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (iconObjectUrlRef.current) {
        URL.revokeObjectURL(iconObjectUrlRef.current);
      }
    };
  }, []);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    form.transform((data) => ({ ...data, _method: 'patch' }));
    form.post(`/dashboard/mods/${mod.slug}`, { forceFormData: true });
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
  const disconnectRepository = async () => {
    if (!window.confirm('Disconnect this GitHub repository from the wiki?'))
      return;
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
      ? ['Live', true]
      : mod.domain_status === 'provisioning'
        ? ['Provisioning HTTPS', false]
        : ['Awaiting DNS', false];

  return (
    <AppLayout editorial>
      <Head
        title={`${navigation.find((item) => item.id === section)?.label} · ${mod.name}`}
      />
      <div className="py-4 sm:py-8">
        <header className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={`/dashboard/mods/${mod.slug}`}
                aria-label={`Back to ${mod.name}`}
                className="flex size-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </Link>
              {iconPreview ? (
                <img
                  src={iconPreview}
                  alt=""
                  className="size-10 shrink-0 rounded-xl border object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold uppercase">
                  {mod.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Wiki settings</p>
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                  {mod.name}
                </h1>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-fit shrink-0"
            >
              <a href={`/mod/${mod.slug}`} target="_blank" rel="noreferrer">
                View <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>

          <div className="mt-6 -mb-px overflow-x-auto">
            <nav
              aria-label="Wiki settings"
              className="flex min-w-max gap-7"
              role="tablist"
            >
              {navigation.map((item) => {
                const active = item.id === section;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/mods/${mod.slug}/settings/${item.id}`}
                    aria-current={active ? 'page' : undefined}
                    aria-selected={active}
                    role="tab"
                    className={cn(
                      'border-b-2 border-transparent py-4 text-sm font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'border-foreground text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mt-10 max-w-5xl min-w-0">
          <form onSubmit={save}>
            {section === 'general' && (
              <section className="grid gap-7 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
                <PageIntro
                  title="General settings"
                  text="Give your wiki a recognizable identity and decide who can access it."
                />
                <SettingsPanel>
                  <SettingRow
                    label="Wiki name"
                    id="name"
                    hint="Changing this also updates the wiki's URL slug."
                  >
                    <Input
                      id="name"
                      name="name"
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                    />
                    {form.errors.name && <Error>{form.errors.name}</Error>}
                  </SettingRow>
                  <SettingRow
                    label="Description"
                    id="description"
                    hint="A short explanation for people browsing your wiki."
                  >
                    <Textarea
                      id="description"
                      name="description"
                      value={form.data.description}
                      onChange={(e) =>
                        form.setData('description', e.target.value)
                      }
                      rows={4}
                      className="resize-y"
                    />
                  </SettingRow>
                  <SettingRow
                    label="Visibility"
                    id="visibility"
                    hint="Who can discover and visit this wiki."
                  >
                    <Select
                      name="visibility"
                      value={form.data.visibility}
                      onValueChange={(
                        value: 'public' | 'private' | 'unlisted',
                      ) => form.setData('visibility', value)}
                    >
                      <SelectTrigger
                        id="visibility"
                        aria-invalid={Boolean(form.errors.visibility)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} — {option.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.errors.visibility && (
                      <Error>{form.errors.visibility}</Error>
                    )}
                  </SettingRow>
                  <SettingRow
                    label="Wiki icon"
                    id="icon"
                    hint="PNG, JPG, GIF, or WebP, up to 2 MB."
                  >
                    <div className="flex items-center gap-3">
                      {iconPreview ? (
                        <img
                          src={iconPreview}
                          alt="Wiki icon preview"
                          className="size-11 rounded-xl border object-cover"
                        />
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-xl border font-semibold uppercase">
                          {mod.name.charAt(0)}
                        </div>
                      )}
                      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                        <Upload className="h-4 w-4" /> Choose image
                        <input
                          id="icon"
                          name="icon"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (iconObjectUrlRef.current) {
                                URL.revokeObjectURL(iconObjectUrlRef.current);
                              }
                              const previewUrl = URL.createObjectURL(file);
                              iconObjectUrlRef.current = previewUrl;
                              form.setData('icon', file);
                              setIconPreview(previewUrl);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {form.errors.icon && <Error>{form.errors.icon}</Error>}
                  </SettingRow>
                  <SettingRow
                    label="External API access"
                    id="external_access"
                    hint="Let approved external applications access this wiki."
                  >
                    <div className="flex min-h-9 items-center">
                      <Switch
                        id="external_access"
                        checked={form.data.external_access}
                        onCheckedChange={(checked) =>
                          form.setData('external_access', checked)
                        }
                      />
                    </div>
                  </SettingRow>
                  <SaveBar processing={form.processing} />
                </SettingsPanel>
              </section>
            )}
            {section === 'github' && (
              <section className="grid gap-7 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
                <PageIntro
                  title="GitHub sync"
                  text="Keep your documentation in GitHub and publish changes from a single source."
                />
                <SettingsPanel>
                  <SettingRow
                    label="GitHub connection"
                    hint={
                      githubConnected
                        ? 'Choose a repository your connected GitHub App can access.'
                        : 'Connect GitHub to select a repository.'
                    }
                  >
                    {!githubConnected ? (
                      <Button asChild>
                        <a href={`/dashboard/mods/${mod.slug}/github/connect`}>
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
                            onClick={disconnectRepository}
                          >
                            Disconnect repository
                          </Button>
                        </div>
                      </div>
                    )}
                    {repositoriesError && <Error>{repositoriesError}</Error>}
                  </SettingRow>
                  <SettingRow
                    label="Repository path"
                    id="repository_path"
                    hint="Optional. Use a subfolder such as docs/guides, or leave empty for the root."
                  >
                    <Input
                      id="repository_path"
                      value={form.data.github_repository_path}
                      onChange={(e) =>
                        form.setData('github_repository_path', e.target.value)
                      }
                      placeholder="docs"
                    />
                    {form.errors.github_repository_path && (
                      <Error>{form.errors.github_repository_path}</Error>
                    )}
                  </SettingRow>
                  <SaveBar processing={form.processing} />
                </SettingsPanel>
              </section>
            )}
            {section === 'appearance' && (
              <section className="grid gap-7 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
                <PageIntro
                  title="Appearance"
                  text="Add the finishing touches to every public page in your wiki."
                />
                <SettingsPanel>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium">CSS editor</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Edit with more room and preview changes live.
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
                  <SettingRow
                    label="Custom CSS"
                    id="custom_css"
                    hint="Applied to all public-facing pages of this wiki."
                  >
                    <Textarea
                      id="custom_css"
                      value={form.data.custom_css}
                      onChange={(e) =>
                        form.setData('custom_css', e.target.value)
                      }
                      rows={18}
                      spellCheck={false}
                      className="resize-y font-mono text-sm"
                      placeholder={
                        '/* Make it yours */\n\n.prose h1 {\n  color: #7c3aed;\n}'
                      }
                    />
                    {form.errors.custom_css && (
                      <Error>{form.errors.custom_css}</Error>
                    )}
                  </SettingRow>
                  <SaveBar processing={form.processing} />
                </SettingsPanel>
              </section>
            )}
          </form>
          {section === 'domain' && (
            <section className="grid gap-7 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
              <PageIntro
                title="Custom domain"
                text="Point a domain you own at this wiki."
              />
              <SettingsPanel>
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full border">
                    {status[1] ? (
                      <Check className="size-4" />
                    ) : (
                      <Globe2 className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{status[0]}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.custom_domain || 'No domain configured yet'}
                    </p>
                  </div>
                </div>
                <SettingRow
                  label="Domain"
                  id="custom_domain"
                  hint="You can also use a subdomain such as docs.example.com."
                >
                  <Input
                    id="custom_domain"
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
                </SettingRow>
                <div>
                  <h3 className="text-sm font-medium">DNS record</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Create a CNAME record for your domain that points to{' '}
                    <code className="border-b px-0.5 py-0.5 font-mono text-foreground">
                      {customDomainTarget}
                    </code>
                    . We automatically check the record every five minutes and
                    issue an SSL certificate when it is ready.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={saveDomain} disabled={domainForm.processing}>
                    {domainForm.processing ? 'Saving domain…' : 'Save domain'}
                  </Button>
                </div>
              </SettingsPanel>
            </section>
          )}
          {section === 'danger' && (
            <section className="grid gap-7 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12">
              <PageIntro
                title="Danger zone"
                text="Deleting a wiki permanently removes its pages, files, and collaborator access."
              />
              <SettingsPanel>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
                </div>
              </SettingsPanel>
            </section>
          )}
        </main>
      </div>
    </AppLayout>
  );
}
function PageIntro({ title, text }: { title: string; text: string }) {
  return (
    <header className="md:sticky md:top-24 md:self-start">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </header>
  );
}
function SettingsPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('max-w-2xl space-y-7', className)}>{children}</div>;
}
function SettingRow({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id?: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{hint}</p>
      </div>
      <div className="min-w-0 space-y-2">{children}</div>
    </div>
  );
}
function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>;
}
const Error = FormError;
function SaveBar({ processing }: { processing: boolean }) {
  return (
    <div className="flex pt-2">
      <Button type="submit" disabled={processing}>
        {processing ? 'Saving changes…' : 'Save changes'}
      </Button>
    </div>
  );
}
