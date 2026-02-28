import { Head, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
  BookOpen,
  Plus,
  Users,
  FileText,
  FolderOpen,
  Settings,
  HelpCircle,
  TrendingUp,
  UserPlus,
  EyeIcon,
} from 'lucide-react';
import { useState } from 'react';
import { QuickActionButton } from '@/components/dashboard/quick-action-button';
import { StatCard } from '@/components/dashboard/stat-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, DashboardStats, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

interface Props {
  stats: DashboardStats;
}

export default function Dashboard({ stats }: Props) {
  const { auth } = usePage<SharedData>().props;
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Greetings';
    return 'Good evening';
  });

  const totalMods = stats.ownedModsCount + stats.collaborativeModsCount;
  const avgPagesPerMod =
    totalMods > 0 ? Math.round(stats.totalPagesCount / totalMods) : 0;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="space-y-8 pb-8">
        <div className="relative overflow-hidden rounded-sm border border-border/50 bg-linear-to-br from-primary/10 via-purple-500/5 to-pink-500/10 p-8 md:p-10">
          <div className="absolute inset-0 overflow-hidden">
            <div className="animate-blob absolute -top-4 -left-4 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl filter dark:mix-blend-normal" />
            <div className="animation-delay-2000 animate-blob absolute -top-4 -right-4 h-72 w-72 rounded-full bg-white/20 mix-blend-multiply blur-3xl filter dark:mix-blend-normal" />
            <div className="animation-delay-4000 animate-blob absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-primary/20 mix-blend-multiply blur-3xl filter dark:mix-blend-normal" />
          </div>

          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {greeting}
              </span>
              <span className="text-sm">{auth.user.name}</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back to your workspace
            </h1>
            <p className="mb-6 max-w-2xl text-lg text-muted-foreground">
              Manage your mods, collaborate with your team, and create
              documentation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/mods/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-primary/50 bg-primary/40 transition-all duration-300 hover:bg-primary hover:text-background"
                >
                  <Plus className="h-4 w-4" />
                  Create New Mod
                </Button>
              </Link>
              <Link href="/dashboard/mods">
                <Button size="lg" variant="ghost" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Browse Your Mods
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Mods"
            value={totalMods ?? 0}
            icon={FolderOpen}
            variant="white"
            delay={0}
          />
          <StatCard
            title="Documentation Pages"
            value={stats.totalPagesCount ?? 0}
            icon={FileText}
            variant="white"
            delay={100}
          />
          <StatCard
            title="Collaborators"
            value={stats.collaborativeModsCount ?? 0}
            icon={Users}
            variant="white"
            delay={200}
          />
          <StatCard
            title="Public Views"
            value={stats.publicViewsCount ?? 0}
            icon={EyeIcon}
            variant="white"
            delay={300}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Your latest mods and documentation updates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="mods" className="w-full">
                  <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="mods" className="gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Mods
                    </TabsTrigger>
                    <TabsTrigger value="pages" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Pages
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mods" className="mt-0 space-y-3">
                    {stats.recentMods?.length > 0 ? (
                      stats.recentMods.map((mod) => (
                        // TODO: Create RecentModCard component and replace this with <RecentModCard key={mod.id} mod={mod} />
                        <div
                          key={mod.id}
                          className="rounded-md border border-border/50 p-4 transition-colors hover:bg-accent"
                        >
                          <h3 className="text-lg font-semibold">{mod.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {mod.description || 'No description provided'}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {mod.pages_count}{' '}
                              {mod.pages_count === 1 ? 'page' : 'pages'}
                            </span>
                            <span>
                              {mod.collaborators_count}{' '}
                              {mod.collaborators_count === 1
                                ? 'collaborator'
                                : 'collaborators'}
                            </span>
                            <span>
                              Last updated:{' '}
                              {new Date(mod.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No mods yet
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Get started by creating your first mod
                        </p>
                        <Link href="/dashboard/mods/create">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Mod
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pages" className="mt-0 space-y-3">
                    <div className="py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mb-2 text-lg font-semibold">
                        No documentation pages yet
                      </h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {(totalMods ?? 0) > 0
                          ? 'Start documenting your mods'
                          : 'Create a mod first, then add documentation pages'}
                      </p>
                      {(totalMods ?? 0) > 0 && (
                        <Link href="/dashboard/mods">
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Documentation
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar - Takes 1 column */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickActionButton
                  icon={Plus}
                  label="New Mod"
                  description="Start a new project"
                  href="/dashboard/mods/create"
                  variant="primary"
                />
                <QuickActionButton
                  icon={UserPlus}
                  label="Invite Collaborator"
                  description="Add team members"
                  href={
                    (totalMods ?? 0) > 0
                      ? '/dashboard/mods'
                      : '/dashboard/mods/create'
                  }
                  variant="success"
                />
                <QuickActionButton
                  icon={FolderOpen}
                  label="Browse Mods"
                  description="View all projects"
                  href="/dashboard/mods"
                />
                <QuickActionButton
                  icon={BookOpen}
                  label="Documentation"
                  description="Read the docs"
                  href="/docs"
                />
                <QuickActionButton
                  icon={Settings}
                  label="Settings"
                  description="Manage your account"
                  href="/settings/profile"
                />
                <QuickActionButton
                  icon={HelpCircle}
                  label="Help & Support"
                  description="Get assistance"
                  href="/help"
                />
              </CardContent>
            </Card>

            {/* Stats Summary Card */}
            <Card className="border-border/50 bg-linear-to-br from-primary/5 to-purple-500/5">
              <CardHeader>
                <CardTitle className="text-base">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Owned Mods</span>
                  <span className="font-semibold">
                    {stats?.ownedModsCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Collaborative Mods
                  </span>
                  <span className="font-semibold">
                    {stats?.collaborativeModsCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pages per Mod</span>
                  <span className="font-semibold">{avgPagesPerMod}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
