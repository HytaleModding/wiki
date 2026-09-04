import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Check,
  FileText,
  GitBranch,
  Globe2,
  Moon,
  Palette,
  Sun,
  UsersRound,
} from 'lucide-react';
import HytaleModdingLogo from '@/components/hytale-modding-logo';
import SeoMeta from '@/components/SeoMeta';
import { Button } from '@/components/ui/button';
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, home, login, register } from '@/routes';
import mods from '@/routes/mods';
import publicRoutes from '@/routes/public';
import type { SharedData } from '@/types';

const features = [
  {
    title: 'A proper page editor',
    description:
      'Write guides, references, changelogs, or lore in Markdown and arrange them into navigation that makes sense.',
    icon: FileText,
  },
  {
    title: 'GitHub sync',
    description:
      'Prefer docs beside your code? Connect a repository and publish Markdown changes automatically when you push.',
    icon: GitBranch,
  },
  {
    title: 'Custom domains',
    description:
      'Use your HytaleModding URL or connect a custom domain when you want a completely branded home.',
    icon: Globe2,
  },
  {
    title: 'Team access',
    description:
      'Invite collaborators as viewers, editors, or admins and give people only the access they need.',
    icon: UsersRound,
  },
  {
    title: 'Your own look',
    description:
      'Add your mod icon and use custom CSS to make the public wiki feel like part of the project.',
    icon: Palette,
  },
  {
    title: 'API access',
    description:
      'Let approved tools and integrations read your published documentation through the API.',
    icon: Braces,
  },
];

