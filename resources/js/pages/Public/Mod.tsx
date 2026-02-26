import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  owner: User;
  root_pages: Page[];
  index_page?: Page;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  content?: string;
  published: boolean;
  updated_at: string;
  children?: Page[];
}

interface Props {
  mod: Mod;
}

export default function PublicMod({ mod }: Props) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPageTree = (pages: Page[], level = 0) => {
    return pages.map((page) => (
      <div key={page.id} className={`ml-${level * 4}`}>
        <div className="py-2 px-3 hover:bg-gray-50 rounded-md">
          <a
            href={`/docs/${mod.slug}/${page.slug}`}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <BookOpenIcon className="h-4 w-4 text-gray-400 mr-2" />
            {page.title}
            {!page.published && (
              <Badge variant="outline" className="ml-2 text-xs">
                Draft
              </Badge>
            )}
          </a>
        </div>
        {page.children && page.children.length > 0 && (
          <div className="ml-4">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${mod.name} Documentation`} />

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mod.name}</h1>
              <p className="mt-2 text-gray-600">{mod.description}</p>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <span>Created by {mod.owner.name}</span>
                <Badge className="ml-3 bg-green-100 text-green-800">
                  Public Documentation
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                {mod.root_pages.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pages available yet.</p>
                  </div>
                ) : (
                  <nav className="space-y-1">
                    {renderPageTree(mod.root_pages)}
                  </nav>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {mod.index_page ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    {mod.index_page.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Last updated {formatDate(mod.index_page.updated_at)}
                  </p>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer
                    content={mod.index_page.content || ''}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to {mod.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to the documentation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {mod.description || 'Browse the navigation on the left to explore the documentation.'}
                    </p>
                    {mod.root_pages.length > 0 && (
                      <div className="grid gap-4 max-w-md mx-auto">
                        {mod.root_pages.slice(0, 3).map((page) => (
                          <a
                            key={page.id}
                            href={`/docs/${mod.slug}/${page.slug}`}
                            className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                          >
                            <h4 className="font-medium text-blue-900 mb-1">
                              {page.title}
                            </h4>
                            <p className="text-sm text-blue-700">
                              {getMarkdownPreview(page.content || '', 100)}
                            </p>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
