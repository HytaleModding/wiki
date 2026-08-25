import { BookOpenIcon } from '@heroicons/react/24/outline';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DocPageNode } from '@/types/docs';

import DocNavigationTree from './DocNavigationTree';

interface DocNavigationCardProps {
  title?: string;
  pages: DocPageNode[];
  modSlug: string;
  activePageId?: string;
  emptyMessage?: string;
}

export default function DocNavigationCard({
  title = 'Documentation',
  pages,
  modSlug,
  activePageId,
  emptyMessage = 'No pages available yet.',
}: DocNavigationCardProps) {
  return (
    <Card className="gap-0 overflow-hidden rounded-xl border-border/70 bg-card shadow-none">
      <CardHeader className="border-b border-border/60 px-4 pt-4 pb-3">
        <CardTitle className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {pages.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <nav>
            <DocNavigationTree
              pages={pages}
              modSlug={modSlug}
              activePageId={activePageId}
            />
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
