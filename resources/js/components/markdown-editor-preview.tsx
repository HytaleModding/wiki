import { ImagePlusIcon, Loader2Icon, PanelLeftIcon, PanelRightIcon } from 'lucide-react';
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

export default function MarkdownEditorPreview({ content, onContentChange, lineCount, error, uploadUrl, pageId, customCss }: MarkdownEditorPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
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

  const handleDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void uploadImage(event.dataTransfer.files[0]);
  };
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 text-xs text-muted-foreground"><span>Markdown</span><span>{content.length.toLocaleString()} characters</span></div>
          <div className="relative flex flex-1">
            <Textarea ref={textareaRef} id="content" value={content} rows={lineCount} onChange={(event) => onContentChange(event.target.value)} onPaste={handlePaste} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} placeholder="# Welcome\n\nStart writing your documentation..." className="min-h-[560px] flex-1 resize-none rounded-none border-0 bg-background px-5 py-4 font-mono text-sm leading-6 focus-visible:ring-0" />
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
