import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { type ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';

import SeoMeta from './components/SeoMeta';

const appName = import.meta.env.VITE_APP_NAME || 'HytaleModding Wiki';

type ResolvedPageModule = {
  default: {
    layout?: (page: ReactNode) => ReactNode;
  };
};

function shouldNoIndex(componentName: string): boolean {
  return (
    componentName.startsWith('auth/') ||
    componentName.startsWith('dashboard') ||
    componentName.startsWith('Invitations/') ||
    componentName.startsWith('Mods/') ||
    componentName.startsWith('Pages/') ||
    componentName.startsWith('settings/')
  );
}

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
      const pageComponent = (await resolvePageComponent(
        `./pages/${name}.tsx`,
        import.meta.glob('./pages/**/*.tsx'),
      )) as ResolvedPageModule;

      const existingLayout = pageComponent.default.layout;

      pageComponent.default.layout =
        existingLayout ||
        ((pageContent: ReactNode) => (
          <>
            <SeoMeta noIndex={shouldNoIndex(name)} />
            {pageContent}
          </>
        ));

      return pageComponent;
    },
    setup: ({ App, props }) => {
      return <App {...props} />;
    },
  }),
);
