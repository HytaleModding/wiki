import type { DocMod, DocPageNode } from '@/types/docs';

import DocNavigationCard from './DocNavigationCard';
import ModOverviewCard from './ModOverviewCard';

interface DocsSidebarProps {
  mod: DocMod;
  pages: DocPageNode[];
  activePageId?: string;
  linkTitle?: boolean;
  overlineLabel?: string;
  navTitle?: string;
}

export default function DocsSidebar({
  mod,
  pages,
  activePageId,
  linkTitle = false,
  overlineLabel = 'Overview',
  navTitle = 'Documentation',
}: DocsSidebarProps) {
  return (
    <aside className="lg:col-span-4 lg:self-start xl:col-span-3">
      <div className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:[scrollbar-width:none] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden">
        <div className="px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {overlineLabel}
        </div>
        <ModOverviewCard mod={mod} linkTitle={linkTitle} />
        <DocNavigationCard
          title={navTitle}
          pages={pages}
          modSlug={mod.slug}
          activePageId={activePageId}
        />
      </div>
    </aside>
  );
}
