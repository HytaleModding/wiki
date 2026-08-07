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
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
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
      <CardContent className="space-y-2 pt-0">
        <p className="text-sm text-muted-foreground">{mod.description}</p>
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
