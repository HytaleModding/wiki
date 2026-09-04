import { Head, Link, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  FileText,
  FolderOpen,
  Globe2,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard-layout';
import type { DashboardStats, ModInfo, PageInfo, SharedData } from '@/types';

interface Props {
  stats: DashboardStats;
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function Dashboard({ stats }: Props) {
  const totalWikis = stats.ownedModsCount + stats.collaborativeModsCount;

  return (
    <DashboardLayout editorial>
      <Head title="Dashboard" />

      <div className="dashboard-home relative isolate overflow-hidden">
        <div className="dashboard-home-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-80" />

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <DashboardHeader />
          <Stats stats={stats} totalWikis={totalWikis} />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
            <RecentWikis stats={stats} />
            <QuickActions
              ownedWikis={stats.ownedModsCount}
              sharedWikis={stats.collaborativeModsCount}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DashboardHeader() {
  const { auth } = usePage<SharedData>().props;
  const [greeting] = useState(() => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  return (
    <header className="flex flex-col gap-7 border-b pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {greeting}, {auth.user.name}
        </p>
        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
          Your wikis, all in one place.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Continue writing, manage your projects, and keep every page moving.
        </p>
      </div>

      <Button asChild size="lg" className="shrink-0 rounded-full px-6">
        <Link href="/dashboard/mods/create">
          <Plus className="size-4" />
          New wiki
        </Link>
      </Button>
    </header>
  );
}

function Stats({
  stats,
  totalWikis,
}: {
  stats: DashboardStats;
  totalWikis: number;
}) {
  const items = [
    {
      label: 'Wikis',
      value: totalWikis,
      detail: `${stats.ownedModsCount} owned, ${stats.collaborativeModsCount} shared`,
      icon: FolderOpen,
    },
    {
      label: 'Pages',
      value: stats.totalPagesCount,
      detail: 'Across your workspace',
      icon: FileText,
    },
    {
      label: 'Public views',
      value: stats.publicViewsCount,
      detail: 'Across published pages',
      icon: Eye,
    },
  ];

  return (
    <section
      aria-label="Workspace overview"
      className="mt-8 grid overflow-hidden rounded-2xl border bg-card/80 shadow-sm backdrop-blur sm:grid-cols-3"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="flex items-start gap-4 border-b p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:p-6 sm:last:border-r-0"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background">
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {item.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function RecentWikis({ stats }: { stats: DashboardStats }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Recent work
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Pick up where you left off
          </h2>
        </div>
        <Link
          href="/dashboard/mods"
          className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {stats.latestMods?.length > 0 ? (
        <div className="space-y-3">
          {stats.latestMods.map((mod) => (
            <RecentWikiCard key={mod.slug} mod={mod} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <Link
        href="/dashboard/mods"
        className="mt-5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:hidden"
      >
        View all wikis
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}

function RecentWikiCard({ mod }: { mod: ModInfo }) {
  const [expanded, setExpanded] = useState(false);
  const hasRecentPages = mod.latest_pages.length > 0;

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/20">
      <Link
        href={`/dashboard/mods/${mod.slug}`}
        className="flex items-start gap-4 p-5 sm:items-center sm:p-6"
      >
        <WikiIcon mod={mod} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold tracking-tight">
              {mod.name}
            </h3>
            <ArrowRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {mod.description || 'No description added yet.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              {mod.pages_count} {mod.pages_count === 1 ? 'page' : 'pages'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {mod.collaborators_count}{' '}
              {mod.collaborators_count === 1 ? 'collaborator' : 'collaborators'}
            </span>
            <time
              className="sm:ml-auto"
              dateTime={new Date(mod.updated_at).toISOString()}
              title={new Date(mod.updated_at).toLocaleString()}
            >
              Updated {formatDate(mod.updated_at)}
            </time>
          </div>
        </div>
      </Link>

      {hasRecentPages && (
        <div className="border-t">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-5 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-6"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
            {expanded ? 'Hide recent pages' : 'Show recent pages'}
            <span className="ml-auto font-mono">{mod.latest_pages.length}</span>
          </button>

          <div
            className="grid transition-[grid-template-rows] duration-200 ease-out"
            style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="border-t bg-muted/30 px-5 py-2 sm:px-6">
                {mod.latest_pages.map((page) => (
                  <RecentPage key={page.slug} page={page} modSlug={mod.slug} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function WikiIcon({ mod }: { mod: ModInfo }) {
  if (mod.icon_url) {
    return (
      <img
        src={mod.icon_url}
        alt=""
        className="size-12 shrink-0 rounded-xl border bg-muted object-cover sm:size-14"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-lg font-semibold uppercase sm:size-14">
      {mod.name.charAt(0)}
    </div>
  );
}

function RecentPage({ page, modSlug }: { page: PageInfo; modSlug: string }) {
  return (
    <Link
      href={`/dashboard/mods/${modSlug}/pages/${page.slug}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-background"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-medium">{page.title}</span>
      <time
        className="shrink-0 text-xs text-muted-foreground"
        dateTime={new Date(page.updated_at).toISOString()}
        title={new Date(page.updated_at).toLocaleString()}
      >
        {formatDate(page.updated_at)}
      </time>
      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function QuickActions({
  ownedWikis,
  sharedWikis,
}: {
  ownedWikis: number;
  sharedWikis: number;
}) {
  const actions = [
    {
      label: 'Create a wiki',
      detail: 'Start a new project',
      href: '/dashboard/mods/create',
      icon: Plus,
    },
    {
      label: 'All wikis',
      detail: 'Manage every project',
      href: '/dashboard/mods',
      icon: FolderOpen,
    },
    {
      label: 'Public wikis',
      detail: 'Explore the community',
      href: '/mods',
      icon: Globe2,
    },
    {
      label: 'Settings',
      detail: 'Profile and preferences',
      href: '/settings/profile',
      icon: Settings,
    },
  ];

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        Shortcuts
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        Get something done
      </h2>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-card">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="group/action flex items-center gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-accent"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {action.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {action.detail}
                </span>
              </span>
              <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/action:translate-x-0 group-hover/action:opacity-100" />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Your workspace</p>
        <p className="mt-1 leading-6 text-muted-foreground">
          {ownedWikis} owned {ownedWikis === 1 ? 'wiki' : 'wikis'} and{' '}
          {sharedWikis} shared with you.
        </p>
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-background">
        <FolderOpen className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Create your first wiki</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Give your mod a polished home for guides, references, and updates.
      </p>
      <Button asChild className="mt-6 rounded-full px-5">
        <Link href="/dashboard/mods/create">
          <Plus className="size-4" />
          New wiki
        </Link>
      </Button>
    </div>
  );
}
