import { Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, home, login, register } from '@/routes';
import publicRoutes from '@/routes/public';
import type { SharedData } from '@/types';
import HytaleModdingLogo from './hytale-modding-logo';
import ThemeToggle from './theme-toggle';
import { UserMenuContent } from './user-menu-content';

interface AppNavbarProps {
  brandHref?: string;
  canRegister?: boolean;
}

export default function AppNavbar({
  brandHref = home().url,
  canRegister = true,
}: AppNavbarProps) {
  const { auth } = usePage<SharedData>().props;

  return (
    <header className="wiki-global-nav sticky top-0 z-50 border-b border-border/80 bg-background/85 text-foreground backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href={brandHref}
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <HytaleModdingLogo variant="icon" size="md" />
            <span className="truncate text-[15px] font-semibold tracking-tight">
              HytaleModding <span className="text-muted-foreground">Wiki</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link
              href={publicRoutes.mods()}
              className="transition-colors hover:text-foreground"
            >
              Browse wikis
            </Link>
            <a
              href="https://hytalemodding.dev"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              HytaleModding <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {auth.user ? (
            <>
              {auth.user.is_admin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/dashboard/admin">
                    <ShieldCheck className="size-4" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href={dashboard()}>Dashboard</Link>
              </Button>
              <UserMenuContent />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={login()}>Log in</Link>
              </Button>
              {canRegister && (
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href={register()}>Create a wiki</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
