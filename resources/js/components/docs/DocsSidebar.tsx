import { BookOpenIcon } from '@heroicons/react/24/outline';

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
    <aside className="min-w-0 rounded-2xl border border-border/70 bg-sidebar p-3 lg:self-stretch lg:p-4">
      <div className="lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100dvh-6rem)] lg:flex-col">
        <div className="mb-3 flex shrink-0 items-center gap-2.5 border-b border-border/70 px-2 pt-1 pb-4">
          <BookOpenIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {navTitle}
          </p>
        </div>
        <nav
          aria-label={navTitle}
          tabIndex={0}
          className="docs-sidebar-navigation min-h-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:overflow-y-auto lg:overscroll-contain"
        >
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
