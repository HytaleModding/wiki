import { PencilIcon, EyeIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { getMarkdownPreview } from '@/utils/markdown';

interface User {
  id: number;
  name: string;
  username: string;
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  visibility: 'public' | 'private' | 'unlisted';
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  creator: User;
  updater?: User;
  path: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
  children?: Page[];
}

interface NavigationPage {
  id: string;
  title: string;
  slug: string;
  children?: NavigationPage[];
}

interface Props {
  mod: Mod;
  page: Page;
  navigation: NavigationPage[];
  userRole?: string;
  canEdit: boolean;
}

export default function ShowPage({ mod, page, navigation, canEdit }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNavigation = (pages: NavigationPage[], level = 0) => {
    return pages.map((navPage) => (
      <div key={navPage.id} className={`ml-${level * 4}`}>
        <a
          href={`/dashboard/mods/${mod.slug}/pages/${navPage.slug}`}
          className={`block rounded px-2 py-1 text-sm hover:bg-gray-100 ${
            navPage.id === page.id
              ? 'bg-blue-50 font-medium text-blue-700'
              : 'text-gray-700'
          }`}
        >
          {navPage.title}
        </a>
        {navPage.children && navPage.children.length > 0 && (
          <div className="ml-4">
            {renderNavigation(navPage.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <AppLayout>
      <Head title={`${page.title} - ${mod.name}`} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{mod.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">{renderNavigation(navigation)}</nav>

                {canEdit && (
                  <div className="mt-6 border-t pt-4">
                    <Button size="sm" className="w-full" asChild>
                      <a href={`/dashboard/mods/${mod.slug}/pages/create`}>
                        Add New Page
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Breadcrumbs */}
            <nav className="mb-6 text-sm text-gray-600">
              <a
                href={`/dashboard/mods/${mod.slug}`}
                className="hover:text-gray-800"
              >
                {mod.name}
              </a>
              {page.path &&
                page.path.length > 0 &&
                page.path.map((pathItem, index) => (
                  <span key={pathItem.id}>
                    <span className="mx-2">›</span>
                    {index === page.path.length - 1 ? (
                      <span className="font-medium text-gray-900">
                        {pathItem.title}
                      </span>
                    ) : (
                      <a
                        href={`/dashboard/mods/${mod.slug}/pages/${pathItem.slug}`}
                        className="hover:text-gray-800"
                      >
                        {pathItem.title}
                      </a>
                    )}
                  </span>
                ))}
            </nav>

            {/* Page Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  {page.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>By {page.creator.name}</span>
                  <span>•</span>
                  <span>Updated {formatDate(page.updated_at)}</span>
                  {!page.published && (
                    <>
                      <span>•</span>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700"
                      >
                        Draft
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                {mod.visibility === 'public' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/mod/${mod.slug}/${page.slug}`} target="_blank">
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Public View
                    </a>
                  </Button>
                )}
                {canEdit && (
                  <Button size="sm" asChild>
                    <a
                      href={`/dashboard/mods/${mod.slug}/pages/${page.slug}/edit`}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Page Content */}
            <Card>
              <CardContent className="pt-6">
                <MarkdownRenderer
                  content={page.content || 'This page is empty.'}
                />
              </CardContent>
            </Card>

            {/* Child Pages */}
            {page.children && page.children.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpenIcon className="mr-2 h-5 w-5" />
                    Subpages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {page.children.map((child) => (
                      <a
                        key={child.id}
                        href={`/dashboard/mods/${mod.slug}/pages/${child.slug}`}
                        className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
                      >
                        <h3 className="mb-1 font-medium text-gray-900">
                          {child.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getMarkdownPreview(child.content || '', 150)}
                        </p>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Footer */}
            <div className="mt-8 border-t pt-6 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  Last updated by {page.updater?.name || page.creator.name}
                  on {formatDate(page.updated_at)}
                </div>
                {canEdit && (
                  <a
                    href={`/dashboard/mods/${mod.slug}/pages/${page.slug}/edit`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Improve this page
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
