import { BookOpenIcon } from '@heroicons/react/24/outline';

import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
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
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  custom_css?: string | null;
  owner: User;
  root_pages: Page[];
  index_page?: Page;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  kind: 'page' | 'category';
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
      <div key={page.id} style={{ marginLeft: level === 0 ? 0 : level * 2 }}>
        {page.kind === 'category' ? (
          <div className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm">
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-foreground">{page.title}</span>
            {!page.published && (
              <Badge variant="outline" className="ml-2 text-xs">
                Draft
              </Badge>
            )}
          </div>
        ) : (
          <a
            href={`/mod/${mod.slug}/${page.slug}`}
            className="group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-all duration-200 hover:border-border/70 hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
          >
            <BookOpenIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            <span className="truncate text-foreground group-hover:text-accent-foreground">
              {page.title}
            </span>
            {!page.published && (
              <Badge variant="outline" className="ml-2 text-xs">
                Draft
              </Badge>
            )}
          </a>
        )}
        {page.children && page.children.length > 0 && (
          <div className="ml-2 border-l border-border/60 pl-2">
            {renderPageTree(page.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const featuredPages = mod.root_pages
    .filter((page) => page.kind !== 'category')
    .slice(0, 3);

  const metaDescription =
    mod.description ||
    getMarkdownPreview(mod.index_page?.content || '', 180) ||
    `Read ${mod.name} documentation on HytaleModding.`;

  return (
    <PublicLayout
      modName={mod.name}
      modSlug={mod.slug}
      modIconUrl={mod.icon_url}
      customCss={mod.custom_css}
    >
      <SeoMeta
        title={`${mod.name} Documentation`}
        description={metaDescription}
        image={mod.icon_url}
        favicon={mod.icon_url}
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-20 space-y-4">
            <div className="px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Mod Details
            </div>

            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
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
            <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase">
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {mod.root_pages.length === 0 ? (
                  <div className="py-8 text-center">
                    <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No pages available yet.
                    </p>
                  </div>
                ) : (
                  <nav>{renderPageTree(mod.root_pages)}</nav>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 lg:col-span-8 xl:col-span-9">
          {mod.index_page ? (
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/10">
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
              <CardContent className="prose max-w-none min-w-0 p-8 [overflow-wrap:anywhere] break-words prose-gray dark:prose-invert prose-code:break-words prose-pre:max-w-full prose-pre:overflow-x-auto">
                <MarkdownRenderer content={mod.index_page.content || ''} />
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
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
                  {featuredPages.length > 0 && (
                    <div className="mx-auto grid max-w-2xl gap-4">
                      <h4 className="mb-4 text-left font-semibold">
                        Featured Pages
                      </h4>
                      {featuredPages.map((page) => (
                        <Card
                          key={page.id}
                          className="border-border/60 bg-background/70 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                        >
                          <CardContent className="p-4">
                            <a
                              href={`/mod/${mod.slug}/${page.slug}`}
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
        </main>
      </div>
    </PublicLayout>
  );
}
