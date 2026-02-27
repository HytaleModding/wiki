import { Link } from '@inertiajs/react';
import { Github, ExternalLink, HeartHandshake } from 'lucide-react';
import HytaleModdingLogo from './hytale-modding-logo';

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <HytaleModdingLogo variant="banner" size="lg" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The premier documentation platform for Hytale modding. Create,
              organize, and share your mod documentation with the community.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/mods"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  My Mods
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://hytalemodding.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  HytaleModding
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/hytalemodding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  Discord
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://opencollective.com/HytaleModding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <HeartHandshake />
                  Support Us / Donate
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/HytaleModding/wiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github />
                  GitHub
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} HytaleModding. Built with passion for
            the Hytale community.
          </p>
          <div className="mt-2 flex items-center space-x-4 sm:mt-0">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
