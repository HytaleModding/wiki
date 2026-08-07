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
    <div
      className={
        level === 0 ? undefined : 'ml-2 border-l border-border/60 pl-2'
      }
    >
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

  for (const node of nodes) {
    if (node.id === activeId) return true;
    if (node.children && containsActivePage(node.children, activeId))
      return true;
  }

  return false;
}

interface DocNavigationItemProps {
  page: DocPageNode;
  modSlug: string;
  activePageId?: string;
  level: number;
}

function DocNavigationItem({
  page,
  modSlug,
  activePageId,
  level,
}: DocNavigationItemProps) {
  const hasChildren = !!page.children && page.children.length > 0;

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    hasChildren ? !containsActivePage(page.children!, activePageId) : false,
  );

  const isActive = page.id === activePageId;
  const isCategory = page.kind === 'category';

  let leadingIcon: React.ReactNode;
  if (isCategory && hasChildren) {
    leadingIcon = collapsed ? (
      <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0" />
    ) : (
      <ChevronDownIcon className="mt-0.5 h-4 w-4 shrink-0" />
    );
  } else {
    leadingIcon = <BookOpenIcon className="mt-0.5 h-4 w-4 shrink-0" />;
  }

  const draftBadge =
    page.published === false ? (
      <Badge variant="outline" className="text-xs">
        Draft
      </Badge>
    ) : null;

  const childTree = hasChildren ? (
    <DocNavigationTree
      pages={page.children!}
      modSlug={modSlug}
      activePageId={activePageId}
      level={level + 1}
    />
  ) : null;

  if (isCategory) {
    return (
      <div>
        <button
          type="button"
          onClick={() => hasChildren && setCollapsed((prev) => !prev)}
          disabled={!hasChildren}
          className="flex w-full items-start gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm text-muted-foreground/90 transition-colors hover:bg-accent/40 disabled:cursor-default"
        >
          {leadingIcon}
          <span className="min-w-0 flex-1 break-words">{page.title}</span>
          {draftBadge}
        </button>
        {!collapsed && childTree}
      </div>
    );
  }

  return (
    <div>
      <a
        href={`/mod/${modSlug}/${page.slug}`}
        className={`group flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
          isActive
            ? 'border-primary/25 bg-accent font-medium text-accent-foreground shadow-sm'
            : 'border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent/60 hover:text-foreground'
        }`}
      >
        {leadingIcon}
        <span className="min-w-0 flex-1 break-words">{page.title}</span>
        {draftBadge}
      </a>
      {childTree}
    </div>
  );
}
