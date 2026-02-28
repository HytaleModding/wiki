import {
  BookOpenIcon,
  PlusIcon,
  CogIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import AppLayout from '@/layouts/app-layout';

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
  visibility: 'public' | 'private' | 'unlisted';
  storage_driver: 'local' | 's3';
  owner: User;
  collaborators: Collaborator[];
  root_pages: Page[];
  index_page?: Page;
}

interface Props {
  mod: Mod;
  userRole: string | null;
  canEdit: boolean;
  canManage: boolean;
}

export default function ShowMod({ mod, userRole, canEdit, canManage }: Props) {
  useFlashMessages();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-red-100 text-red-800';
      case 'unlisted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
            {canEdit && (
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
              <span className="mx-2">•</span>
              <span>
                {mod.storage_driver === 's3' ? 'S3 Storage' : 'Local Storage'}
              </span>
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
            {canEdit && (
              <Button asChild>
                <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Page
                </a>
              </Button>
            )}
            {canManage && (
              <Button variant="outline" asChild>
                <a href={`/dashboard/mods/${mod.slug}/edit`}>
                  <CogIcon className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Index Page */}
            {mod.index_page && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpenIcon className="mr-2 h-5 w-5 text-primary" />
                    {mod.index_page.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={mod.index_page.content || ''} />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Updated {formatDate(mod.index_page.updated_at)}
                    </span>
                    <Button variant="outline" size="sm" asChild>
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

            {/* Pages Tree */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pages</CardTitle>
                  {canEdit && (
                    <Button size="sm" asChild>
                      <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Page
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {mod.root_pages.length === 0 ? (
                  <div className="py-8 text-center">
                    <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">No pages yet</h3>
                    <p className="mb-4 text-muted-foreground">
                      Start documenting your mod by creating your first page
                    </p>
                    {canEdit && (
                      <Button asChild>
                        <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canEdit && (
                  <>
                    <Button className="w-full" asChild>
                      <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Page
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={`/dashboard/mods/${mod.slug}/files`}>
                        Upload Files
                      </a>
                    </Button>
                  </>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/dashboard/mods/${mod.slug}/pages`}>
                    View All Pages
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Collaborators */}
            {(canManage || mod.collaborators.length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Collaborators</CardTitle>
                    {canManage && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/mods/${mod.slug}/collaborators`}>
                          <UsersIcon className="mr-2 h-4 w-4" />
                          Manage
                        </a>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Owner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 font-medium text-purple-800">
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
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-muted font-medium">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