function ThemeToggle() {
  const { resolvedAppearance, updateAppearance } = useAppearance();
  const isDark = resolvedAppearance === 'dark';

  return (
    <button
      type="button"
      onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent hover:text-foreground"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function WikiPreview() {
  return (
    <div className="wiki-product-preview mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="size-4" />
          <span>Orbitech Wiki</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Published
        </div>
      </div>

      <div className="grid min-h-80 md:grid-cols-[14rem_1fr]">
        <aside className="hidden border-r border-border bg-muted/25 p-4 text-sm md:block">
          <div className="mb-4 flex items-center justify-between px-2">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Pages
            </p>
            <span className="text-lg leading-none text-muted-foreground">
              +
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 rounded-md bg-accent px-2.5 py-2 text-foreground">
              <BookOpen className="size-4" />
              Getting started
            </div>
            {[
              'Installation',
              'Kinetic Systems',
              'Machines',
              'Shafts and Gears',
            ].map((page) => (
              <div
                key={page}
                className="flex items-center gap-2 px-2.5 py-2 text-muted-foreground"
              >
                <FileText className="size-4" />
                {page}
              </div>
            ))}
          </div>
        </aside>

        <div className="p-5 text-left sm:p-7 md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-5 text-xs text-muted-foreground">
            <span>Guides</span>
            <span>/</span>
            <span className="text-foreground">Getting started</span>
            <span className="ml-auto">Last saved just now</span>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Title
            </p>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium">
              Getting started
            </div>
            <p className="mt-5 mb-2 text-xs font-medium text-muted-foreground">
              Content
            </p>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex h-10 items-center gap-1 border-b border-border px-3 text-sm text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded font-semibold text-foreground">
                  B
                </span>
                <span className="flex size-7 items-center justify-center rounded font-serif text-foreground italic">
                  I
                </span>
                <span className="mx-1 h-4 w-px bg-border" />
                <span className="rounded px-2 py-1">Heading</span>
                <span className="rounded px-2 py-1">List</span>
                <span className="rounded px-2 py-1">Link</span>
              </div>
              <div className="min-h-64 p-6">
                <h3 className="text-2xl font-semibold tracking-tight">
                  Getting started
                </h3>
                <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                  Orbitech is an automation mod that combines kinetics, magics
                  and NPCs to automate your farm and buildings.
                </p>
                <h4 className="mt-8 border-b border-border pb-3 text-lg font-semibold">
                  Installation
                </h4>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Download the latest release and add it to your server&apos;s
                  mods folder. Restart the server, and start automating!
                </p>
                <p className="mt-7 flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
                  <Check className="size-3.5" /> All changes saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Welcome({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {
  const { auth } = usePage<SharedData>().props;
  const primaryHref = auth.user
    ? dashboard()
    : canRegister
      ? register()
      : login();
  const primaryLabel = auth.user ? 'Open dashboard' : 'Create a wiki';

  return (
    <>
      <SeoMeta
        title="Wiki"
        description="Build a polished wiki for your Hytale mod, organize it with ease, and make it feel like part of your project."
      />

      <div className="wiki-home min-h-screen overflow-hidden bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-8">
              <Link
                href={home()}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
              >
                <HytaleModdingLogo variant="icon" size="md" />
                <span className="text-[15px] font-semibold tracking-tight">
                  HytaleModding{' '}
                  <span className="text-muted-foreground">Wiki</span>
                </span>
              </Link>

              <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
                <Link
                  href={publicRoutes.mods()}
                  className="transition-colors hover:text-foreground"
                >
                  Browse wikis
                </Link>
                <a
                  href="https://hytalemodding.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  HytaleModding <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              {auth.user ? (
                <>
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href={dashboard()}>Dashboard</Link>
                  </Button>
                  <UserMenuContent />
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={login()}>Log in</Link>
                  </Button>
                  {canRegister && (
                    <Button asChild size="sm" className="hidden sm:inline-flex">
                      <Link href={register()}>Create a wiki</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </nav>
        </header>

        <main>
          <section className="wiki-hero relative px-5 pt-24 pb-12 text-center sm:px-8 sm:pt-32 lg:pt-40">
            <div className="wiki-grid pointer-events-none absolute inset-x-0 top-0 -z-0 h-[42rem] opacity-50" />
            <div className="relative z-10 mx-auto max-w-5xl">
              <h1 className="mx-auto max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.05em] sm:text-6xl lg:text-[5.25rem]">
                Build a wiki your mod is{' '}
                <span className="wiki-gradient-text">proud of.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Easy to create, simple to keep organized, and designed to look
                good from the first page. Give players one clear place for
                everything about your mod.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-5">
                  <Link href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 bg-background/50 px-5"
                >
                  <Link href={publicRoutes.mods()}>Browse public wikis</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="relative px-5 pt-8 pb-24 sm:px-8 sm:pt-12 sm:pb-32">
            <WikiPreview />
          </section>

          <section className="border-y border-border bg-card/35 px-5 py-24 sm:px-8 sm:py-32">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-muted-foreground">
                  More than a page editor
                </p>
                <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.035em] sm:text-5xl">
                  Everything your docs need.
                </h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Start simple, then use the features that fit the way your mod
                  team works.
                </p>
              </div>

              <div className="mt-14 grid border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ title, description, icon: Icon }, index) => (
                  <article
                    key={title}
                    className="min-h-64 border-r border-b border-border p-6 sm:p-7"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="size-5" />
                      <span className="font-mono text-xs text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-12 text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="px-5 py-24 sm:px-8 sm:py-32">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Give your mod a proper manual.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Start with one page, invite your team, and grow the wiki
                alongside the project.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-5">
                  <Link href={auth.user ? mods.create() : primaryHref}>
                    {auth.user ? 'Create a new wiki' : primaryLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 text-foreground">
              <HytaleModdingLogo variant="icon" size="sm" />
              <span className="font-medium">HytaleModding Wiki</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a
                href="https://discord.gg/hytalemodding"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Discord
              </a>
              <a
                href="https://github.com/HytaleModding/wiki"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
            </div>
            <p>© {new Date().getFullYear()} HytaleModding</p>
          </div>
        </footer>
      </div>
    </>
  );
}
