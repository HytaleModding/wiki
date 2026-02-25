import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PencilIcon, EyeIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/layouts/app-layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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

export default function ShowPage({ mod, page, navigation, userRole, canEdit }: Props) {
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
          href={`/mods/${mod.slug}/pages/${navPage.slug}`}
          className={`block py-1 px-2 text-sm rounded hover:bg-gray-100 ${
            navPage.id === page.id
              ? 'bg-blue-50 text-blue-700 font-medium'
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

  // Simple markdown to HTML conversion (basic implementation)
  const renderMarkdown = (content: string) => {
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-6">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      // Code blocks
      .replace(/```([^`]+)```/gim, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Paragraphs (simple)
      .replace(/\n\n/gim, '</p><p class="mb-4">');

    return `<div class="prose prose-sm max-w-none"><p class="mb-4">${html}</p></div>`;
  };

  return (
    <AppLayout>
      <Head title={`${page.title} - ${mod.name}`} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{mod.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  {renderNavigation(navigation)}
                </nav>

                {canEdit && (
                  <div className="mt-6 pt-4 border-t">
                    <Button size="sm" className="w-full" asChild>
                      <a href={`/mods/${mod.slug}/pages/create`}>
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
            <nav className="text-sm text-gray-600 mb-6">
              <a href={`/mods/${mod.slug}`} className="hover:text-gray-800">
                {mod.name}
              </a>
              {page.path && page.path.length > 0 && page.path.map((pathItem, index) => (
                <span key={pathItem.id}>
                  <span className="mx-2">›</span>
                  {index === page.path.length - 1 ? (
                    <span className="text-gray-900 font-medium">{pathItem.title}</span>
                  ) : (
                    <a
                      href={`/mods/${mod.slug}/pages/${pathItem.slug}`}
                      className="hover:text-gray-800"
                    >
                      {pathItem.title}
                    </a>
                  )}
                </span>
              ))}
            </nav>

            {/* Page Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {page.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>By {page.creator.name}</span>
                  <span>•</span>
                  <span>Updated {formatDate(page.updated_at)}</span>
                  {!page.published && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-yellow-700 bg-yellow-50">
                        Draft
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                {mod.visibility === 'public' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/docs/${mod.slug}/${page.slug}`} target="_blank">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Public View
                    </a>
                  </Button>
                )}
                {canEdit && (
                  <Button size="sm" asChild>
                    <a href={`/mods/${mod.slug}/pages/${page.slug}/edit`}>
                      <PencilIcon className="h-4 w-4 mr-2" />
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
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    Subpages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {page.children.map((child) => (
                      <a
                        key={child.id}
                        href={`/mods/${mod.slug}/pages/${child.slug}`}
                        className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">
                          {child.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {child.content?.substring(0, 150)}...
                        </p>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Footer */}
            <div className="mt-8 pt-6 border-t text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  Last updated by {page.updater?.name || page.creator.name}
                  on {formatDate(page.updated_at)}
                </div>
                {canEdit && (
                  <a
                    href={`/mods/${mod.slug}/pages/${page.slug}/edit`}
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
