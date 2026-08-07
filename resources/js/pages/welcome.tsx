import { Link, usePage } from '@inertiajs/react';
import {
  ArrowRight,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import AppFooter from '@/components/app-footer';
import HytaleModdingLogo from '@/components/hytale-modding-logo';
import SeoMeta from '@/components/SeoMeta';
import { Button } from '@/components/ui/button';
import { UserMenuContent } from '@/components/user-menu-content';
import type { SharedData } from '@/types';
import { dashboard, home, login, register } from '@/routes';
import mods from '@/routes/mods';
import publicRoutes from '@/routes/public';

const workflowSteps: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Create a mod workspace',
    description: 'Set up your project and define who can contribute.',
    icon: Rocket,
  },
  {
    title: 'Write and structure pages',
    description: 'Document systems, commands, setup, and gameplay loops.',
    icon: Sparkles,
  },
  {
    title: 'Publish with confidence',
    description:
      'Share polished docs that are easy for your community to navigate.',
    icon: ShieldCheck,
  },
];

export default function Welcome({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {
  const { auth } = usePage<SharedData>().props;

  return (
    <>
      <SeoMeta
        title="Welcome"
        description="Create mod wikis, publish polished guides, and share one source of truth for your Hytale community."
      />

      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <nav className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-8">
            <Link
              href={home()}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <HytaleModdingLogo variant="icon" size="md" />
              <span className="text-lg font-semibold tracking-tight">
                HytaleModding
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {auth.user ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href={dashboard()}>Dashboard</Link>
                  </Button>
                  <UserMenuContent />
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={login()}>Log In</Link>
                  </Button>
                  {canRegister && (
                    <Button asChild size="sm">
                      <Link href={register()}>Register</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="absolute inset-0 z-0 h-96 overflow-hidden bg-linear-to-br from-primary/10 via-purple-500/5 to-pink-500/10 mask-[linear-gradient(to_bottom,black_50%,transparent_100%)]">
          <div className="animate-blob absolute -top-4 -left-4 h-72 w-72 rounded-full bg-purple-500/15 mix-blend-multiply blur-3xl filter dark:mix-blend-normal" />
          <div className="animation-delay-2000 animate-blob absolute top-0 right-0 h-72 w-72 rounded-full bg-white/10 mix-blend-multiply blur-3xl filter dark:mix-blend-normal" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-10 md:px-8 md:py-14">
          <section className="flex flex-col items-start gap-6 pt-4 md:max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Documentation that feels as polished as your mod
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
                Your home for Hytale mod documentation
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
                Create mod wikis, ship clearer guides, and keep your whole team
                aligned in one focused workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {auth.user ? (
                <>
                  <Button asChild size="lg">
                    <Link href={dashboard()}>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href={publicRoutes.mods()}>Browse Mods</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href={login()}>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href={publicRoutes.mods()}>Browse Mods</Link>
                  </Button>
                </>
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-primary/15 via-card to-card p-6 md:col-span-2 md:p-8">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-transform duration-300 group-hover:scale-110" />
              <div className="relative space-y-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-primary/80 uppercase">
                  Built for release-ready docs
                </p>
                <h2 className="max-w-lg text-2xl font-semibold tracking-tight md:text-3xl">
                  Turn scattered notes into clear docs your players can trust
                </h2>
                <p className="max-w-xl text-muted-foreground">
                  Organize setup, systems, changelogs, and contributor context
                  so updates are easier to ship and easier to understand.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/75 p-6 backdrop-blur">
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Collaboration
              </p>
              <h3 className="text-lg font-semibold">Fewer docs bottlenecks</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Share ownership with contributors so pages stay current as
                features evolve.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/75 p-6 backdrop-blur md:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Built-in structure
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    Spaces for guides, APIs, and changelogs from day one
                  </h3>
                </div>
                <Link
                  href={publicRoutes.mods()}
                  className="inline-flex items-center text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  Explore existing mods
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Workflow
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                From Idea to Publishing
              </h2>
            </div>

            <div className="relative grid gap-6 md:grid-cols-3 md:gap-8 md:pt-8">
              <div className="pointer-events-none absolute top-0 left-0 hidden h-px w-full bg-border/70 md:block" />
              {workflowSteps.map(
                ({ title, description, icon: Icon }, index) => (
                  <div key={title} className="relative space-y-3 md:pt-2">
                    <div className="inline-flex items-center gap-3">
                      <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-linear-to-r from-card/80 via-card/70 to-card/80 p-6 shadow-[0_20px_60px_-40px_rgba(168,85,247,0.65)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Ready to build your wiki?
                </h2>
                <p className="text-muted-foreground">
                  Start a mod workspace, add your first pages, and share a
                  single source of truth with your contributors and players.
                </p>
              </div>

              {auth.user ? (
                <Button asChild size="lg">
                  <Link href={mods.create()}>
                    Create a New Mod
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href={login()}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
      <AppFooter />
    </>
  );
}
