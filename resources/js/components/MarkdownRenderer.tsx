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
    });


    Promise.resolve(marked.parse(content)).then((parsed) => {
      setHtmlContent(parsed);
      console.log(parsed);
    });
  }, [content]);

  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
