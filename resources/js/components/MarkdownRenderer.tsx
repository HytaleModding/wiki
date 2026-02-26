import { marked } from 'marked';
import { useEffect, useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
      smartLists: true,
      smartypants: true,
    });


    Promise.resolve(marked.parse(content)).then((parsed) => {
      setHtmlContent(parsed);
    });
  }, [content]);

  return (
    <div
      className={`
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
