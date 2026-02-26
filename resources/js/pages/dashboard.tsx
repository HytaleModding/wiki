import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { BookOpen, Plus, Users, Eye } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

interface DashboardStats {
  ownedModsCount: number;
  collaborativeModsCount: number;
  totalPagesCount: number;
  publicViewsCount: number;
}

interface Props {
  stats: DashboardStats;
}

export default function Dashboard({ stats }: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your mod documentation and collaborate with others.
            </p>
          </div>
          <Button asChild size="lg">
            <a href="/mods/create" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Mod
            </a>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Mods</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ownedModsCount}</div>
              <p className="text-xs text-muted-foreground">
                Documentation spaces you own
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Collaborations
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.collaborativeModsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Mods where you collaborate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPagesCount}</div>
              <p className="text-xs text-muted-foreground">
                Documentation pages created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Public Views
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publicViewsCount}</div>
              <p className="text-xs text-muted-foreground">
                Views on public documentation
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with mod documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild className="justify-start">
                <a href="/mods/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Mod
                </a>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <a href="/mods">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse All Mods
                </a>
              </Button>
              <Button variant="outline" asChild className="justify-start">
                <a href="/docs">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Learn how to use the mod documentation platform
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xs font-medium text-blue-800">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Create a Mod</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up your documentation space with name, description, and
                    visibility settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xs font-medium text-blue-800">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Add Pages</h4>
                  <p className="text-sm text-muted-foreground">
                    Create documentation pages with our markdown editor and
                    organize them hierarchically.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xs font-medium text-blue-800">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Collaborate</h4>
                  <p className="text-sm text-muted-foreground">
                    Invite collaborators with different permission levels to
                    help build documentation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
