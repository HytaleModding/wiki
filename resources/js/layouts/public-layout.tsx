import { BookOpen } from 'lucide-react';
import { useEffect } from 'react';
import { Toaster } from 'sileo';

import AppNavbar from '@/components/app-navbar';
import PublicFooter from '@/components/public-footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  modName?: string;
  modSlug?: string;
  modIconUrl?: string;
  modDescription?: string;
  ownerName?: string;
  customCss?: string | null;
}

export default function PublicLayout({
  children,
  modName,
  modSlug,
  modIconUrl,
  modDescription,
  ownerName,
  customCss,
}: PublicLayoutProps) {
  useEffect(() => {
    const styleId = 'mod-custom-css';
    const existing = document.getElementById(styleId);

    if (!customCss) {
      existing?.remove();

      return;
    }

    const styleEl =
      existing instanceof HTMLStyleElement
        ? existing
        : document.createElement('style');

    styleEl.id = styleId;
    styleEl.textContent = customCss;

    if (!styleEl.parentNode) {
      document.head.appendChild(styleEl);
    }

    return () => {
      styleEl.remove();
    };
  }, [customCss, modSlug]);

  return (
    <div className="public-docs flex min-h-screen flex-col bg-background">
      <AppNavbar brandHref="/" />

      {modName && modSlug && (
        <section className="border-b border-border/70 bg-[radial-gradient(circle_at_85%_0%,color-mix(in_oklab,var(--color-primary)_15%,transparent),transparent_28rem)]">
          <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <div className="flex max-w-3xl items-start gap-5">
              {modIconUrl ? (
                <img
                  src={modIconUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl border border-border/70 object-cover shadow-sm sm:h-16 sm:w-16"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:h-16 sm:w-16">
                  <BookOpen className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {modName}
                </h1>
                {modDescription && (
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    {modDescription}
                  </p>
                )}
                {ownerName && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Maintained by{' '}
                    <span className="font-medium text-foreground">
                      {ownerName}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <PublicFooter />
      <Toaster theme="light" position="top-right" />
    </div>
  );
}
