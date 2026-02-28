import {
  PlusIcon,
  BookOpenIcon,
  UsersIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import AppLayout from '@/layouts/app-layout';

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  pages_count: number;
  collaborators_count: number;
  updated_at: string;
}

interface Props {
  ownedMods: Mod[];
  collaborativeMods: Mod[];
}

export default function ModsIndex({ ownedMods, collaborativeMods }: Props) {
  useFlashMessages();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-red-100 text-red-800';
      case 'unlisted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <Head title="Your Mods" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Mods</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your mod documentation and collaborate with others.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
            <a href="/dashboard/mods/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Mod
            </a>
          </Button>
        </div>

        {/* Owned Mods */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Your Mods ({ownedMods.length})
          </h2>

          {ownedMods.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No mods yet
                </h3>
                <p className="mb-4 text-gray-600">
                  Create your first mod to start building documentation
                </p>
                <Button asChild>
                  <a href="/dashboard/mods/create">Create Your First Mod</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ownedMods.map((mod) => (
                <Card
                  key={mod.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        <a
                          href={`/dashboard/mods/${mod.slug}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mod.name}
                        </a>
                      </CardTitle>
                      <Badge
                        className={`text-xs ${getVisibilityColor(mod.visibility)}`}
                      >
                        {mod.visibility}
                      </Badge>
                    </div>
                    <CardDescription>{mod.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <BookOpenIcon className="mr-1 h-4 w-4" />
                          {mod.pages_count} pages
                        </span>
                        <span className="flex items-center">
                          <UsersIcon className="mr-1 h-4 w-4" />
                          {mod.collaborators_count} collaborators
                        </span>
                      </div>
                      <span>Updated {formatDate(mod.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Collaborative Mods */}
        {collaborativeMods.length > 0 && (
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">
              Collaborative Mods ({collaborativeMods.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collaborativeMods.map((mod) => (
                <Card
                  key={mod.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        <a
                          href={`/dashboard/mods/${mod.slug}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mod.name}
                        </a>
                      </CardTitle>
                      <Badge
                        className={`text-xs ${getVisibilityColor(mod.visibility)}`}
                      >
                        {mod.visibility}
                      </Badge>
                    </div>
                    <CardDescription>{mod.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <BookOpenIcon className="mr-1 h-4 w-4" />
                          {mod.pages_count} pages
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="mr-1 h-4 w-4" />
                          Collaborator
                        </span>
                      </div>
                      <span>Updated {formatDate(mod.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
