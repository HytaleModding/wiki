import { BookOpenIcon, PlusIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { getMarkdownPreview } from '@/utils/markdown';

interface User {
  id: number;
  name: string;
  username: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  creator: User;
  order_index: number;
  parent_id?: string;
  children?: Page[];
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  owner: User;
}

interface Props {
  mod: Mod;
  pages: Page[];
  userRole?: string;
  canEdit: boolean;
}

export default function PagesIndex({ mod, pages, userRole, canEdit }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPageList = (pageList: Page[], level = 0) => {
    return pageList.map((page) => (
      <div key={page.id} className={`ml-${level * 6} mb-4`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  <a
                    href={`/mods/${mod.slug}/pages/${page.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {page.title}
                  </a>
                  {!page.published && (
                    <Badge variant="outline" className="ml-2">
                      Draft
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {page.content ? getMarkdownPreview(page.content, 150) : 'No content yet'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/mods/${mod.slug}/pages/${page.slug}`}>
                    <EyeIcon className="h-4 w-4" />
                  </a>
                </Button>
                {canEdit && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/mods/${mod.slug}/pages/${page.slug}/edit`}>
                      <PencilIcon className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>By {page.creator.name}</span>
              <span>Updated {formatDate(page.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Render child pages */}
        {page.children && page.children.length > 0 && (
          <div className="mt-2">
            {renderPageList(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Group pages by parent
  const rootPages = pages.filter(page => !page.parent_id);
  const childPages = pages.filter(page => page.parent_id);

  // Attach children to their parents
  const pagesWithChildren = rootPages.map(page => ({
    ...page,
    children: childPages.filter(child => child.parent_id === page.id),
  }));

  return (
    <AppLayout>
      <Head title={`All Pages - ${mod.name}`} />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href={`/mods/${mod.slug}`} className="hover:text-gray-800">
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>All Pages</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Pages</h1>
              <p className="mt-2 text-gray-600">
                Browse all documentation pages in this mod
              </p>
            </div>
            {canEdit && (
              <Button asChild>
                <a href={`/mods/${mod.slug}/pages/create`}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Page
                </a>
              </Button>
            )}
          </div>
        </div>

        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pages yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start documenting your mod by creating your first page
              </p>
              {canEdit && (
                <Button asChild>
                  <a href={`/mods/${mod.slug}/pages/create`}>
                    Create First Page
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {pages.length} Pages
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{rootPages.length} root pages</span>
                <span>{childPages.length} subpages</span>
              </div>
            </div>

            <div className="space-y-4">
              {renderPageList(pagesWithChildren)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
