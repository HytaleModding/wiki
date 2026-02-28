import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_index: boolean;
  published: boolean;
  parent_id?: string;
}

interface PotentialParent {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  mod: Mod;
  page: Page;
  potentialParents: PotentialParent[];
}

export default function EditPage({ mod, page, potentialParents }: Props) {
  const { data, setData, patch, processing, errors } = useForm({
    title: page.title,
    content: page.content,
    parent_id: page.parent_id || '',
    is_index: page.is_index,
    published: page.published,
  });

  const [showPreview, setShowPreview] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(`/dashboard/mods/${mod.slug}/pages/${page.slug}`);
  };

  return (
    <AppLayout>
      <Head title={`Edit ${page.title} - ${mod.name}`} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-600">
            <a
              href={`/dashboard/mods/${mod.slug}`}
              className="hover:text-gray-800"
            >
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <a
              href={`/dashboard/mods/${mod.slug}/pages/${page.slug}`}
              className="hover:text-gray-800"
            >
              {page.title}
            </a>
            <span className="mx-2">›</span>
            <span>Edit</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Edit Page</h1>
          <p className="mt-2 text-gray-600">
            Update your documentation page content and settings
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                <div>
                  <Label htmlFor="parent_id">Parent Page</Label>
                  <Select
                    value={data.parent_id || 'none'}
                    onValueChange={(value) =>
                      setData('parent_id', value === 'none' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No parent (root page)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No parent (root page)
                      </SelectItem>
                      {potentialParents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={data.published}
                    onCheckedChange={(checked) =>
                      setData('published', !!checked)
                    }
                  />
                  <Label htmlFor="published" className="text-sm">
                    Published
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content Editor</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="content">Page Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    placeholder="# Welcome

Write your content here using Markdown syntax.

## Features

- Feature 1
- Feature 2

```bash
# Example code block
echo 'Hello World'
```"
                    rows={20}
                    className={`font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.content}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    Use Markdown syntax to format your content. Supports
                    headers, lists, code blocks, links, and more.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-100 rounded-md border p-4">
                    <MarkdownRenderer
                      content={data.content || 'Nothing to preview yet...'}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-3">
              <Button type="button" variant="outline" asChild>
                <a href={`/dashboard/mods/${mod.slug}/pages/${page.slug}`}>
                  Cancel
                </a>
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to delete this page? This action cannot be undone.',
                    )
                  ) {
                    router.delete(
                      `/dashboard/mods/${mod.slug}/pages/${page.slug}`,
                    );
                  }
                }}
              >
                Delete Page
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  router.patch(
                    `/dashboard/mods/${mod.slug}/pages/${page.slug}`,
                    {
                      ...data,
                      published: false,
                    },
                  );
                }}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
