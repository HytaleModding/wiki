import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import type { SharedData } from '@/types';
import { dashboard } from '@/routes';
import { index as modsIndex } from '@/routes/mods';

export function UserMenuContent() {
  const { auth } = usePage<SharedData>().props;
  const getInitials = useInitials();

  return (
    <>
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
            <div className="flex flex-col truncate">
              <p className="truncate text-start text-sm font-medium">
                {auth.user?.name}
              </p>
              <p className="truncate text-start text-xs text-muted-foreground">
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
            <Link
              href="/logout"
              method="post"
              className="flex w-full items-center text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
