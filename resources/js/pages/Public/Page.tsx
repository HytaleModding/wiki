import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import MarkdownRenderer from '@/components/MarkdownRenderer';
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
  content: string;
  published: boolean;
  updated_at: string;
  children?: Page[];
}

interface NavigationPage {
  id: string;
  title: string;
  slug: string;
  children?: NavigationPage[];
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
  page: Page;
  navigation: NavigationPage[];
}

export default function PublicPage({ mod, page, navigation }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNavigation = (pages: NavigationPage[], level = 0) => {
    return pages.map((navPage) => (
      <div key={navPage.id} className={`ml-${level * 4}`}>
        <a
          href={`/docs/${mod.slug}/${navPage.slug}`}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${page.title} - ${mod.name} Documentation`} />

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <a href={`/docs/${mod.slug}`} className="hover:text-blue-600">
                  {mod.name}
                </a>
              </h1>
              <p className="mt-1 text-gray-600">{mod.description}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Public Documentation
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
              {navigation.length === 0 ? (
                <div className="text-center py-4">
                  <BookOpenIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No pages available</p>
                </div>
              ) : (
                <nav className="space-y-1">
                  {renderNavigation(navigation)}
                </nav>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Page Header */}
              <div className="border-b px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900">{page.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Last updated {formatDate(page.updated_at)}
                </p>
              </div>

              {/* Page Content */}
              <div className="p-6">
                <MarkdownRenderer
                  content={page.content || 'This page is empty.'}
                />
              </div>

              {/* Child Pages */}
              {page.children && page.children.length > 0 && (
                <div className="border-t px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Related Pages
                  </h3>
                  <div className="grid gap-3">
                    {page.children.map((child) => (
                      <a
                        key={child.id}
                        href={`/docs/${mod.slug}/${child.slug}`}
                        className="block p-4 border rounded-lg hover:shadow-md transition-shadow hover:bg-gray-50"
                      >
                        <h4 className="font-medium text-gray-900 mb-1">
                          {child.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getMarkdownPreview(child.content || '', 150)}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Documentation for <strong>{mod.name}</strong> by {mod.owner.name}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
