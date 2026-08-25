import DocsShell from '@/components/docs/DocsShell';
import DocsSidebar from '@/components/docs/DocsSidebar';
import PageLinkGrid from '@/components/docs/PageLinkGrid';
import PrevNextNav from '@/components/docs/PrevNextNav';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
import { Badge } from '@/components/ui/badge';
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
      modDescription={mod.description}
      ownerName={mod.owner.name}
      customCss={mod.custom_css}
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
        <article className="mb-12">
          <header className="border-b border-border/70 pb-7">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Article</p>
              <h2 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                {page.title}
              </h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Last updated {formatDate(page.updated_at)}</span>
                {!page.published && <Badge variant="outline">Draft</Badge>}
              </div>
            </div>
          </header>

          <div className="py-8">
            <div className="public-prose prose max-w-none min-w-0 [overflow-wrap:anywhere] break-words prose-gray dark:prose-invert prose-code:break-words prose-pre:max-w-full prose-pre:overflow-x-auto">
              <MarkdownRenderer
                content={
                  page.kind === 'category' && !page.content
                    ? 'This category groups related pages.'
                    : page.content || 'This page is empty.'
                }
              />
            </div>
          </div>

          <PrevNextNav
            modSlug={mod.slug}
            prevPage={prevPage}
            nextPage={nextPage}
          />
        </article>

        {relatedPages.length > 0 && (
          <section className="border-t border-border/70 pt-8">
            <header className="mb-5">
              <h2 className="text-base font-semibold">Related pages</h2>
            </header>
            <PageLinkGrid
              pages={relatedPages}
              modSlug={mod.slug}
              columns={2}
            />
          </section>
        )}
      </DocsShell>
    </PublicLayout>
  );
}
