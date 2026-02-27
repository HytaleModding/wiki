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

export default function CreateMod() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    visibility: 'private',
    storage_driver: 'local',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/mods');
  };

  return (
    <AppLayout>
      <Head title="Create New Mod" />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Mod</h1>
          <p className="mt-2 text-gray-600">
            Start a new documentation space for your mod or project
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mod Details</CardTitle>
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
                  onValueChange={(value) => setData('visibility', value)}
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
                  onValueChange={(value) => setData('storage_driver', value)}
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
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" asChild>
                  <a href="/mods">Cancel</a>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Creating...' : 'Create Mod'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
