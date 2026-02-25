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

    const parsed = marked.parse(content);
    setHtmlContent(parsed);
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:border prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-table:text-sm prose-a:text-blue-600 hover:prose-a:text-blue-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
