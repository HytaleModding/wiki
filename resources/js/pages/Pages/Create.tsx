import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

interface Mod {
  id: string;
  name: string;
  slug: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  mod: Mod;
  parent?: Page;
}

export default function CreatePage({ mod, parent }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    content: '',
    parent_id: parent?.id || '',
    is_index: false,
    published: true,
  });

  const submit = (e: React.SubmitEvent) => {
    e.preventDefault();
    post(`/dashboard/mods/${mod.slug}/pages`);
  };

  return (
    <AppLayout>
      <Head title={`Create Page - ${mod.name}`} />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-600">
            <a
              href={`/dashboard/mods/${mod.slug}`}
              className="hover:text-gray-800"
            >
              {mod.name}
            </a>
            {parent && (
              <>
                <span className="mx-2">›</span>
                <span>{parent.title}</span>
              </>
            )}
            <span className="mx-2">›</span>
            <span>New Page</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Create New Page</h1>
          <p className="mt-2 text-gray-600">
            Add a new documentation page to your mod
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="Getting Started"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_index"
                    checked={data.is_index}
                    onCheckedChange={(checked) =>
                      setData('is_index', !!checked)
                    }
                  />
                  <Label htmlFor="is_index" className="text-sm">
                    Index page (home page of the mod)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="content">Page Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={data.content}
                  onChange={(e) => setData('content', e.target.value)}
                  placeholder="# Welcome to my mod

This is the main page of my mod documentation.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

```bash
# Install the mod
./install.sh
```

For more information, see the other pages in this documentation."
                  rows={20}
                  className={`font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
                <p className="mt-2 text-sm text-gray-600">
                  Use Markdown syntax to format your content. You can include
                  code blocks, images, links, and more.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" asChild>
              <a href={`/dashboard/mods/${mod.slug}`}>Cancel</a>
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setData('published', false);
                  post(`/dashboard/mods/${mod.slug}/pages`);
                }}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Publishing...' : 'Publish Page'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
