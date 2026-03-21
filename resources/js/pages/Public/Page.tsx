import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
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
  kind: 'page' | 'category';
  content: string;
  published: boolean;
  updated_at: string;
  children?: Page[];
}

interface NavigationPage {
  id: string;
  title: string;
  slug: string;
  kind: 'page' | 'category';
  children?: NavigationPage[];
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  custom_css?: string | null;
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
      <div key={navPage.id} style={{ marginLeft: level === 0 ? 0 : level * 2 }}>
        {navPage.kind === 'category' ? (
          <div className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground/90">
            <BookOpenIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{navPage.title}</span>
          </div>
        ) : (
          <a
            href={`/mod/${mod.slug}/${navPage.slug}`}
            className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
              navPage.id === page.id
                ? 'border-primary/25 bg-accent font-medium text-accent-foreground shadow-sm'
                : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/60 hover:text-foreground'
            }`}
          >
            <BookOpenIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{navPage.title}</span>
          </a>
        )}
        {navPage.children && navPage.children.length > 0 && (
          <div className="mt-1 ml-2 border-l border-border/60 pl-2">
            {renderNavigation(navPage.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

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

  const allPages = flattenPages(navigation).filter(
    (p) => p.kind !== 'category',
  );
  const currentIndex = allPages.findIndex((p) => p.id === page.id);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  const breadcrumbs = [
    { title: page.title, href: `/mod/${mod.slug}/${page.slug}` },
  ];

  const metaDescription =
    getMarkdownPreview(page.content || '', 180) ||
    mod.description ||
    `Read ${page.title} in ${mod.name} documentation.`;

  return (
    <PublicLayout
      modName={mod.name}
      modSlug={mod.slug}
      modIconUrl={mod.icon_url}
      customCss={mod.custom_css}
      breadcrumbs={breadcrumbs}
    >
      <SeoMeta
        title={`${page.title} - ${mod.name} Documentation`}
        description={metaDescription}
        image={mod.icon_url}
        favicon={mod.icon_url}
        type="article"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-20 space-y-4">
            <div className="px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Overview
            </div>

            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  <a
                    href={`/mod/${mod.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {mod.name}
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
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
            <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase">
                  Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {navigation.length === 0 ? (
                  <div className="py-4 text-center">
                    <BookOpenIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No pages available
                    </p>
                  </div>
                ) : (
                  <nav>{renderNavigation(navigation)}</nav>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="min-w-0 lg:col-span-8 xl:col-span-9">
          <Card className="mb-8 overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <div className="space-y-2">
                <CardTitle className="text-2xl break-words sm:text-3xl">
                  {page.title}
                </CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Last updated {formatDate(page.updated_at)}</span>
                  {!page.published && <Badge variant="outline">Draft</Badge>}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="prose max-w-none min-w-0 [overflow-wrap:anywhere] break-words prose-gray dark:prose-invert prose-code:break-words prose-pre:max-w-full prose-pre:overflow-x-auto">
                <MarkdownRenderer
                  content={
                    page.kind === 'category' && !page.content
                      ? 'This category groups related pages.'
                      : page.content || 'This page is empty.'
                  }
                />
              </div>
            </CardContent>

            <div className="border-t border-border/60 bg-muted/15 px-6 py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-start">
                  {prevPage && (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="group h-auto rounded-xl border-border/60 bg-background/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                    >
                      <a
                        href={`/mod/${mod.slug}/${prevPage.slug}`}
                        className="flex min-w-0 items-center space-x-3"
                      >
                        <ChevronLeftIcon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Previous
                          </div>
                          <div className="line-clamp-2 font-semibold break-words text-foreground group-hover:text-primary">
                            {prevPage.title}
                          </div>
                        </div>
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex justify-end">
                  {nextPage && (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="group h-auto rounded-xl border-border/60 bg-background/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                    >
                      <a
                        href={`/mod/${mod.slug}/${nextPage.slug}`}
                        className="flex min-w-0 items-center space-x-3"
                      >
                        <div className="min-w-0 text-right">
                          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Next
                          </div>
                          <div className="line-clamp-2 font-semibold break-words text-foreground group-hover:text-primary">
                            {nextPage.title}
                          </div>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {page.children && page.children.length > 0 && (
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <CardTitle className="text-lg">Related Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {page.children
                    .filter((child) => child.kind !== 'category')
                    .map((child) => (
                      <Card
                        key={child.id}
                        className="border-border/60 bg-background/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                      >
                        <CardContent className="p-4">
                          <a
                            href={`/mod/${mod.slug}/${child.slug}`}
                            className="group block"
                          >
                            <h4 className="mb-2 font-medium break-words text-foreground group-hover:text-primary">
                              {child.title}
                            </h4>
                            <p className="text-sm break-words text-muted-foreground">
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
        </main>
      </div>
    </PublicLayout>
  );
}
