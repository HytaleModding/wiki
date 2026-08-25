import { Head, useForm } from '@inertiajs/react';
import {
  ChevronRightIcon,
  ExternalLinkIcon,
  HelpCircle,
  PencilIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { getVisibilityColor, visibilityOptions } from '@/utils/commonUtils';

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
  domain_verified: boolean;
  domain_verification_token?: string | null;
}

interface Props {
  mod: Mod;
  githubConnected: boolean;
}

interface GitHubRepository {
  id: number;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
}

export default function EditMod({ mod, githubConnected }: Props) {
  // Custom-domain settings are temporarily hidden from this page.
  // const appHost =
  //   typeof window !== 'undefined' ? window.location.hostname : 'your app host';
  // const savedCustomDomain = mod.custom_domain?.trim() || '';
  // const hasSavedCustomDomain = savedCustomDomain.length > 0;
  const [iconPreview, setIconPreview] = useState<string | null>(
    mod.icon_url || null,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [repositoriesError, setRepositoriesError] = useState<string | null>(
    null,
  );
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [isSelectingRepository, setIsSelectingRepository] = useState(false);
  // const [verifyingDomain, setVerifyingDomain] = useState(false);

  const { data, setData, patch, processing, errors } = useForm({
    name: mod.name,
    description: mod.description || '',
    visibility: mod.visibility,
    storage_driver: mod.storage_driver,
    external_access: mod.external_access || false,
    github_repository_url: mod.github_repository_url || '',
    github_repository_path: mod.github_repository_path || '',
    custom_css: mod.custom_css || '',
    custom_domain: mod.custom_domain || '',
    icon: null as File | null,
  });

  useEffect(() => {
    if (!githubConnected) return;

    setIsLoadingRepositories(true);
    fetch(`/dashboard/mods/${mod.slug}/github/repositories`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          repositories?: GitHubRepository[];
          message?: string;
        };
        if (!response.ok) throw new Error(payload.message || 'Unable to load repositories.');
        setRepositories(payload.repositories || []);
      })
      .catch((error: Error) => setRepositoriesError(error.message))
      .finally(() => setIsLoadingRepositories(false));
  }, [githubConnected, mod.slug]);

  const selectGithubRepository = async (repositoryId: string) => {
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
          body: JSON.stringify({ repository_id: Number(repositoryId) }),
        },
      );
      const payload = (await response.json()) as {
        repository?: GitHubRepository;
        message?: string;
      };
      if (!response.ok || !payload.repository) {
        throw new Error(payload.message || 'Unable to select the repository.');
      }

      setData('github_repository_url', payload.repository.html_url);
      setSyncFeedback({
        type: 'success',
        message: `${payload.repository.full_name} is now connected.`,
      });
    } catch (error) {
      setRepositoriesError(
        error instanceof Error ? error.message : 'Unable to select the repository.',
      );
    } finally {
      setIsSelectingRepository(false);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('icon', file);
      const reader = new FileReader();
      reader.onload = (e) => setIconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setData('icon', null);
      setIconPreview(mod.icon_url || null);
    }
  };

  const removeIcon = () => {
    setData('icon', null);
    setIconPreview(null);
    const fileInput = document.getElementById('icon') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const submit = (e: React.SubmitEvent) => {
    e.preventDefault();
    patch(`/dashboard/mods/${mod.slug}`, {
      forceFormData: true,
    });
  };

  const openCssEditor = () => {
    patch(`/dashboard/mods/${mod.slug}`, {
      forceFormData: true,
      onSuccess: () => {
        window.location.href = `/dashboard/mods/${mod.slug}/css-editor`;
      },
    });
  };

  const runGithubSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const response = await fetch(`/dashboard/mods/${mod.slug}/github-sync`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-CSRF-TOKEN':
            document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute('content') || '',
        },
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setSyncFeedback({
          type: 'error',
          message: payload?.message || 'GitHub sync failed.',
        });

        return;
      }

      setSyncFeedback({
        type: 'success',
        message: payload?.message || 'GitHub sync completed successfully.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectGithub = async () => {
    setRepositoriesError(null);

    const confirmed = window.confirm(
      'Disconnect your GitHub account from this wiki?',
    );
    if (!confirmed) return;

    const response = await fetch(`/dashboard/mods/${mod.slug}/github/connect`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-CSRF-TOKEN':
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
      },
    });

    if (!response.ok) {
      setRepositoriesError('Unable to unlink GitHub right now.');
      return;
    }

    window.location.reload();
  };

  const deleteMod = () => {
    fetch(`/dashboard/mods/${mod.slug}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN':
          document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '',
      },
    }).then(() => {
      window.location.href = '/dashboard/mods';
    });
  };

  // const verifyDomain = async () => {
  //   setVerifyingDomain(true);
  //
  //   try {
  //     const response = await fetch(`/dashboard/mods/${mod.slug}/domain/verify`, {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'X-CSRF-TOKEN':
  //           document
  //             .querySelector('meta[name="csrf-token"]')
  //             ?.getAttribute('content') || '',
  //       },
  //     });
  //
  //     if (response.ok) {
  //       window.location.reload();
  //       return;
  //     }
  //
  //     const payload = (await response.json().catch(() => null)) as
  //       | { message?: string }
  //       | null;
  //     alert(payload?.message || 'Domain verification failed.');
  //   } finally {
  //     setVerifyingDomain(false);
  //   }
  // };

  return (
    <AppLayout>
      <Head title={`Edit ${mod.name}`} />

      <div className="space-y-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 flex items-center text-sm text-primary">
            <a href={`/dashboard/mods/${mod.slug}`} className="hover:underline">
              {mod.name}
            </a>
            <ChevronRightIcon className="m-1 inline h-4 w-4" />
            <span>Settings</span>
          </nav>
        </div>

        <form onSubmit={submit} className="mt-12 space-y-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center space-x-3">
                  <div className="group relative flex-1">
                    <Label htmlFor="name" className="sr-only">
                      Mod Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      placeholder="My Awesome Mod"
                      className={cn(
                        'h-auto w-full border-2 border-muted-foreground/30 px-3 py-2 text-3xl font-bold tracking-tight hover:border-muted-foreground/50 focus:border-primary',
                        errors.name ? 'border-destructive' : '',
                      )}
                    />
                    <PencilIcon className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    {errors.name && (
                      <p className="mt-1 text-sm text-destructive">
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="group relative mb-4">
                  <Label htmlFor="description" className="sr-only">
                    Description
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      placeholder="A brief description of what your mod does..."
                      rows={2}
                      className={cn(
                        'w-full resize-none border-2 border-muted-foreground/30 px-3 py-2 text-muted-foreground hover:border-muted-foreground/50 focus:border-primary',
                        errors.description ? 'border-destructive' : '',
                      )}
                    />
                    <PencilIcon className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  {errors.description && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <Tabs defaultValue="general">
              <TabsList className="mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="github-sync">GitHub Sync</TabsTrigger>
                <TabsTrigger value="custom-css">Custom CSS</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general">
                <Card className="bg-transparent">
                  <CardHeader className="border-b pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                          Configure basic settings like visibility, mod icon,
                          and external access.
                        </CardDescription>
                      </div>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <HelpCircle className="h-6 w-6 cursor-pointer text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="left">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <p className="mb-5 text-sm">
                                Here you can configure general settings for your
                                mod, including visibility, mod icon, and
                                external access. These settings control who can
                                see your mod documentation, how it appears, and
                                whether external applications can access it via
                                API.
                              </p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={data.visibility}
                        onValueChange={(
                          value: 'public' | 'unlisted' | 'private',
                        ) => setData('visibility', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {visibilityOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="flex w-full"
                            >
                              <div className="flex w-full items-center justify-between gap-4">
                                <Badge
                                  variant="outline"
                                  className={getVisibilityColor(option.value)}
                                >
                                  {option.label}
                                </Badge>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.visibility && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.visibility}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Control who can access your mod documentation
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="icon">Mod Icon</Label>
                      <div className="relative mt-2">
                        <Input
                          id="icon"
                          type="file"
                          accept="image/*"
                          onChange={handleIconChange}
                          className={cn(
                            'pr-10',
                            errors.icon ? 'border-destructive' : '',
                          )}
                        />
                        {(iconPreview || data.icon) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hover:text-destructive-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 hover:bg-muted"
                            onClick={removeIcon}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {iconPreview && (
                        <div className="mt-4 flex justify-center">
                          <img
                            src={iconPreview}
                            alt="Icon preview"
                            className="h-24 w-24 rounded-lg border object-cover"
                          />
                        </div>
                      )}
                      {errors.icon && (
                        <p className="mt-2 text-sm text-destructive">
                          {errors.icon}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Optional. Upload a square image (PNG, JPG, GIF, WebP).
                        Maximum size: 2MB.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center space-x-3">
                      <Switch
                        id="external_access"
                        checked={data.external_access}
                        onCheckedChange={(checked: boolean) =>
                          setData('external_access', checked)
                        }
                      />
                      <div>
                        <Label htmlFor="external_access">External Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow external applications to access this mod via API
                        </p>
                      </div>
                      {errors.external_access && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.external_access}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GitHub Sync Tab */}
              <TabsContent value="github-sync">
                <Card className="bg-transparent">
                  <CardHeader className="border-b pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>GitHub Sync</CardTitle>
                        <CardDescription>
                          When a GitHub URL is configured, pages are managed by
                          sync and manual page create/edit is disabled.
                        </CardDescription>
                      </div>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <HelpCircle className="h-6 w-6 cursor-pointer text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="left">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <p className="mb-5 text-sm">
                                If your documentation already lives on GitHub,
                                you can sync it directly with your mod wiki.
                                Changes pushed to your repository will
                                automatically appear on the site — no manual
                                updates needed.
                              </p>
                              <p className="text-sm">
                                If you want to read more about the feature,
                                check out the documentation:
                              </p>
                              <div className="mt-2">
                                <a
                                  href="https://hytalemodding.dev/en/docs/wiki/6-github"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-secondary-foreground hover:underline"
                                >
                                  GitHub Sync Documentation
                                  <ExternalLinkIcon className="ml-1 h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                        <Label>GitHub account</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {githubConnected
                            ? 'Choose from repositories your connected GitHub App can access.'
                            : 'Install the GitHub App and authorize your account to choose a repository.'}
                        </p>
                        {!githubConnected ? (
                          <Button asChild className="mt-3" type="button">
                            <a href={`/dashboard/mods/${mod.slug}/github/connect`}>
                              Connect GitHub
                            </a>
                          </Button>
                        ) : (
                          <div className="mt-3 space-y-2">
                            <Select
                              value={
                                repositories.find(
                                  (repository) =>
                                    repository.html_url === data.github_repository_url,
                                )?.id.toString() || ''
                              }
                              onValueChange={selectGithubRepository}
                              disabled={isLoadingRepositories || isSelectingRepository}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingRepositories
                                      ? 'Loading repositories...'
                                      : 'Select a repository'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {repositories.map((repository) => (
                                  <SelectItem
                                    key={repository.id}
                                    value={repository.id.toString()}
                                  >
                                    {repository.full_name}
                                    {repository.private ? ' (private)' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!isLoadingRepositories &&
                              repositories.length === 0 &&
                              !repositoriesError && (
                                <p className="text-sm text-muted-foreground">
                                  No repositories are available yet. Install the
                                  GitHub App on a personal account or
                                  organization, grant it access to at least one
                                  repository, then reconnect.
                                </p>
                              )}
                            {repositoriesError && (
                              <p className="text-sm text-destructive">
                                {repositoriesError}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button asChild type="button" variant="outline">
                                <a
                                  href={`/dashboard/mods/${mod.slug}/github/connect`}
                                >
                                  Reconnect GitHub
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={disconnectGithub}
                              >
                                Unlink GitHub
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="github_repository_path">
                          Repository Path
                        </Label>
                        <Input
                          id="github_repository_path"
                          type="text"
                          value={data.github_repository_path}
                          onChange={(e) =>
                            setData('github_repository_path', e.target.value)
                          }
                          placeholder="docs"
                          className={cn(
                            errors.github_repository_path
                              ? 'border-destructive'
                              : '',
                          )}
                        />
                        {errors.github_repository_path && (
                          <p className="mt-1 text-sm text-destructive">
                            {errors.github_repository_path}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-muted-foreground">
                          Optional subfolder to sync markdown from (for example:
                          docs/guides). Leave blank to sync the repository root.
                        </p>
                      </div>

                      <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                        <div className="mb-3">
                          <Label>Manual Sync</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Pull markdown from your configured GitHub repository
                            right now.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={runGithubSync}
                          disabled={isSyncing || processing}
                        >
                          {isSyncing ? 'Running Sync...' : 'Run Sync'}
                        </Button>
                        {syncFeedback && (
                          <p
                            className={cn(
                              'mt-3 text-sm',
                              syncFeedback.type === 'success'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-destructive',
                            )}
                          >
                            {syncFeedback.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom CSS Tab */}
              <TabsContent value="custom-css">
                <Card className="bg-transparent">
                  <CardHeader className="border-b pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Custom CSS</CardTitle>
                        <CardDescription>
                          Write CSS that will be injected into all public-facing
                          pages of this mod. Use with care — this affects all
                          visitors.
                        </CardDescription>
                      </div>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <HelpCircle className="h-6 w-6 cursor-pointer text-muted-foreground" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="left">
                          <div className="flex justify-between space-x-4">
                            <div className="space-y-1">
                              <p className="mb-5 text-sm">
                                The wiki supports custom CSS, letting you change
                                colors, typography, spacing, and more. To make
                                the most of it, a basic understanding of CSS is
                                recommended.
                              </p>
                              <p className="text-sm">
                                If you want to read more about this feature,
                                check out the documentation:
                              </p>
                              <div className="mt-2">
                                <a
                                  href="https://hytalemodding.dev/en/docs/wiki/5-styling/5-3-custom-css"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-secondary-foreground hover:underline"
                                >
                                  Custom CSS Documentation
                                  <ExternalLinkIcon className="ml-1 h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>CSS Editor</Label>
                      <p className="mt-1 mb-3 text-sm text-muted-foreground">
                        Open the full-screen CSS editor with live preview for
                        easier editing.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openCssEditor}
                        disabled={processing}
                        className="border-violet-500/40 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 hover:text-violet-600 dark:text-violet-400"
                      >
                        <span>✨</span>
                        {processing ? 'Saving...' : 'Open CSS Editor'}
                      </Button>
                    </div>

                    <Separator />
                    <div className="relative overflow-hidden rounded-md border border-border/70 bg-muted/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          CSS
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Applied to all public pages
                        </span>
                      </div>
                      <textarea
                        id="custom_css"
                        value={data.custom_css}
                        onChange={(e) => setData('custom_css', e.target.value)}
                        placeholder={`/* Custom styles for your mod's public pages */\n\n.prose h1 {\n  color: #your-color;\n}\n\nbody {\n  --background: your-value;\n}`}
                        rows={14}
                        spellCheck={false}
                        className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                    </div>
                    {errors.custom_css && (
                      <p className="text-sm text-destructive">
                        {errors.custom_css}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end space-x-3 border-t pt-6">
              <Button type="button" variant="outline" asChild>
                <a href={`/dashboard/mods/${mod.slug}`}>Cancel</a>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>

        <div className="mx-auto mt-16 max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-4">
                <div>
                  <h3 className="text-lg font-medium">Delete Mod</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this mod and all its content. This action
                    cannot be undone.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger>
                    <Button variant="destructive">
                      Delete Mod Permanently
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this mod? This will
                        permanently delete all pages, files, and collaborator
                        access. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="destructive" onClick={deleteMod}>
                        Confirm deletion
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
