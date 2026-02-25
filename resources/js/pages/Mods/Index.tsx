import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, BookOpenIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';
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
      <Head title="My Mods" />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Mods</h1>
            <p className="mt-2 text-gray-600">
              Manage your documentation spaces and collaborations
            </p>
          </div>
          <Button asChild>
            <a href="/mods/create">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Mod
            </a>
          </Button>
        </div>

        {/* Owned Mods */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Your Mods ({ownedMods.length})
          </h2>

          {ownedMods.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No mods yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first mod to start building documentation
                </p>
                <Button asChild>
                  <a href="/mods/create">Create Your First Mod</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedMods.map((mod) => (
                <Card key={mod.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        <a
                          href={`/mods/${mod.slug}`}
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
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {mod.pages_count} pages
                        </span>
                        <span className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Collaborative Mods ({collaborativeMods.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collaborativeMods.map((mod) => (
                <Card key={mod.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        <a
                          href={`/mods/${mod.slug}`}
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
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {mod.pages_count} pages
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
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
