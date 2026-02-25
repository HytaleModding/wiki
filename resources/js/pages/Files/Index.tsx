import { PlusIcon, UploadIcon, TrashIcon, DownloadIcon, FileIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

interface File {
  id: string;
  name: string;
  original_name: string;
  size: number;
  mime_type: string;
  url: string;
  created_at: string;
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
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const { post, processing } = useForm();

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles) return;

    const formData = new FormData();
    Array.from(selectedFiles).forEach(file => {
      formData.append('files[]', file);
    });

    post(`/mods/${mod.slug}/files`, {
      data: formData,
      onSuccess: () => {
        setSelectedFiles(null);
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
      fetch(`/mods/${mod.slug}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
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

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <a href={`/mods/${mod.slug}`} className="hover:text-gray-800">
              {mod.name}
            </a>
            <span className="mx-2">›</span>
            <span>Files</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
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
                <UploadIcon className="h-5 w-5 mr-2" />
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
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Maximum file size: 10MB. Supported formats: Images, PDFs, Archives, Documents
                  </p>
                </div>
                <Button type="submit" disabled={!selectedFiles || processing}>
                  <UploadIcon className="h-4 w-4 mr-2" />
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
              <div className="text-center py-12">
                <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files uploaded
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload files to include images, documents, and other assets in your documentation
                </p>
                {canEdit && (
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload First File
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileIcon(file.mime_type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.original_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`/mods/${mod.slug}/files/${file.id}/download`}>
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
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Uploaded {formatDate(file.created_at)}</p>
                      <p className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
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
