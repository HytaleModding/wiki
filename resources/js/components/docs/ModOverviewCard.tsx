import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DocMod } from '@/types/docs';

interface ModOverviewCardProps {
  mod: DocMod;
  /** When true, the title becomes a link back to the mod's overview page (used on page.tsx). */
  linkTitle?: boolean;
  showAvatar?: boolean;
}

export default function ModOverviewCard({
  mod,
  linkTitle = false,
  showAvatar = true,
}: ModOverviewCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-border/70 bg-card shadow-none">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base">
          {linkTitle ? (
            <a
              href={`/mod/${mod.slug}`}
              className="transition-colors hover:text-primary"
            >
              {mod.name}
            </a>
          ) : (
            'About'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <p className="text-sm leading-6 text-muted-foreground">{mod.description}</p>
        <div className="flex items-center space-x-2">
          {showAvatar && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {mod.owner.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-sm text-muted-foreground">
            by {mod.owner.name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
