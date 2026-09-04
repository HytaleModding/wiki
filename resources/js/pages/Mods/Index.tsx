import { Head, Link } from '@inertiajs/react';
import {
  ArrowRight,
  Eye,
  FileText,
  FolderOpen,
  Lock,
  Plus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/commonUtils';

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url?: string;
  visibility: 'public' | 'private' | 'unlisted';
  pages_count: number;
  collaborators_count: number;
  updated_at: string;
}

interface Props {
  ownedMods: Mod[];
  collaborativeMods: Mod[];
}

const visibilityDetails = {
  public: {
    label: 'Public',
    icon: Eye,
    className:
      'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  },
  unlisted: {
    label: 'Unlisted',
    icon: Eye,
    className:
      'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300',
  },
  private: {
    label: 'Private',
    icon: Lock,
    className: 'border-border bg-muted/70 text-muted-foreground',
  },
};

export default function ModsIndex({ ownedMods, collaborativeMods }: Props) {
  useFlashMessages();

  const totalWikis = ownedMods.length + collaborativeMods.length;

  return (
    <AppLayout editorial>
      <Head title="Your Wikis" />

      <div className="py-4 sm:py-8">
        <header className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Your wikis
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              Open a wiki to write pages, manage collaborators, or adjust how it
              is published.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {totalWikis} {totalWikis === 1 ? 'wiki' : 'wikis'}
              </span>
              <span aria-hidden="true"> · </span>
              {ownedMods.length} owned
              <span aria-hidden="true"> · </span>
              {collaborativeMods.length} shared
            </p>
          </div>

          <Button asChild size="lg" className="shrink-0 rounded-full px-6">
            <Link href="/dashboard/mods/create">
              <Plus className="size-4" />
              New wiki
            </Link>
          </Button>
        </header>

        <div className="mt-10 space-y-12">
          <WikiSection
            eyebrow="Owned by you"
            title="Your projects"
            description="Wikis you created and manage."
            mods={ownedMods}
            emptyState
          />

          {collaborativeMods.length > 0 && (
            <WikiSection
              eyebrow="Shared with you"
              title="Collaborative wikis"
              description="Projects where you work alongside another creator."
              mods={collaborativeMods}
              collaborative
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function WikiSection({
  eyebrow,
  title,
  description,
  mods,
  collaborative = false,
  emptyState = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  mods: Mod[];
  collaborative?: boolean;
  emptyState?: boolean;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <span className="rounded-full border bg-muted/50 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {mods.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {mods.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mods.map((mod) => (
            <WikiCard key={mod.id} mod={mod} collaborative={collaborative} />
          ))}
        </div>
      ) : (
        emptyState && <EmptyState />
      )}
    </section>
  );
}

function WikiCard({
  mod,
  collaborative,
}: {
  mod: Mod;
  collaborative: boolean;
}) {
  const visibility = visibilityDetails[mod.visibility];
  const VisibilityIcon = visibility.icon;

  return (
    <Card className="group overflow-hidden rounded-2xl py-0 transition-colors hover:border-foreground/20">
      <Link
        href={`/dashboard/mods/${mod.slug}`}
        className="flex h-full flex-col p-5 sm:p-6"
      >
        <div className="flex items-start gap-4">
          <WikiIcon mod={mod} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-lg leading-6 font-semibold tracking-tight">
                {mod.name}
              </h3>
              <ArrowRight className="mt-1 size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </div>
            <Badge
              variant="outline"
              className={cn('mt-2 gap-1.5 rounded-full', visibility.className)}
            >
              <VisibilityIcon className="size-3" />
              {visibility.label}
            </Badge>
          </div>
        </div>

        <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {mod.description || 'No description added yet.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 border-y py-4 text-sm">
          <div>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="size-4" />
              Pages
            </span>
            <p className="mt-1 font-mono font-semibold">
              {mod.pages_count.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" />
              {collaborative ? 'Team' : 'Collaborators'}
            </span>
            <p className="mt-1 font-mono font-semibold">
              {collaborative
                ? 'Shared'
                : mod.collaborators_count.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Updated {formatDate(mod.updated_at)}</span>
          <span className="font-medium text-foreground">Open wiki</span>
        </div>
      </Link>
    </Card>
  );
}

function WikiIcon({ mod }: { mod: Mod }) {
  if (mod.icon_url) {
    return (
      <img
        src={mod.icon_url}
        alt=""
        className="size-12 shrink-0 rounded-xl border bg-muted object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-lg font-semibold uppercase">
      {mod.name.charAt(0)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-background">
        <FolderOpen className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">No wikis yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Create a wiki and start shaping the documentation for your mod.
      </p>
      <Button asChild className="mt-6 rounded-full px-5">
        <Link href="/dashboard/mods/create">
          <Plus className="size-4" />
          Create your first wiki
        </Link>
      </Button>
    </div>
  );
}
