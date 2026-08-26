import type { ReactNode } from 'react';

interface DocsShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function DocsShell({ sidebar, children }: DocsShellProps) {
  return (
    <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-14">
      {sidebar}
      <main className="max-w-4xl min-w-0">{children}</main>
    </div>
  );
}
