import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/layouts/public-layout';
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
      <div key={page.id} className={`ml-${level * 3}`}>
        <a
          href={`/docs/${mod.slug}/${page.slug}`}
          className="group flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
        >
          <BookOpenIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-foreground group-hover:text-accent-foreground">
            {page.title}
          </span>
          {!page.published && (
            <Badge variant="outline" className="ml-2 text-xs">
              Draft
            </Badge>
          )}
        </a>
        {page.children && page.children.length > 0 && (
          <div className="ml-3 border-l border-border/50 pl-3">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <PublicLayout modName={mod.name} modSlug={mod.slug}>
      <Head title={`${mod.name} Documentation`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {mod.description}
                </p>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {mod.owner.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    by {mod.owner.name}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                {mod.root_pages.length === 0 ? (
                  <div className="py-8 text-center">
                    <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No pages available yet.
                    </p>
                  </div>
                ) : (
                  <nav className="space-y-1">
                    {renderPageTree(mod.root_pages)}
                  </nav>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {mod.index_page ? (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpenIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">
                    {mod.index_page.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated {formatDate(mod.index_page.updated_at)}
                </p>
              </CardHeader>
              <CardContent className="prose max-w-none prose-gray dark:prose-invert">
                <MarkdownRenderer content={mod.index_page.content || ''} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Welcome to {mod.name}</CardTitle>
                <p className="text-muted-foreground">{mod.description}</p>
              </CardHeader>
              <CardContent>
                <div className="py-12 text-center">
                  <BookOpenIcon className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    Explore the Documentation
                  </h3>
                  <p className="mx-auto mb-8 max-w-md text-muted-foreground">
                    Browse through the navigation on the left to explore the
                    available documentation pages.
                  </p>
                  {mod.root_pages.length > 0 && (
                    <div className="mx-auto grid max-w-2xl gap-4">
                      <h4 className="mb-4 text-left font-semibold">
                        Featured Pages
                      </h4>
                      {mod.root_pages.slice(0, 3).map((page) => (
                        <Card
                          key={page.id}
                          className="text-left transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <a
                              href={`/docs/${mod.slug}/${page.slug}`}
                              className="group block"
                            >
                              <h5 className="mb-2 font-medium text-foreground group-hover:text-primary">
                                {page.title}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {getMarkdownPreview(page.content || '', 120)}
                              </p>
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
