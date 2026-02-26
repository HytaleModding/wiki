/**
 * Utility functions for working with markdown content
 */

/**
 * Strip markdown formatting from text for use in previews
 * Removes common markdown syntax while preserving readable text
 */
export function stripMarkdown(content: string): string {
  if (!content) return '';

  return content
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove blockquotes
    .replace(/^>\s*/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get a clean preview text from markdown content
 */
export function getMarkdownPreview(content: string, maxLength: number = 150): string {
  const stripped = stripMarkdown(content);
  if (stripped.length <= maxLength) {
    return stripped;
  }

  // Try to break at word boundary
  const preview = stripped.substring(0, maxLength);
  const lastSpace = preview.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return preview.substring(0, lastSpace) + '...';
  }

  return preview + '...';
}
