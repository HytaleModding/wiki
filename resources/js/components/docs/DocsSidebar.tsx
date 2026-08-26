import type { DocMod, DocPageNode } from '@/types/docs';

import DocNavigationTree from './DocNavigationTree';

interface DocsSidebarProps {
  mod: DocMod;
  pages: DocPageNode[];
  activePageId?: string;
  navTitle?: string;
}

export default function DocsSidebar({
  mod,
  pages,
  activePageId,
  navTitle = 'Documentation',
}: DocsSidebarProps) {
  return (
    <aside className="lg:self-start">
      <div className="border-border/70 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:border-r lg:pr-6">
        <nav>
          <p className="mb-2 px-2 text-[0.68rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {navTitle}
          </p>
          {pages.length ? (
            <DocNavigationTree
              pages={pages}
              modSlug={mod.slug}
              activePageId={activePageId}
            />
          ) : (
            <p className="px-2 text-sm text-muted-foreground">
              No pages available yet.
            </p>
          )}
        </nav>
      </div>
    </aside>
  );
}
