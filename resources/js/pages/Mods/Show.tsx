import {
  BookOpenIcon,
  PlusIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { QuickActionButton } from '@/components/dashboard/quick-action-button';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import AppLayout from '@/layouts/app-layout';
import {
  formatDate,
  getRoleColor,
  getVisibilityColor,
} from '@/utils/commonUtils';

interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  published: boolean;
  updated_at: string;
  children?: Page[];
}

interface User {
  id: number;
  name: string;
  username: string;
  avatar_url?: string;
}

interface Collaborator extends User {
  pivot: {
    role: 'admin' | 'editor' | 'viewer';
  };
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  storage_driver: 'local' | 's3';
  owner: User;
  collaborators: Collaborator[];
  root_pages: Page[];
  index_page?: Page;
  github_repository_url?: string | null;
}

interface Props {
  mod: Mod;
  userRole: string | null;
  canEdit: boolean;
  canManage: boolean;
}

export default function ShowMod({ mod, userRole, canEdit, canManage }: Props) {
  useFlashMessages();
  const isGithubManaged = Boolean(mod.github_repository_url);

  const renderPageTree = (pages: Page[], level = 0) => {
    return pages.map((page) => (
      <div key={page.id} className={`ml-${level * 4}`}>
        <div className="group flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent">
          <div className="flex items-center">
            <BookOpenIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            <a
              href={`/dashboard/mods/${mod.slug}/pages/${page.slug}`}
              className="text-foreground transition-colors hover:text-primary"
            >
              {page.title}
            </a>
            {!page.published && (
              <Badge variant="outline" className="ml-2 text-xs">
                Draft
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" variant="ghost" asChild>
              <a href={`/dashboard/mods/${mod.slug}/pages/${page.slug}`}>
                <EyeIcon className="h-3 w-3" />
              </a>
            </Button>
            {canEdit && !isGithubManaged && (
              <Button size="sm" variant="ghost" asChild>
                <a href={`/dashboard/mods/${mod.slug}/pages/${page.slug}/edit`}>
                  <PencilIcon className="h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
        {page.children && page.children.length > 0 && (
          <div className="ml-4 border-l border-border/50 pl-3">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <AppLayout>
      <Head title={mod.name} />

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center space-x-3">
              <h1 className="text-3xl font-bold tracking-tight">{mod.name}</h1>
              <Badge className={getVisibilityColor(mod.visibility)}>
                {mod.visibility}
              </Badge>
              {userRole && (
                <Badge className={getRoleColor(userRole)}>{userRole}</Badge>
              )}
            </div>
            <p className="mb-4 text-muted-foreground">{mod.description}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>By {mod.owner.name}</span>
              <span className="mx-2">•</span>
              <span>{mod.collaborators.length} collaborators</span>
            </div>
          </div>
          <div className="flex space-x-3">
            {mod.visibility === 'public' && (
              <Button variant="outline" asChild>
                <a href={`/mod/${mod.slug}`} target="_blank">
                  <EyeIcon className="mr-2 h-4 w-4" />
                  View Public
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 pb-8">
          <div className="flex items-stretch gap-6 not-lg:flex-col">
            <div className="flex-1 lg:col-span-2">
              <div className="space-y-6 lg:col-span-2">
                {/* Index Page */}
                {mod.index_page && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpenIcon className="mr-2 h-5 w-5 text-primary translate-y-[15px]" />
                        {mod.index_page.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MarkdownRenderer
                        content={mod.index_page.content || ''}
                      />
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Updated {formatDate(mod.index_page.updated_at)}
                        </span>
                        <Button size="sm" asChild>
                          <a
                            href={`/dashboard/mods/${mod.slug}/pages/${mod.index_page.slug}`}
                          >
                            Read More
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Pages Tree */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="font-semibold">Pages</h1>
                    {canEdit && !isGithubManaged && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Add Page
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    {mod.root_pages.length === 0 ? (
                      <div className="py-8 text-center">
                        <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">
                          No pages yet
                        </h3>
                        <p className="mb-4 text-muted-foreground">
                          Start documenting your mod by creating your first page
                        </p>
                        {canEdit && !isGithubManaged && (
                          <Button asChild>
                            <a
                              href={`/dashboard/mods/${mod.slug}/pages/create`}
                            >
                              Create First Page
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {renderPageTree(mod.root_pages)}
                      </div>
                    )}
                    {isGithubManaged && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pages are managed by GitHub sync.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="my-4">
              <Separator orientation="vertical" />
            </div>
            <div className="w-xs space-y-6">
              <QuickActions mod={mod} isGithubManaged={isGithubManaged} />
              <div className="mx-4">
                <Separator />
              </div>
              {/* Collaborators */}
              {(canManage || mod.collaborators.length > 0) && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="font-semibold">Collaborators</h1>
                    {canManage && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/mods/${mod.slug}/collaborators`}>
                          <UsersIcon className="mr-2 h-4 w-4" />
                          Manage
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="space-y-3">
                      {/* Owner */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                            <AvatarImage
                              src={mod.owner.avatar_url}
                              alt={mod.owner.name}
                            />
                            <AvatarFallback className="text-primarys rounded-lg bg-background">
                              {mod.owner.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium">
                              {mod.owner.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{mod.owner.username}
                            </p>
                          </div>
                        </div>
                        <Badge className={getRoleColor('owner')}>Owner</Badge>
                      </div>

                      {/* Collaborators */}
                      {mod.collaborators.map((collaborator) => (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                              <AvatarImage
                                src={collaborator.avatar_url}
                                alt={collaborator.name}
                              />
                              <AvatarFallback className="rounded-lg bg-background text-primary">
                                {collaborator.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <p className="text-sm font-medium">
                                {collaborator.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{collaborator.username}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={getRoleColor(collaborator.pivot.role)}
                          >
                            {collaborator.pivot.role}
                          </Badge>
                        </div>
                      ))}

                      {mod.collaborators.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No collaborators yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function QuickActions({
  mod,
  isGithubManaged,
}: {
  mod: Mod;
  isGithubManaged: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 font-semibold">Quick Actions</h1>
      </div>
      <div className="flex flex-col gap-2">
        {!isGithubManaged && (
          <QuickActionButton
            icon={Plus}
            label="New Page"
            description="Start a new Page for your mod documentation"
            href={`/dashboard/mods/${mod.slug}/pages/create`}
            variant="primary"
          />
        )}
        <QuickActionButton
          label="Upload Files"
          description="Upload and manage files for your mod documentation"
          href={`/dashboard/mods/${mod.slug}/files`}
        />
        <QuickActionButton
          label="View all Pages"
          description="Manage your mod pages"
          href={`/dashboard/mods/${mod.slug}/pages`}
        />
        <QuickActionButton
          label="Settings"
          description="Manage your mod settings"
          href={`/dashboard/mods/${mod.slug}/edit`}
        />
        <QuickActionButton
          label="CSS Editor"
          description="Customize the look of your public pages with CSS"
          href={`/dashboard/mods/${mod.slug}/css-editor`}
        />
      </div>
    </div>
  );
}
