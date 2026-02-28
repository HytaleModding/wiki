import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { DownloadIcon, UploadIcon, FileIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface File {
  id: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  created_at: string;
  uploader?: {
    id: number;
    name: string;
  };
}

interface Mod {
  id: string;
  name: string;
  slug: string;
  storage_driver: 'local' | 's3';
}

interface Props {
  mod: Mod;
  files: File[];
  canEdit: boolean;
}

export default function FilesIndex({ mod, files, canEdit }: Props) {
  const { data, setData, post, processing } = useForm<{
    files: globalThis.File[];
  }>({
    files: [],
  });

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.files.length) return;

    post(`/dashboard/mods/${mod.slug}/files`, {
      forceFormData: true,
      onSuccess: () => {
        setData('files', []);
        const input = document.getElementById(
          'file-upload',
        ) as HTMLInputElement;
        if (input) input.value = '';
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      fetch(`/dashboard/mods/${mod.slug}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN':
            document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute('content') || '',
        },
      }).then(() => {
        window.location.reload();
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📄';
  };

  return (
    <AppLayout>
      <Head title={`Files - ${mod.name}`} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm text-gray-600">
            <a
              href={`/dashboard/mods/${mod.slug}`}
              className="hover:text-gray-800"
            >
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>Files</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                File Management
              </h1>
              <p className="mt-2 text-gray-600">
                Upload and manage files for your mod documentation
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {mod.storage_driver === 's3' ? 'S3 Storage' : 'Local Storage'}
            </Badge>
          </div>
        </div>

        {canEdit && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UploadIcon className="mr-2 h-5 w-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select Files</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={(e) =>
                      setData('files', Array.from(e.target.files ?? []))
                    }
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    Maximum file size: 10MB. Supported formats: Images, PDFs,
                    Archives, Documents
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={!data.files.length || processing}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {processing ? 'Uploading...' : 'Upload Files'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="py-12 text-center">
                <FileIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No files uploaded
                </h3>
                <p className="mb-4 text-gray-600">
                  Upload files to include images, documents, and other assets in
                  your documentation
                </p>
                {canEdit && (
                  <Button
                    onClick={() =>
                      document.getElementById('file-upload')?.click()
                    }
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Upload First File
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-2xl">
                          {getFileIcon(file.mime_type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {file.original_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost" asChild>
                          <a
                            href={`/dashboard/mods/${mod.slug}/files/${file.id}/download`}
                          >
                            <DownloadIcon className="h-3 w-3" />
                          </a>
                        </Button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFile(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {file.mime_type.startsWith('image/') && (
                      <div className="mb-3">
                        <img
                          src={file.url}
                          alt={file.original_name}
                          className="h-32 w-full rounded object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-gray-500">
                      <p>Uploaded {formatDate(file.created_at)}</p>
                      <p className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                        {file.url}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
