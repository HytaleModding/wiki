import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/layouts/public-layout';
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
      <div key={navPage.id} className={`ml-${level * 3}`}>
        <a
          href={`/docs/${mod.slug}/${navPage.slug}`}
          className={`group flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
            navPage.id === page.id
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          }`}
        >
          <BookOpenIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{navPage.title}</span>
        </a>
        {navPage.children && navPage.children.length > 0 && (
          <div className="mt-1 ml-3 border-l border-border/50 pl-3">
            {renderNavigation(navPage.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Find previous and next pages for navigation
  const flattenPages = (pages: NavigationPage[]): NavigationPage[] => {
    const result: NavigationPage[] = [];
    pages.forEach((p) => {
      result.push(p);
      if (p.children) {
        result.push(...flattenPages(p.children));
      }
    });
    return result;
  };

  const allPages = flattenPages(navigation);
  const currentIndex = allPages.findIndex((p) => p.id === page.id);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  const breadcrumbs = [
    { title: page.title, href: `/docs/${mod.slug}/${page.slug}` },
  ];

  return (
    <PublicLayout
      modName={mod.name}
      modSlug={mod.slug}
      breadcrumbs={breadcrumbs}
    >
      <Head title={`${page.title} - ${mod.name} Documentation`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  <a
                    href={`/docs/${mod.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {mod.name}
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {mod.description}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    by {mod.owner.name}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent>
                {navigation.length === 0 ? (
                  <div className="py-4 text-center">
                    <BookOpenIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No pages available
                    </p>
                  </div>
                ) : (
                  <nav className="space-y-1">
                    {renderNavigation(navigation)}
                  </nav>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="mb-8">
            {/* Page Header */}
            <CardHeader className="border-b">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{page.title}</CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last updated {formatDate(page.updated_at)}</span>
                  {!page.published && <Badge variant="outline">Draft</Badge>}
                </div>
              </div>
            </CardHeader>

            {/* Page Content */}
            <CardContent className="p-8">
              <div className="prose max-w-none prose-gray dark:prose-invert">
                <MarkdownRenderer
                  content={page.content || 'This page is empty.'}
                />
              </div>
            </CardContent>

            {/* Navigation Footer */}
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                {prevPage ? (
                  <Button variant="outline" asChild>
                    <a
                      href={`/docs/${mod.slug}/${prevPage.slug}`}
                      className="flex items-center"
                    >
                      <ChevronLeftIcon className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">
                          Previous
                        </div>
                        <div className="font-medium">{prevPage.title}</div>
                      </div>
                    </a>
                  </Button>
                ) : (
                  <div />
                )}

                {nextPage ? (
                  <Button variant="outline" asChild>
                    <a
                      href={`/docs/${mod.slug}/${nextPage.slug}`}
                      className="flex items-center"
                    >
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          Next
                        </div>
                        <div className="font-medium">{nextPage.title}</div>
                      </div>
                      <ChevronRightIcon className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </Card>

          {/* Child Pages */}
          {page.children && page.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {page.children.map((child) => (
                    <Card
                      key={child.id}
                      className="transition-shadow hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <a
                          href={`/docs/${mod.slug}/${child.slug}`}
                          className="group block"
                        >
                          <h4 className="mb-2 font-medium text-foreground group-hover:text-primary">
                            {child.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {getMarkdownPreview(child.content || '', 120)}
                          </p>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
