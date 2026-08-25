import { ArrowUpRight } from 'lucide-react';
import type { DocPageNode } from '@/types/docs';
import { getMarkdownPreview } from '@/utils/markdown';

interface PageLinkGridProps {
  pages: DocPageNode[];
  modSlug: string;
  columns?: 1 | 2;
}

export default function PageLinkGrid({
  pages,
  modSlug,
  columns = 2,
}: PageLinkGridProps) {
  return (
    <div className={`grid gap-x-8 gap-y-3 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
      {pages.map((page) => (
        <a
          key={page.id}
          href={`/mod/${modSlug}/${page.slug}`}
          className="group border-b border-border/70 py-4 transition-colors hover:border-primary"
        >
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-medium break-words text-foreground group-hover:text-primary">{page.title}</h4>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="mt-1.5 text-sm leading-6 break-words text-muted-foreground">{getMarkdownPreview(page.content || '', 120)}</p>
        </a>
      ))}
    </div>
  );
}
