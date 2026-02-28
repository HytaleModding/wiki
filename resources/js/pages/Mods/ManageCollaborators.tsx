import { PlusIcon, UsersIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { sileo } from 'sileo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import AppLayout from '@/layouts/app-layout';

interface User {
  id: number;
  name: string;
  username: string;
  avatar_url?: string;
}

interface Collaborator extends User {
  pivot: {
    role: 'admin' | 'editor' | 'viewer';
    invited_by: number;
    created_at: string;
  };
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  owner: User;
  collaborators: Collaborator[];
}

interface Props {
  mod: Mod;
  canManage: boolean;
}

export default function ManageCollaborators({ mod, canManage }: Props) {
  useFlashMessages();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    username: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
  });

  const { delete: deleteRequest } = useForm();

  const addCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/dashboard/mods/${mod.slug}/collaborators`, {
      onSuccess: () => {
        reset();
        setShowAddDialog(false);
        sileo.success({
          title: 'Invitation Sent!',
          description: `Invitation has been sent to ${data.username}`,
        });
      },
      onError: (errors) => {
        if (errors.email) {
          sileo.error({
            title: 'Email Failed',
            description: errors.email,
          });
        } else if (errors.username) {
          sileo.error({
            title: 'Invalid User',
            description: errors.username,
          });
        } else {
          sileo.error({
            title: 'Error',
            description: 'Failed to send invitation. Please try again.',
          });
        }
      },
    });
  };

  const removeCollaborator = (collaboratorId: number) => {
    if (confirm('Are you sure you want to remove this collaborator?')) {
      const collaboratorToRemove = mod.collaborators.find(
        (c) => c.id === collaboratorId,
      );
      const collaboratorName = collaboratorToRemove?.name || 'collaborator';

      deleteRequest(
        `/dashboard/mods/${mod.slug}/collaborators/${collaboratorId}`,
        {
          onSuccess: () => {
            sileo.success({
              title: 'Collaborator Removed',
              description: `${collaboratorName} has been removed from the mod`,
            });
          },
          onError: () => {
            sileo.error({
              title: 'Error',
              description: 'Failed to remove collaborator. Please try again.',
            });
          },
        },
      );
    }
  };

  const updateRole = (collaboratorId: number, newRole: string) => {
    const collaboratorToUpdate = mod.collaborators.find(
      (c) => c.id === collaboratorId,
    );
    const collaboratorName = collaboratorToUpdate?.name || 'collaborator';

    console.log('Updating role for:', collaboratorId, 'to:', newRole);
    console.log(
      'URL:',
      `/dashboard/mods/${mod.slug}/collaborators/${collaboratorId}`,
    );
    console.log('Data:', { role: newRole });

    router.patch(
      `/dashboard/mods/${mod.slug}/collaborators/${collaboratorId}`,
      { role: newRole },
      {
        onSuccess: () => {
          sileo.success({
            title: 'Role Updated',
            description: `${collaboratorName}'s role has been updated to ${newRole}`,
          });
        },
        onError: (errors) => {
          console.error('Update role errors:', errors);
          sileo.error({
            title: 'Error',
            description: `Failed to update role. ${JSON.stringify(errors)}`,
          });
        },
      },
    );
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!canManage) {
    return (
      <AppLayout>
        <Head title={`Collaborators - ${mod.name}`} />
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mb-4 text-gray-600">
                You don't have permission to manage collaborators for this mod.
              </p>
              <Button asChild>
                <a href={`/dashboard/mods/${mod.slug}`}>Back to Mod</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title={`Manage Collaborators - ${mod.name}`} />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-600">
            <a
              href={`/dashboard/mods/${mod.slug}`}
              className="hover:text-gray-800"
            >
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>Collaborators</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Collaborators
              </h1>
              <p className="mt-2 text-gray-600">
                Invite team members and manage their access to this mod
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Invite Collaborator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New Collaborator</DialogTitle>
                </DialogHeader>
                <form onSubmit={addCollaborator} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={data.username}
                      onChange={(e) => setData('username', e.target.value)}
                      placeholder="Enter username"
                      className={errors.username ? 'border-red-500' : ''}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={data.role}
                      onValueChange={(value) =>
                        setData('role', value as 'admin' | 'editor' | 'viewer')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div>
                            <div className="font-medium">Admin</div>
                            <div className="text-sm text-gray-600">
                              Can manage pages and collaborators
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div>
                            <div className="font-medium">Editor</div>
                            <div className="text-sm text-gray-600">
                              Can create and edit pages
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div>
                            <div className="font-medium">Viewer</div>
                            <div className="text-sm text-gray-600">
                              Can only view pages
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                      {processing ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UsersIcon className="mr-2 h-5 w-5" />
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-4">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <span className="text-sm font-medium text-purple-800">
                      {mod.owner.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {mod.owner.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      @{mod.owner.username}
                    </p>
                  </div>
                </div>
                <Badge className={getRoleColor('owner')}>Owner</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <UsersIcon className="mr-2 h-5 w-5" />
                  Collaborators ({mod.collaborators.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mod.collaborators.length === 0 ? (
                <div className="py-8 text-center">
                  <UsersIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No collaborators yet
                  </h3>
                  <p className="mb-4 text-gray-600">
                    Invite team members to help build this mod's documentation
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Invite First Collaborator
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mod.collaborators.map((collaborator) => (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <span className="text-sm font-medium text-gray-800">
                            {collaborator.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {collaborator.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{collaborator.username} • Joined{' '}
                            {formatDate(collaborator.pivot.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Select
                          value={collaborator.pivot.role}
                          onValueChange={(value) =>
                            updateRole(collaborator.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCollaborator(collaborator.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Permission Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge className={getRoleColor('admin')}>Admin</Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Administrator
                    </p>
                    <p className="text-sm text-gray-600">
                      Can create, edit, and delete pages. Can manage
                      collaborators and invite new members.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className={getRoleColor('editor')}>Editor</Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Editor</p>
                    <p className="text-sm text-gray-600">
                      Can create, edit, and publish pages. Cannot manage
                      collaborators or mod settings.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge className={getRoleColor('viewer')}>Viewer</Badge>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Viewer</p>
                    <p className="text-sm text-gray-600">
                      Can only view private mod content. Cannot edit or create
                      pages.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
