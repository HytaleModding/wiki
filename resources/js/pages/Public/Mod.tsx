import { BookOpenIcon } from '@heroicons/react/24/outline';

import DocsShell from '@/components/docs/DocsShell';
import DocsSidebar from '@/components/docs/DocsSidebar';
import PageLinkGrid from '@/components/docs/PageLinkGrid';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/layouts/public-layout';
import type { DocMod, DocPageNode } from '@/types/docs';
import { formatDate } from '@/utils/date';
import { getMarkdownPreview } from '@/utils/markdown';

interface Mod extends DocMod {
  root_pages: DocPageNode[];
  index_page?: DocPageNode;
}

interface Props {
  mod: Mod;
}

export default function PublicMod({ mod }: Props) {
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

      <DocsShell
        sidebar={
          <DocsSidebar
            mod={mod}
            pages={mod.root_pages}
            overlineLabel="Mod Details"
            navTitle="Documentation"
          />
        }
      >
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
                Last updated {formatDate(mod.index_page.updated_at!)}
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
                  <div className="mx-auto max-w-2xl text-left">
                    <h4 className="mb-4 font-semibold">Featured Pages</h4>
                    <PageLinkGrid
                      pages={featuredPages}
                      modSlug={mod.slug}
                      columns={1}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </DocsShell>
    </PublicLayout>
  );
}
