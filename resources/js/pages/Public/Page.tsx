import DocsShell from '@/components/docs/DocsShell';
import DocsSidebar from '@/components/docs/DocsSidebar';
import PageLinkGrid from '@/components/docs/PageLinkGrid';
import PrevNextNav from '@/components/docs/PrevNextNav';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/layouts/public-layout';
import type { DocMod, DocPageNode } from '@/types/docs';
import { formatDate } from '@/utils/date';
import { getMarkdownPreview } from '@/utils/markdown';

interface Page extends DocPageNode {
  content: string;
  published: boolean;
  updated_at: string;
}

interface Props {
  mod: DocMod;
  page: Page;
  navigation: DocPageNode[];
}

function flattenPages(pages: DocPageNode[]): DocPageNode[] {
  const result: DocPageNode[] = [];
  pages.forEach((p) => {
    result.push(p);
    if (p.children) result.push(...flattenPages(p.children));
  });
  return result;
}

export default function PublicPage({ mod, page, navigation }: Props) {
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

  const relatedPages = (page.children || []).filter(
    (child) => child.kind !== 'category',
  );

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

      <DocsShell
        sidebar={
          <DocsSidebar
            mod={mod}
            pages={navigation}
            activePageId={page.id}
            linkTitle
            overlineLabel="Overview"
            navTitle="Contents"
          />
        }
      >
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

          <PrevNextNav
            modSlug={mod.slug}
            prevPage={prevPage}
            nextPage={nextPage}
          />
        </Card>

        {relatedPages.length > 0 && (
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="text-lg">Related Pages</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <PageLinkGrid
                pages={relatedPages}
                modSlug={mod.slug}
                columns={2}
              />
            </CardContent>
          </Card>
        )}
      </DocsShell>
    </PublicLayout>
  );
}
