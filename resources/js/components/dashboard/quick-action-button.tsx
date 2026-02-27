import { Link } from '@inertiajs/react';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  variant?: 'default' | 'primary' | 'success';
}

const variantStyles = {
  default: {
    card: 'hover:bg-accent hover:border-accent',
    icon: 'bg-muted text-foreground group-hover:bg-accent',
  },
  primary: {
    card: 'hover:bg-primary/10 hover:border-primary/50',
    icon: 'bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110',
  },
  success: {
    card: 'hover:bg-green-500/10 hover:border-green-500/50',
    icon: 'bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500/20 group-hover:scale-110',
  },
};

export function QuickActionButton({
  icon: Icon,
  label,
  description,
  href,
  variant = 'default',
}: QuickActionButtonProps) {
  const styles = variantStyles[variant];

  return (
    <Link href={href}>
      <Card
        className={cn(
          'group relative overflow-hidden border-border/50 transition-all duration-300 ease-in-out',
          'cursor-pointer hover:scale-[1.02] hover:shadow-md',
          styles.card,
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-lg p-2.5 transition-all duration-300',
                styles.icon,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold transition-colors group-hover:text-primary">
                {label}
              </h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
