import { Head, useForm } from '@inertiajs/react';
import { ChevronRightIcon } from 'lucide-react';
import { useMemo, useCallback } from 'react';
import MarkdownEditorPreview from '@/components/markdown-editor-preview';
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
import AppLayout from '@/layouts/app-layout';

interface Mod {
  id: string;
  name: string;
  slug: string;
  custom_css?: string | null;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

type PageKind = 'page' | 'category';

interface Props {
  mod: Mod;
  parent?: Page;
  potentialParents?: Page[];
  initialKind?: PageKind;
}

// Constants
const MIN_EDITOR_LINES = 30;

export default function CreatePage({
  mod,
  parent,
  potentialParents = [],
  initialKind = 'page',
}: Props) {
  // Form state management
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    kind: initialKind,
    content: '',
    parent_id: parent?.id || '',
    is_index: false,
    published: true,
  });

  // Memoized values
  const lineCount = useMemo(
    () => Math.max(data.content.split('\n').length, MIN_EDITOR_LINES),
    [data.content],
  );

  const modUrl = `/dashboard/mods/${mod.slug}`;

  const handleSubmit = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      post(`/dashboard/mods/${mod.slug}/pages`);
    },
    [post, mod.slug],
  );

  const handleSaveAsDraft = useCallback(() => {
    setData('published', false);
    post(`/dashboard/mods/${mod.slug}/pages`);
  }, [post, mod.slug, setData]);

  return (
    <AppLayout contentWidth="full">
      <Head title={`Create Page - ${mod.name}`} />

      <div className="mx-auto max-w-full px-4 py-6 sm:px-6 lg:px-8">
        {/*  Page Header  */}
        <header className="mb-8">
          {/* Breadcrumb Navigation */}
          <nav className="mb-4 flex items-center text-sm text-primary">
            <a href={modUrl} className="hover:underline">
              {mod.name}
            </a>
            {parent && (
              <>
                <ChevronRightIcon className="mx-2 h-4 w-4" />
                <span>{parent.title}</span>
              </>
            )}
            <ChevronRightIcon className="mx-2 h-4 w-4" />
            <span>New Page</span>
          </nav>

          <h1 className="text-3xl font-bold text-primary">Create New Page</h1>
          <p className="mt-2 text-muted-foreground">
            Create a documentation page or category for your mod
          </p>
        </header>

        {/*  Create Form  */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/*  Page Details Card  */}
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="border-b border-border/40 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">
                Page Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 py-5">
              {/* Title, Kind and Parent Fields */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Title Input */}
                <div>
                  <Label htmlFor="title">Page Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Getting Started"
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="kind">Type</Label>
                  <Select
                    value={data.kind}
                    onValueChange={(value: PageKind) => {
                      setData('kind', value);
                      if (value === 'category') {
                        setData('is_index', false);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.kind && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.kind}
                    </p>
                  )}
                </div>

                {/* Parent Page Select */}
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

              {/* Page Options Checkboxes */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_index"
                    checked={data.is_index}
                    disabled={data.kind === 'category'}
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

          {data.kind === 'page' ? (
            <MarkdownEditorPreview
              content={data.content}
              onContentChange={(content) => setData('content', content)}
              lineCount={lineCount}
              error={errors.content}
              uploadUrl={`/dashboard/mods/${mod.slug}/files/quick-upload`}
              customCss={mod.custom_css}
            />
          ) : (
            <Card className="border-border/40 bg-card/50">
              <CardContent className="px-6 py-5 text-sm text-muted-foreground">
                Categories are used to group child pages. You can create pages
                inside this category after saving it.
              </CardContent>
            </Card>
          )}

          {/*  Form Actions  */}
          <div className="flex items-center justify-between pt-4">
            {/* Cancel Action */}
            <Button type="button" variant="outline" asChild>
              <a href={modUrl}>Cancel</a>
            </Button>

            {/* Save Actions */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button type="submit" disabled={processing}>
                {processing
                  ? 'Publishing...'
                  : data.kind === 'category'
                    ? 'Create Category'
                    : 'Publish Page'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
