import { BoldIcon, ImagePlusIcon, ItalicIcon, LinkIcon, ListIcon, Loader2Icon, PanelLeftIcon, PanelRightIcon } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorPreviewProps {
  content: string;
  onContentChange: (content: string) => void;
  lineCount: number;
  error?: string;
  uploadUrl: string;
  pageId?: string;
  customCss?: string | null;
}

type ViewMode = 'split' | 'write' | 'preview';
type EditorMode = 'markdown' | 'visual';

function htmlToMarkdown(html: string) {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  const convert = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';
    const text = Array.from(node.childNodes).map(convert).join('');
    switch (node.tagName) {
      case 'H1': return `# ${text}\n\n`;
      case 'H2': return `## ${text}\n\n`;
      case 'H3': return `### ${text}\n\n`;
      case 'P': case 'DIV': return `${text.trim()}\n\n`;
      case 'BR': return '\n';
      case 'STRONG': case 'B': return `**${text}**`;
      case 'EM': case 'I': return `*${text}*`;
      case 'CODE': return `\`${text}\``;
      case 'A': return `[${text}](${node.getAttribute('href') ?? ''})`;
      case 'IMG': return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})\n\n`;
      case 'LI': return `- ${text.trim()}\n`;
      case 'UL': case 'OL': return `${text}\n`;
      default: return text;
    }
  };
  return Array.from(documentFragment.body.childNodes).map(convert).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export default function MarkdownEditorPreview({ content, onContentChange, lineCount, error, uploadUrl, pageId, customCss }: MarkdownEditorPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [editorMode, setEditorMode] = useState<EditorMode>('markdown');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
    if (editorMode === 'visual') {
      document.execCommand('insertHTML', false, `<p><img src="${text.match(/\((.*)\)/)?.[1] ?? ''}" alt="" /></p>`);
      onContentChange(htmlToMarkdown(visualEditorRef.current?.innerHTML ?? ''));
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const prefix = content.slice(0, start);
    const suffix = content.slice(end);
    const before = prefix && !prefix.endsWith('\n') ? '\n\n' : '';
    const after = suffix && !suffix.startsWith('\n') ? '\n\n' : '';
    onContentChange(`${prefix}${before}${text}${after}${suffix}`);
    requestAnimationFrame(() => {
      const caret = (prefix + before + text).length;
      textarea?.focus();
      textarea?.setSelectionRange(caret, caret);
    });
  };

  const activateVisualEditor = async () => {
    const html = await marked.parse(content);
    setEditorMode('visual');
    requestAnimationFrame(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = DOMPurify.sanitize(html);
      }
    });
  };

  const formatVisual = (command: string, value?: string) => {
    visualEditorRef.current?.focus();
    if (command === 'createLink') {
      const url = window.prompt('Paste the link URL');
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, value);
    }
    onContentChange(htmlToMarkdown(visualEditorRef.current?.innerHTML ?? ''));
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a PNG, JPEG, GIF, or WebP image.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);
    if (pageId) formData.append('page_id', pageId);
    try {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const response = await fetch(uploadUrl, { method: 'POST', body: formData, credentials: 'same-origin', headers: { Accept: 'application/json', ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}) } });
      const result = await response.json();
      if (!response.ok || !result.file?.url) throw new Error(result.error ?? 'The image could not be uploaded.');
      const alt = (result.file.original_name || file.name).replace(/[\[\]]/g, '');
      insertAtCursor(`![${alt}](${result.file.url})`);
    } catch (failure) {
      setUploadError(failure instanceof Error ? failure.message : 'The image could not be uploaded.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void uploadImage(event.dataTransfer.files[0]);
  };
  const handlePaste = (event: React.ClipboardEvent<HTMLElement>) => {
    const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith('image/'));
    if (!image) return;
    event.preventDefault();
    void uploadImage(image);
  };
  const showEditor = viewMode !== 'preview';
  const showPreview = viewMode !== 'write';

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div><h2 className="font-semibold">Page content</h2></div>
        <div className="flex items-center gap-1 rounded-md border bg-background p-1">
          <Button type="button" variant={viewMode === 'write' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('write')}><PanelLeftIcon className="mr-1.5 h-3.5 w-3.5" />Write</Button>
          <Button type="button" variant={viewMode === 'split' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('split')}>Split</Button>
          <Button type="button" variant={viewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('preview')}><PanelRightIcon className="mr-1.5 h-3.5 w-3.5" />Preview</Button>
        </div>
      </div>
      <div className={`grid min-h-[620px] ${showEditor && showPreview ? 'xl:grid-cols-2' : ''}`}>
        {showEditor && <div className="flex min-w-0 flex-col border-border/70 xl:border-r">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-2.5 text-xs text-muted-foreground"><div className="flex rounded-md border bg-background p-0.5"><Button type="button" size="sm" variant={editorMode === 'markdown' ? 'secondary' : 'ghost'} onClick={() => setEditorMode('markdown')}>Markdown</Button><Button type="button" size="sm" variant={editorMode === 'visual' ? 'secondary' : 'ghost'} onClick={() => void activateVisualEditor()}>Visual</Button></div><span>{content.length.toLocaleString()} characters</span></div>
          <div className="relative flex flex-1">
            {editorMode === 'markdown' ? <Textarea ref={textareaRef} id="content" value={content} rows={lineCount} onChange={(event) => onContentChange(event.target.value)} onPaste={handlePaste} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} placeholder="# Welcome\n\nStart writing your documentation..." className="min-h-[560px] flex-1 resize-none rounded-none border-0 bg-background px-5 py-4 font-mono text-sm leading-6 focus-visible:ring-0" /> : <div className="flex min-h-[560px] flex-1 flex-col"><div className="flex flex-wrap gap-1 border-b border-border/70 bg-muted/20 p-2"><Button type="button" size="icon" variant="ghost" title="Bold" onClick={() => formatVisual('bold')}><BoldIcon className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" title="Italic" onClick={() => formatVisual('italic')}><ItalicIcon className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" title="Link" onClick={() => formatVisual('createLink')}><LinkIcon className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" title="List" onClick={() => formatVisual('insertUnorderedList')}><ListIcon className="h-4 w-4" /></Button><Button type="button" size="sm" variant="ghost" onClick={() => formatVisual('formatBlock', 'h2')}>Heading</Button><Button type="button" size="sm" variant="ghost" onClick={() => formatVisual('formatBlock', 'p')}>Text</Button></div><div ref={visualEditorRef} contentEditable suppressContentEditableWarning onInput={() => onContentChange(htmlToMarkdown(visualEditorRef.current?.innerHTML ?? ''))} onPaste={handlePaste} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className="prose max-w-none flex-1 overflow-y-auto px-5 py-4 outline-none dark:prose-invert" /></div>}
            {isDragging && <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 font-medium text-primary">Drop image to insert it here</div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground"><span>{error ? <span className="text-destructive">{error}</span> : 'Drop or paste an image anywhere in your text.'}</span><Button type="button" variant="ghost" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>{isUploading ? <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImagePlusIcon className="mr-1.5 h-3.5 w-3.5" />}{isUploading ? 'Uploading image' : 'Insert image'}</Button><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} /></div>
          {uploadError && <p className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">{uploadError}</p>}
        </div>}
        {showPreview && <div className="public-docs min-w-0 bg-background"><style>{customCss ?? ''}</style><div className="flex items-center justify-between border-b border-border/70 px-5 py-2.5 text-xs text-muted-foreground"><span>Public page preview</span><span>Custom CSS applied</span></div><div className="public-prose h-[calc(100vh-270px)] min-h-[560px] overflow-y-auto p-6 sm:p-8"><MarkdownRenderer content={content || 'Nothing to preview yet...'} /></div></div>}
      </div>
    </section>
  );
}
