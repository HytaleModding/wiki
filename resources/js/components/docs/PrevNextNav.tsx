import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';

interface PrevNextNavProps {
  modSlug: string;
  prevPage: { slug: string; title: string } | null;
  nextPage: { slug: string; title: string } | null;
}

export default function PrevNextNav({
  modSlug,
  prevPage,
  nextPage,
}: PrevNextNavProps) {
  return (
    <div className="border-t border-border/70 py-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="flex justify-start">
          {prevPage && (
            <Button
              variant="outline"
              size="lg"
              asChild
              className="group h-auto rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
            >
              <a
                href={`/mod/${modSlug}/${prevPage.slug}`}
                className="flex min-w-0 items-center space-x-3"
              >
                <ChevronLeftIcon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div className="min-w-0 text-left">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Previous
                  </div>
                  <div className="line-clamp-2 font-semibold break-words text-foreground group-hover:text-primary">
                    {prevPage.title}
                  </div>
                </div>
              </a>
            </Button>
          )}
        </div>

        <div className="flex justify-end">
          {nextPage && (
            <Button
              variant="outline"
              size="lg"
              asChild
              className="group h-auto rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
            >
              <a
                href={`/mod/${modSlug}/${nextPage.slug}`}
                className="flex min-w-0 items-center space-x-3"
              >
                <div className="min-w-0 text-right">
                  <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Next
                  </div>
                  <div className="line-clamp-2 font-semibold break-words text-foreground group-hover:text-primary">
                    {nextPage.title}
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
