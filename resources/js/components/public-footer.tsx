import { Link } from '@inertiajs/react';
import HytaleModdingLogo from './hytale-modding-logo';

export default function PublicFooter() {
  return (
    <footer className="border-t border-border/80 bg-muted/25">
      <div className="container mx-auto max-w-[90rem] px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-0">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
            <p>© {new Date().getFullYear()} HytaleModding.</p>
            <div className="flex items-center space-x-4">
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Powered by</span>
            <HytaleModdingLogo variant="banner" size="sm" />
          </div>
        </div>
      </div>
    </footer>
  );
}
