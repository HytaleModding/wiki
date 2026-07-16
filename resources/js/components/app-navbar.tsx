import { Link, usePage } from '@inertiajs/react';
import { Menu, Search, Settings, Github, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { home, login, register } from '@/routes';
import type { SharedData } from '@/types';
import { mainNavItems } from '@/utils/commonUtils';
import HytaleModdingLogo from './hytale-modding-logo';
import { UserMenuContent } from './user-menu-content';

interface AppNavbarProps {
  brandHref?: string;
}

export default function AppNavbar({ brandHref = home().url }: AppNavbarProps) {
  const { isCurrentUrl } = useCurrentUrl();
  const { auth } = usePage<SharedData>().props;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link
            href={brandHref}
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <HytaleModdingLogo variant="icon" size="md" />
            <span className="bg-clip-text text-xl font-semibold text-primary">
              HytaleModding
            </span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-end md:flex">
          <NavigationMenu>
            <NavigationMenuList className="flex space-x-1">
              {mainNavItems.map((item, index) => (
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
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-8 flex items-center gap-2 md:gap-4">
          {auth.user ? (
            <UserMenuContent />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={login()}>Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={register()}>Register</Link>
              </Button>
            </>
          )}

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
                  <div className="flex items-center space-x-2">
                    <HytaleModdingLogo variant="icon" size="md" />
                    <span className="bg-clip-text text-lg font-bold text-primary">
                      HytaleModding
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-6">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search documentation..."
                    className="pr-4 pl-10"
                  />
                </div>

                <div className="flex flex-col space-y-3">
                  {mainNavItems.map((item, index) => (
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
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <div className="flex flex-col space-y-2">
                    {auth.user ? (
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
                    ) : (
                      <>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="justify-start"
                        >
                          <Link
                            href={login()}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Log In
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="justify-start">
                          <Link
                            href={register()}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Register
                          </Link>
                        </Button>
                      </>
                    )}
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
