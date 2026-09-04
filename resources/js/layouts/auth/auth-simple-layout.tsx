import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import HytaleModdingLogo from '@/components/hytale-modding-logo';
import ThemeToggle from '@/components/theme-toggle';
import { home } from '@/routes';
import { privacy, terms } from '@/routes/legal';
import publicRoutes from '@/routes/public';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href={home()}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <HytaleModdingLogo variant="icon" size="md" />
            <span className="text-[15px] font-semibold tracking-tight">
              HytaleModding <span className="text-muted-foreground">Wiki</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href={publicRoutes.mods()}
              className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Browse wikis <ArrowUpRight className="size-3.5" />
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4">
              <Link
                href={home()}
                className="flex flex-col items-center gap-2 font-medium"
              >
                <HytaleModdingLogo variant="banner" size="lg" />
                <span className="sr-only">{title}</span>
              </Link>

              <div className="space-y-2 text-center">
                <h1 className="text-xl font-medium">{title}</h1>
                <p className="text-center text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} HytaleModding.</p>
          <div className="flex items-center gap-4">
            <Link
              href={terms()}
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href={privacy()}
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
