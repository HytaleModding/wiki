import { Head, usePage } from '@inertiajs/react';

import type { SharedData } from '@/types';

type SeoMetaProps = {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  url?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

function toAbsoluteUrl(value: string, fallbackBase: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${fallbackBase}${value}`;
  }

  return `${fallbackBase}/${value}`;
}

export default function SeoMeta({
  title,
  description,
  image,
  favicon,
  url,
  type = 'website',
  noIndex = false,
}: SeoMetaProps) {
  const { props } = usePage<SharedData>();
  const siteName = props.meta?.site_name ?? props.name;
  const defaultDescription =
    props.meta?.default_description ??
    'Build and share polished documentation for Hytale mods.';
  const currentUrl = props.meta?.current_url ?? '';
  const fallbackBaseUrl = currentUrl ? new URL(currentUrl).origin : '';

  const resolvedDescription = description ?? defaultDescription;
  const resolvedUrl = url ?? currentUrl;
  const resolvedImage = image
    ? toAbsoluteUrl(image, fallbackBaseUrl)
    : props.meta?.default_image;
  const resolvedFavicon = favicon
    ? toAbsoluteUrl(favicon, fallbackBaseUrl)
    : null;
  const ogTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <Head title={title}>
      <meta
        head-key="meta-description"
        name="description"
        content={resolvedDescription}
      />
      {resolvedUrl && (
        <link head-key="meta-canonical" rel="canonical" href={resolvedUrl} />
      )}
      {resolvedFavicon && (
        <>
          <link head-key="meta-favicon" rel="icon" href={resolvedFavicon} />
          <link
            head-key="meta-apple-touch-icon"
            rel="apple-touch-icon"
            href={resolvedFavicon}
          />
        </>
      )}
      <meta
        head-key="meta-robots"
        name="robots"
        content={noIndex ? 'noindex, nofollow' : 'index, follow'}
      />

      <meta head-key="og-type" property="og:type" content={type} />
      <meta
        head-key="og-site-name"
        property="og:site_name"
        content={siteName}
      />
      <meta head-key="og-title" property="og:title" content={ogTitle} />
      <meta
        head-key="og-description"
        property="og:description"
        content={resolvedDescription}
      />
      {resolvedUrl && (
        <meta head-key="og-url" property="og:url" content={resolvedUrl} />
      )}
      {resolvedImage && (
        <meta head-key="og-image" property="og:image" content={resolvedImage} />
      )}

      <meta
        head-key="twitter-card"
        name="twitter:card"
        content={resolvedImage ? 'summary_large_image' : 'summary'}
      />
      <meta head-key="twitter-title" name="twitter:title" content={ogTitle} />
      <meta
        head-key="twitter-description"
        name="twitter:description"
        content={resolvedDescription}
      />
      {resolvedImage && (
        <meta
          head-key="twitter-image"
          name="twitter:image"
          content={resolvedImage}
        />
      )}
    </Head>
  );
}
