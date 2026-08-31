import { Link } from '@inertiajs/react';
import type { PaginationLink } from '@/types/admin';
import { cn } from '@/lib/utils';

export function Pagination({
  links,
  from,
  to,
  total,
}: {
  links: PaginationLink[];
  from: number | null;
  to: number | null;
  total: number;
}) {
  if (links.length <= 3) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
      <span>
        Showing {from ?? 0}–{to ?? 0} of {total}
      </span>
      <div className="flex gap-1">
        {links.map((link, index) =>
          link.url ? (
            <Link
              key={`${link.label}-${index}`}
              href={link.url}
              preserveScroll
              className={cn(
                'rounded-md border px-2.5 py-1.5',
                link.active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted',
              )}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ) : (
            <span
              key={`${link.label}-${index}`}
              className="rounded-md border px-2.5 py-1.5 opacity-40"
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ),
        )}
      </div>
    </div>
  );
}
