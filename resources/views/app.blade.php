<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        @php
            $siteName = (string) config('app.name', 'Laravel');
            $component = (string) data_get($page ?? [], 'component', '');
            $props = data_get($page ?? [], 'props', []);

            $currentUrl = request()->fullUrl();
            $defaultDescription = 'Build and share polished documentation for Hytale mods.';
            $defaultImage = request()->getSchemeAndHttpHost().'/banner_transparent_light.png';

            $metaTitle = $siteName;
            $metaDescription = $defaultDescription;
            $metaImage = $defaultImage;
            $metaType = 'website';
            $robots = 'index, follow';

            $toPreview = function (?string $value, int $limit = 180): string {
                $text = trim((string) $value);

                if ($text === '') {
                    return '';
                }

                $text = preg_replace('/```[\s\S]*?```/', ' ', $text) ?? $text;
                $text = preg_replace('/`([^`]+)`/', '$1', $text) ?? $text;
                $text = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $text) ?? $text;
                $text = preg_replace('/[#>*_~\-]+/', ' ', $text) ?? $text;
                $text = preg_replace('/\s+/', ' ', strip_tags($text)) ?? $text;

                return \Illuminate\Support\Str::limit(trim($text), $limit, '...');
            };

            if (
                \Illuminate\Support\Str::startsWith($component, 'auth/') ||
                \Illuminate\Support\Str::startsWith($component, 'dashboard') ||
                \Illuminate\Support\Str::startsWith($component, 'Invitations/') ||
                \Illuminate\Support\Str::startsWith($component, 'Mods/') ||
                \Illuminate\Support\Str::startsWith($component, 'Pages/') ||
                \Illuminate\Support\Str::startsWith($component, 'settings/')
            ) {
                $robots = 'noindex, nofollow';
            }

            if ($component === 'welcome') {
                $metaTitle = 'Welcome';
                $metaDescription = 'Create mod wikis, publish polished guides, and share one source of truth for your Hytale community.';
            }

            if ($component === 'Legal/Privacy') {
                $metaTitle = 'Privacy Policy';
                $metaDescription = 'Read how HytaleModding collects, uses, and protects your information.';
            }

            if ($component === 'Legal/Terms') {
                $metaTitle = 'Terms of Service';
                $metaDescription = 'Review the terms and acceptable use rules for using HytaleModding.';
            }

            if ($component === 'Public/Mods') {
                $metaTitle = 'Browse Mods';
                $query = trim((string) data_get($props, 'query', ''));
                $total = (int) data_get($props, 'mods.total', 0);

                $metaDescription = $query !== ''
                    ? "Browse {$total} Hytale mod wikis matching \"{$query}\"."
                    : 'Explore publicly available Hytale mod wikis from the community.';
            }

            if ($component === 'Public/Mod') {
                $modName = trim((string) data_get($props, 'mod.name', ''));
                $modDescription = $toPreview((string) data_get($props, 'mod.description', ''), 180);
                $indexContent = $toPreview((string) data_get($props, 'mod.index_page.content', ''), 180);
                $iconUrl = trim((string) data_get($props, 'mod.icon_url', ''));

                if ($modName !== '') {
                    $metaTitle = "{$modName} Documentation";
                }

                $metaDescription = $modDescription !== ''
                    ? $modDescription
                    : ($indexContent !== '' ? $indexContent : $defaultDescription);

                if ($iconUrl !== '') {
                    $metaImage = $iconUrl;
                }
            }

            if ($component === 'Public/Page') {
                $modName = trim((string) data_get($props, 'mod.name', ''));
                $pageTitle = trim((string) data_get($props, 'page.title', ''));
                $pageContent = $toPreview((string) data_get($props, 'page.content', ''), 180);
                $modDescription = $toPreview((string) data_get($props, 'mod.description', ''), 180);
                $iconUrl = trim((string) data_get($props, 'mod.icon_url', ''));

                if ($pageTitle !== '' && $modName !== '') {
                    $metaTitle = "{$pageTitle} - {$modName} Documentation";
                } elseif ($pageTitle !== '') {
                    $metaTitle = $pageTitle;
                }

                $metaDescription = $pageContent !== ''
                    ? $pageContent
                    : ($modDescription !== '' ? $modDescription : $defaultDescription);
                $metaType = 'article';

                if ($iconUrl !== '') {
                    $metaImage = $iconUrl;
                }
            }

            $documentTitle = $metaTitle === $siteName ? $siteName : "{$metaTitle} - {$siteName}";
            $ogTitle = $metaTitle === $siteName ? $siteName : "{$metaTitle} | {$siteName}";
            $twitterCard = $metaImage !== '' ? 'summary_large_image' : 'summary';
        @endphp

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <meta name="description" content="{{ $metaDescription }}">
        <meta name="robots" content="{{ $robots }}">
        <link rel="canonical" href="{{ $currentUrl }}">

        <meta property="og:type" content="{{ $metaType }}">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $ogTitle }}">
        <meta property="og:description" content="{{ $metaDescription }}">
        <meta property="og:url" content="{{ $currentUrl }}">
        <meta property="og:image" content="{{ $metaImage }}">

        <meta name="twitter:card" content="{{ $twitterCard }}">
        <meta name="twitter:title" content="{{ $ogTitle }}">
        <meta name="twitter:description" content="{{ $metaDescription }}">
        <meta name="twitter:image" content="{{ $metaImage }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ $documentTitle }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
        <script type="module" src="https://cdn.jsdelivr.net/gh/Voronoi-Studios/Node-Graph@v0.3.1/dist/node-graph.js"></script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
