import { useState } from 'react';
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import type { DocPageNode } from '@/types/docs';

interface DocNavigationTreeProps {
  pages: DocPageNode[];
  modSlug: string;
  activePageId?: string;
  level?: number;
}

export default function DocNavigationTree({
  pages,
  modSlug,
  activePageId,
  level = 0,
}: DocNavigationTreeProps) {
  return (
    <div className={level === 0 ? undefined : 'ml-2 border-l border-border/60 pl-2'}>
      {pages.map((page) => (
        <DocNavigationItem
          key={page.id}
          page={page}
          modSlug={modSlug}
          activePageId={activePageId}
          level={level}
        />
      ))}
    </div>
  );
}

function containsActivePage(nodes: DocPageNode[], activeId?: string): boolean {
  if (!activeId) return false;
  return nodes.some(
    (n) => n.id === activeId || (n.children && containsActivePage(n.children, activeId)),
  );
}

function DocNavigationItem({
  page,
  modSlug,
  activePageId,
  level,
}: {
  page: DocPageNode;
  modSlug: string;
  activePageId?: string;
  level: number;
}) {
  const hasChildren = !!page.children && page.children.length > 0;
  // Start expanded if the active page lives inside this category, otherwise collapsed for tidiness.
  const [collapsed, setCollapsed] = useState(
    hasChildren ? !containsActivePage(page.children!, activePageId) : false,
  );
  const isActive = page.id === activePageId;

  if (page.kind === 'category') {
    return (
      <div>
        <button
          type="button"
          onClick={() => hasChildren && setCollapsed((c) => !c)}
          disabled={!hasChildren}
          className="flex w-full items-start gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-muted-foreground/90 transition-colors hover:bg-accent/40 disabled:cursor-default"
        >
          {hasChildren ? (
            collapsed ? (
              <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ChevronDownIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )
          ) : (
            <BookOpenIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1 break-words">{page.title}</span>
          {page.published === false && (
            <Badge variant="outline" className="text-xs">
              Draft
            </Badge>
          )}
        </button>
        {hasChildren && !collapsed && (
          <DocNavigationTree
            pages={page.children!}
            modSlug={modSlug}
            activePageId={activePageId}
            level={level + 1}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      
        href={`/mod/${modSlug}/${page.slug}`}
        className={`group flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
          isActive
            ? 'border-primary/25 bg-accent font-medium text-accent-foreground shadow-sm'
            : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/60 hover:text-foreground'
        }`}
      >
        <BookOpenIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
        <span className="min-w-0 flex-1 break-words">{page.title}</span>
        {page.published === false && (
          <Badge variant="outline" className="text-xs">
            Draft
          </Badge>
        )}
      </a>
      {hasChildren && (
        <DocNavigationTree
          pages={page.children!}
          modSlug={modSlug}
          activePageId={activePageId}
          level={level + 1}
        />
      )}
    </div>
  );
}
