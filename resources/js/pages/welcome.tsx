import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import HytaleModdingLogo from '@/components/hytale-modding-logo';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';

export default function Welcome({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {
  const { auth } = usePage<SharedData>().props;

  return (
    <>
      <Head title="Welcome">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link
          href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
          rel="stylesheet"
        />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFC] p-6 text-[#1b1b18] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <HytaleModdingLogo variant="banner" size="lg" />
            <h1 className="text-4xl font-bold text-[#1b1b18] dark:text-[#EDEDEC]">
              Welcome to HytaleModding Wiki
            </h1>
            <p className="max-w-md text-xl text-[#706f6c] dark:text-[#A1A09A]">
              This page is under development
            </p>
          </div>

          <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 sm:flex-row">
            {auth.user ? (
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href={dashboard()}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild className="w-full sm:w-auto" size="lg">
                  <Link href={login()}>Log In</Link>
                </Button>
                {canRegister && (
                  <Button asChild className="w-full sm:w-auto" size="lg">
                    <Link href={register()}>Register</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="hidden h-14.5 lg:block"></div>
      </div>
    </>
  );
}
