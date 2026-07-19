import type { ReactNode } from 'react';

interface DocsShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function DocsShell({ sidebar, children }: DocsShellProps) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
      {sidebar}
      <main className="min-w-0 lg:col-span-8 xl:col-span-9">{children}</main>
    </div>
  );
}
