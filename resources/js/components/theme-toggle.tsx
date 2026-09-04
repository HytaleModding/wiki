import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export default function ThemeToggle() {
  const { resolvedAppearance, updateAppearance } = useAppearance();
  const isDark = resolvedAppearance === 'dark';

  return (
    <button
      type="button"
      onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
