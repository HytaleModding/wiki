import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  storage_driver: 'local' | 's3';
}

interface Props {
  mod: Mod;
}

export default function EditMod({ mod }: Props) {
  const { data, setData, patch, processing, errors } = useForm({
    name: mod.name,
    description: mod.description || '',
    visibility: mod.visibility,
    storage_driver: mod.storage_driver,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(`/dashboard/mods/${mod.slug}`);
  };

  const deleteMod = () => {
    if (
      confirm(
        'Are you sure you want to delete this mod? This will permanently delete all pages, files, and collaborator access. This action cannot be undone.',
      )
    ) {
      // Handle delete
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
    }
  };

  return (
    <AppLayout>
      <Head title={`Edit ${mod.name}`} />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-600">
            <a
              href={`/dashboard/mods/${mod.slug}`}
              className="hover:text-gray-800"
            >
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>Settings</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Mod Settings</h1>
          <p className="mt-2 text-gray-600">
            Update your mod's details and configuration
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Mod Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="My Awesome Mod"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    Changing the name will update the URL slug
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="A brief description of what your mod does..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="visibility">Visibility *</Label>
                  <Select
                    value={data.visibility}
                    onValueChange={(value: 'public' | 'unlisted' | 'private') =>
                      setData('visibility', value)
                    }
                  >
                    <SelectTrigger
                      className={errors.visibility ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Choose visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-sm text-gray-600">
                            Anyone can view this mod
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="unlisted">
                        <div>
                          <div className="font-medium">Unlisted</div>
                          <div className="text-sm text-gray-600">
                            Only people with the link can view
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-sm text-gray-600">
                            Only you and collaborators can view
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.visibility && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.visibility}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="storage_driver">File Storage *</Label>
                  <Select
                    value={data.storage_driver}
                    onValueChange={(value: 'local' | 's3') =>
                      setData('storage_driver', value)
                    }
                  >
                    <SelectTrigger
                      className={errors.storage_driver ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Choose storage option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">
                        <div>
                          <div className="font-medium">Local Storage</div>
                          <div className="text-sm text-gray-600">
                            Store files on this server
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="s3">
                        <div>
                          <div className="font-medium">S3 Storage</div>
                          <div className="text-sm text-gray-600">
                            Store files in Amazon S3 (or compatible)
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.storage_driver && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.storage_driver}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    Warning: Changing storage will not migrate existing files
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button type="button" variant="outline" asChild>
                    <a href={`/dashboard/mods/${mod.slug}`}>Cancel</a>
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Mod
                  </h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete this mod and all its content. This action
                    cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" onClick={deleteMod}>
                  Delete Mod Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
