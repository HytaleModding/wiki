import { Link, usePage } from '@inertiajs/react';
import {
  BookOpen,
  LayoutGrid,
  Menu,
  Search,
  Settings,
  LogOut,
  Github,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as modsIndex } from '@/routes/mods';
import type { SharedData } from '@/types';
import { mainNavItems } from '@/utils/navigation-items';
import HytaleModdingLogo from './hytale-modding-logo';

export default function AppNavbar() {
  const { isCurrentUrl } = useCurrentUrl();
  const { auth } = usePage<SharedData>().props;
  const getInitials = useInitials();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link
            href={dashboard().url}
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <HytaleModdingLogo variant="icon" size="md" />
            <span className="bg-clip-text text-xl font-bold text-white">
              HytaleModding
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
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

        {/* Actions */}
        <div className="ml-8 flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={auth.user?.avatar ?? ''}
                    alt={auth.user?.name ?? ''}
                  />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-xs text-white">
                    {getInitials(auth.user?.name ?? '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={auth.user?.avatar ?? ''}
                    alt={auth.user?.name ?? ''}
                  />
                  <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-xs text-white">
                    {getInitials(auth.user?.name ?? '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{auth.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {auth.user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={dashboard().url} className="flex items-center">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={modsIndex().url} className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  My Mods
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/HytaleModding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                  <ExternalLink className="ml-auto h-3 w-3" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/logout"
                  method="post"
                  className="flex items-center text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
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
                    <span className="bg-clip-text text-lg font-bold text-white">
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

                {/* Mobile Navigation */}
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
