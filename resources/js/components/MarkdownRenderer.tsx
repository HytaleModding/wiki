import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { CheckIcon, LinkIcon } from 'lucide-react';
import { marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import mermaid from 'mermaid';
import 'highlight.js/styles/github-dark.css';
import { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAppearance } from '@/hooks/use-appearance';

interface MarkdownRendererProps {
  content: string | null | undefined;
  className?: string;
}

const renderer = new marked.Renderer();

const GFM_ALERT_LINE =
  /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]([+-])?(?:\s+(.*))?$/i;
const BLOCKQUOTE_CHUNK = /^(?:[ \t]{0,3}>[^\n]*(?:\n|$))+/;

const GFM_ALERT_TITLES: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

interface CalloutToken {
  type: 'callout';
  raw: string;
  alertType: string;
  title: string;
  collapsible: boolean;
  defaultOpen: boolean;
  tokens: TokensList;
}

type TokensList = unknown[];

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const gfmAlertCalloutExtension = {
  name: 'callout',
  level: 'block' as const,
  start(src: string) {
    return src.match(/^[ \t]{0,3}>[ \t]*\[!/m)?.index;
  },
  tokenizer(
    this: { lexer: { blockTokens: (src: string) => TokensList } },
    src: string,
  ): CalloutToken | undefined {
    const blockquoteMatch = src.match(BLOCKQUOTE_CHUNK);
    if (!blockquoteMatch) return undefined;

    const raw = blockquoteMatch[0];
    const lines = raw.split('\n');
    const unquotedLines = lines.map((line) =>
      line.replace(/^[ \t]{0,3}>[ \t]?/, ''),
    );

    while (unquotedLines.length > 0 && unquotedLines.at(-1) === '') {
      unquotedLines.pop();
    }

    const markerLineIndex = unquotedLines.findIndex(
      (line) => line.trim().length > 0,
    );
    if (markerLineIndex === -1) return undefined;

    const markerMatch = unquotedLines[markerLineIndex]
      .trim()
      .match(GFM_ALERT_LINE);
    if (!markerMatch) return undefined;

    const alertType = markerMatch[1].toLowerCase();
    const collapseMarker = markerMatch[2];
    const explicitTitle = (markerMatch[3] ?? '').trim();
    const title = explicitTitle || GFM_ALERT_TITLES[alertType] || alertType;

    // Remove the alert marker line so only body markdown is parsed.
    unquotedLines[markerLineIndex] = '';
    const bodyMarkdown = unquotedLines.join('\n').trim();

    return {
      type: 'callout',
      raw,
      alertType,
      title,
      collapsible: Boolean(collapseMarker),
      defaultOpen: collapseMarker !== '-',
      tokens: bodyMarkdown ? this.lexer.blockTokens(bodyMarkdown) : [],
    };
  },
  renderer(
    this: { parser: { parse: (tokens: TokensList) => string } },
    token: CalloutToken,
  ) {
    const classes = `markdown-callout markdown-callout-${token.alertType}`;
    const safeTitle = escapeHtml(token.title);
    const bodyHtml = this.parser.parse(token.tokens);

    if (token.collapsible) {
      const openAttr = token.defaultOpen ? ' open' : '';
      return `<details class="${classes}" data-callout-type="${token.alertType}"${openAttr}><summary class="markdown-callout-title">${safeTitle}</summary><div class="markdown-callout-content">${bodyHtml}</div></details>`;
    }

    return `<aside class="${classes}" data-callout-type="${token.alertType}"><p class="markdown-callout-title">${safeTitle}</p><div class="markdown-callout-content">${bodyHtml}</div></aside>`;
  },
};

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  // Check if this is a mermaid diagram by language tag or by content
  const isMermaid =
    lang === 'mermaid' ||
    text.match(
      /^\s*(sequenceDiagram|graph|classDiagram|stateDiagram|gantt|pie|erDiagram|journey|gitGraph|mindmap|timeline|block)/,
    );

  if (isMermaid) {
    return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
  }

  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;

  return `<pre class="hljs-code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

renderer.codespan = function ({ text }: { text: string }) {
  return `<code class="inline-code">${escapeHtml(text)}</code>`;
};

marked.use(gfmHeadingId(), markedFootnote(), {
  extensions: [gfmAlertCalloutExtension as never],
  renderer,
});

marked.setOptions({
  gfm: true,
  breaks: true,
});

const CLIPBOARD_ICON_SVG = renderToStaticMarkup(
  <LinkIcon size={16} aria-hidden="true" />,
);
const CHECK_ICON_SVG = renderToStaticMarkup(
  <CheckIcon size={16} aria-hidden="true" />,
);

function addHeadingAnchors(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const id = heading.id;
    if (!id) return;

    heading.classList.add('heading-with-link');

    // Wrap existing inline content in a span so flex layout works correctly
    const contentSpan = doc.createElement('span');
    while (heading.firstChild) {
      contentSpan.appendChild(heading.firstChild);
    }
    heading.appendChild(contentSpan);

    const headingText = contentSpan.textContent ?? '';

    const copyBtn = doc.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-heading-btn';
    copyBtn.setAttribute('data-heading-id', id);
    copyBtn.setAttribute('aria-label', `Copy link to "${headingText}"`);
    copyBtn.innerHTML = CLIPBOARD_ICON_SVG;
    heading.appendChild(copyBtn);
  });

  return doc.body.innerHTML;
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedAppearance } = useAppearance();
  const safeContent = content ?? '';
  const mermaidTheme = resolvedAppearance === 'dark' ? 'dark' : 'default';

  useEffect(() => {
    const parseContent = async () => {
      const html = await marked.parse(safeContent);
      const sanitized = DOMPurify.sanitize(html, {
        // Whitelist custom tag and attributes needed for node-graph component
        ADD_TAGS: ['node-graph'],
        ADD_ATTR: ['src', 'steps-src', 'start-step', 'can-step'], //force-expand is left out on purpose
      });
      setHtmlContent(addHeadingAnchors(sanitized));
    };

    parseContent();
  }, [safeContent]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize and render mermaid diagrams
    const renderMermaid = async () => {
      const diagrams = container.querySelectorAll<HTMLElement>('pre.mermaid');
      if (diagrams.length === 0) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
      });

      await mermaid.run({ nodes: diagrams });
    };
    void renderMermaid();

    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest(
        '.copy-heading-btn',
      ) as HTMLElement | null;
      if (!btn) return;

      const headingId = btn.getAttribute('data-heading-id');
      if (!headingId) return;

      const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
      navigator.clipboard.writeText(url).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = CHECK_ICON_SVG;
        setTimeout(() => {
          btn.innerHTML = original;
        }, 1500);
      });
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [htmlContent, mermaidTheme]);

  return (
    <div
      key={mermaidTheme}
      ref={containerRef}
      className={`prose max-w-none prose-slate dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
