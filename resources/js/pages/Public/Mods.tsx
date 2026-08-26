import { BookOpenIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import SeoMeta from '@/components/SeoMeta';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: number;
  name: string;
  username: string;
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  visibility: 'public';
  owner: User;
  published_pages_count: number;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedMods {
  data: Mod[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginationLink[];
}

interface Props {
  mods: PaginatedMods;
  query: string;
}

export default function PublicMods({ mods, query }: Props) {
  const [search, setSearch] = useState(query ?? '');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.get('/mods', search ? { q: search } : {}, {
      preserveState: true,
      replace: true,
    });
  }

  const description = query
    ? `Browse ${mods.total} Hytale mod wikis matching "${query}".`
    : 'Explore publicly available Hytale mod wikis from the community.';

  return (
    <>
      <SeoMeta title="Browse Mods" description={description} />

      <div className="public-docs flex min-h-screen flex-col bg-background text-foreground">
        <AppNavbar brandHref="/" publicMode />

        <main className="mx-auto w-full max-w-[90rem] flex-1 px-5 py-10 sm:px-8 sm:py-16">
          <div className="relative mb-14 border-b border-border/70 pb-12 sm:pb-16">
            <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative max-w-2xl space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Community knowledge base
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Find a mod wiki
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Guides, references, and everything players need to get the most
                out of their mods.
              </p>

              <form
                onSubmit={handleSearch}
                className="flex max-w-xl gap-2 pt-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search mods…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 border-border/80 bg-background/80 pl-10 shadow-sm"
                  />
                </div>
                <Button type="submit" className="h-11 px-5">
                  Search
                </Button>
              </form>
            </div>
          </div>

          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
                Directory
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {query ? 'Search results' : 'Explore community mods'}
              </h2>
            </div>
            {query && (
              <p className="text-sm text-muted-foreground">
                {mods.total} result{mods.total !== 1 ? 's' : ''} for &ldquo;
                {query}&rdquo;
              </p>
            )}
          </div>

          {mods.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookOpenIcon className="mb-4 h-14 w-14 text-muted-foreground/50" />
              <h2 className="mb-2 text-lg font-semibold">No mods found</h2>
              <p className="text-muted-foreground">
                {query
                  ? 'Try a different search term.'
                  : 'No public mods have been created yet.'}
              </p>
              {query && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => {
                    setSearch('');
                    router.get('/mods', {}, { replace: true });
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
              {mods.data.map((mod) => (
                <ModCard key={mod.id} mod={mod} />
              ))}
            </div>
          )}

          {mods.last_page > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-1">
              {mods.links.map((link, i) => (
                <Button
                  key={i}
                  variant={link.active ? 'default' : 'ghost'}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => link.url && router.get(link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  className="min-w-9"
                />
              ))}
            </div>
          )}
        </main>

        <AppFooter />
      </div>
    </>
  );
}

function ModCard({ mod }: { mod: Mod }) {
  return (
    <Link
      href={`/mod/${mod.slug}`}
      className="group flex min-h-44 flex-col border-t border-border/70 py-5 transition-colors hover:border-primary"
    >
      <div className="flex items-center gap-3">
        {mod.icon_url ? (
          <Avatar className="h-9 w-9 rounded-md">
            <AvatarImage
              src={mod.icon_url}
              alt={mod.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-md text-sm font-semibold">
              {mod.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
            {mod.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-tight font-semibold group-hover:text-primary">
            {mod.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            by {mod.owner.name}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <p className="line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
          {mod.description ?? 'No description provided.'}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpenIcon className="h-3.5 w-3.5" />
            {mod.published_pages_count}{' '}
            {mod.published_pages_count === 1 ? 'page' : 'pages'}
          </span>
          <span className="flex items-center gap-1">
            View wiki
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
