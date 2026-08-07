import { Card, CardContent } from '@/components/ui/card';
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
    <div className={`grid gap-4 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
      {pages.map((page) => (
        <Card
          key={page.id}
          className="border-border/60 bg-background/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
        >
          <CardContent className="p-4">
            <a href={`/mod/${modSlug}/${page.slug}`} className="group block">
              <h4 className="mb-2 font-medium break-words text-foreground group-hover:text-primary">
                {page.title}
              </h4>
              <p className="text-sm break-words text-muted-foreground">
                {getMarkdownPreview(page.content || '', 120)}
              </p>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
