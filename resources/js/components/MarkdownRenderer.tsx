import hljs from 'highlight.js';
import { marked, type Token } from 'marked';
import { markedHighlight } from 'marked-highlight';
import 'highlight.js/styles/github-dark.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useClipboard } from '@/hooks/use-clipboard';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createHeadingRenderer() {
  return function (heading: { tokens: Token[]; depth: number }): string {
    const text = marked.parser(heading.tokens, {
      renderer: new marked.Renderer(),
      gfm: true,
      breaks: true,
    });
    const rawText = text.replace(/<[^>]*>/g, '');
    const slug = createSlug(rawText);

    return `
      <div class="heading-container group relative">
        <h${heading.depth} id="${slug}" class="heading-with-link">
          <a href="#${slug}" class="heading-anchor absolute -ml-8 pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 no-underline text-muted-foreground hover:text-foreground" aria-label="Link to ${rawText}">
            <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </a>
          ${text}
          <button
            type="button"
            class="copy-heading-btn ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            data-heading-text="${rawText}"
            data-heading-slug="${slug}"
            aria-label="Copy link to ${rawText}"
          >
            <svg class="w-3 h-3 copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg class="w-3 h-3 check-icon hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </h${heading.depth}>
      </div>
    `;
  };
}

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

marked.setOptions({
  gfm: true,
  breaks: true,
});

marked.setOptions({
  renderer: (() => {
    const renderer = new marked.Renderer();
    renderer.heading = createHeadingRenderer();
    return renderer;
  })(),
});

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [, copy] = useClipboard();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyClick = useCallback(
    async (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.copy-heading-btn') as HTMLButtonElement;

      if (!button) return;

      const slug = button.dataset.headingSlug;
      if (!slug) return;

      const url = `${window.location.origin}${window.location.pathname}#${slug}`;

      const success = await copy(url);

      if (success) {
        const copyIcon = button.querySelector('.copy-icon') as HTMLElement;
        const checkIcon = button.querySelector('.check-icon') as HTMLElement;

        if (copyIcon && checkIcon) {
          copyIcon.classList.add('hidden');
          checkIcon.classList.remove('hidden');

          setTimeout(() => {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
          }, 2000);
        }
      }
    },
    [copy],
  );

  useEffect(() => {
    const parseContent = async () => {
      const html = await marked.parse(content);
      setHtmlContent(html);
    };

    parseContent();
  }, [content]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const copyButtons = container.querySelectorAll('.copy-heading-btn');
    copyButtons.forEach((button) => {
      button.addEventListener('click', handleCopyClick);
    });

    return () => {
      copyButtons.forEach((button) => {
        button.removeEventListener('click', handleCopyClick);
      });
    };
  }, [htmlContent, handleCopyClick]);

  return (
    <div
      ref={containerRef}
      className={`prose max-w-none prose-slate dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
