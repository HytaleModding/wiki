import { Link, usePage } from '@inertiajs/react';
import { Menu, Settings, ExternalLink, BookOpenIcon } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { UserMenuContent } from './user-menu-content';

interface ModNavbarProps {
  modName: string;
  modSlug: string;
  modIconUrl?: string;
}

interface ModIconProps {
  size?: string;
  modName: string;
  modIconUrl?: string;
}

function ModIcon({ size = 'h-8 w-8', modName, modIconUrl }: ModIconProps) {
  if (modIconUrl) {
    return (
      <img
        src={modIconUrl}
        alt={`${modName} icon`}
        className={cn(size, 'rounded-lg object-cover')}
      />
    );
  }
  return <BookOpenIcon className={cn(size, 'text-primary')} />;
}

export default function ModNavbar({
  modName,
  modSlug,
  modIconUrl,
}: ModNavbarProps) {
  const { isCurrentUrl } = useCurrentUrl();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { auth } = usePage<SharedData>().props;

  const navItems = [
    {
      title: 'Documentation',
      href: `/mod/${modSlug}`,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link
            href={`/mod/${modSlug}`}
            className="flex items-center space-x-3 transition-opacity hover:opacity-80"
          >
            <ModIcon size="h-8 w-8" modName={modName} modIconUrl={modIconUrl} />
            <span className="bg-clip-text text-xl font-semibold text-primary">
              {modName}
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-end md:flex">
          <NavigationMenu>
            <NavigationMenuList className="flex space-x-1">
              {navItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isCurrentUrl(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <span>{item.title}</span>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-8 flex items-center space-x-4">
          {auth.user && <UserMenuContent />}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <div className="flex items-center space-x-3">
                    <ModIcon
                      size="h-8 w-8"
                      modName={modName}
                      modIconUrl={modIconUrl}
                    />
                    <span className="bg-clip-text text-lg font-bold text-primary">
                      {modName}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-6">
                <div className="flex flex-col space-y-3">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isCurrentUrl(item.href)
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>

                {auth.user && (
                  <div className="border-t pt-6">
                    <div className="flex flex-col space-y-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                      >
                        <Link
                          href="/settings/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                      >
                        <a
                          href="https://github.com/HytaleModding"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          GitHub
                          <ExternalLink className="ml-auto h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
