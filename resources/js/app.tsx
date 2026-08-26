import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import '../css/font.css';
import SeoMeta from './components/SeoMeta';
import { initializeTheme } from './hooks/use-appearance';

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

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: async (name) => {
    const page = (await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    )) as ResolvedPageModule;

    const existingLayout = page.default.layout;

    page.default.layout =
      existingLayout ||
      ((pageContent: ReactNode) => (
        <>
          <SeoMeta noIndex={shouldNoIndex(name)} />
          {pageContent}
        </>
      ));

    return page;
  },
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <StrictMode>
        <App {...props} />
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

// This will set light / dark mode on load...
initializeTheme();
