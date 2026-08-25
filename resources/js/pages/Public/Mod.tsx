import { BookOpenIcon } from '@heroicons/react/24/outline';

import DocsShell from '@/components/docs/DocsShell';
import DocsSidebar from '@/components/docs/DocsSidebar';
import PageLinkGrid from '@/components/docs/PageLinkGrid';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SeoMeta from '@/components/SeoMeta';
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
      modDescription={mod.description}
      ownerName={mod.owner.name}
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
            navTitle="Documentation"
          />
        }
      >
        {mod.index_page ? (
          <article>
            <header className="border-b border-border/70 pb-7">
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                Getting started
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {mod.index_page.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Last updated {formatDate(mod.index_page.updated_at!)}
              </p>
            </header>
            <div className="public-prose prose max-w-none min-w-0 py-8 [overflow-wrap:anywhere] break-words prose-gray dark:prose-invert prose-code:break-words prose-pre:max-w-full prose-pre:overflow-x-auto">
              <MarkdownRenderer content={mod.index_page.content || ''} />
            </div>
          </article>
        ) : (
          <section>
            <div className="py-12 text-center">
              <BookOpenIcon className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Explore the documentation
              </h3>
              <p className="mx-auto mb-8 max-w-md text-muted-foreground">
                Browse the sections in the navigation to find what you need.
              </p>
              {featuredPages.length > 0 && (
                <div className="mx-auto max-w-2xl text-left">
                  <h4 className="mb-4 font-semibold">Start here</h4>
                  <PageLinkGrid
                    pages={featuredPages}
                    modSlug={mod.slug}
                    columns={1}
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </DocsShell>
    </PublicLayout>
  );
}
