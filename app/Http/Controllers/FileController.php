<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Mod;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FileController extends Controller
{

    /**
     * Display files for a mod.
     */
    public function index(Mod $mod)
    {
        $user = Auth::user();

        if (!$mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $files = $mod->files()
            ->with(['uploader', 'page'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Files/Index', [
            'mod' => $mod->load(['owner']),
            'files' => $files,
            'canEdit' => $user && $mod->userCan($user, 'edit'),
        ]);
    }

    /**
     * Upload a new file.
     */
    public function store(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (!$mod->userCan($user, 'edit')) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'page_id' => 'nullable|uuid|exists:pages,id',
        ]);

        $uploadedFile = $request->file('file');
        $pageId = $request->get('page_id');

        if ($pageId) {
            $page = Page::findOrFail($pageId);
            if ($page->mod_id !== $mod->id) {
                abort(422, 'Page must belong to the same mod.');
            }
        }

        $originalName = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        $path = "mods/{$mod->id}/files/{$filename}";

        $disk = $mod->storage_driver;
        $uploadedFile->storeAs("mods/{$mod->id}/files", $filename, $disk);

        $file = File::create([
            'mod_id' => $mod->id,
            'page_id' => $pageId,
            'original_name' => $originalName,
            'filename' => $filename,
            'path' => $path,
            'mime_type' => $uploadedFile->getMimeType(),
            'size' => $uploadedFile->getSize(),
            'storage_driver' => $disk,
            'uploaded_by' => $user->id,
        ]);

        if ($disk === 's3') {
            $url = Storage::disk('s3')->url($path);
        } else {
            $url = Storage::disk('local')->url($path);
        }

        $file->update(['url' => $url]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'file' => $file->load('uploader'),
                'message' => 'File uploaded successfully!'
            ]);
        }

        return redirect()->back()->with('success', 'File uploaded successfully!');
    }

    /**
     * Display the specified file details.
     */
    public function show(Mod $mod, File $file)
    {
        $user = Auth::user();

        if ($file->mod_id !== $mod->id) {
            abort(404);
        }

        if (!$mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $file->load(['uploader', 'page']);

        return Inertia::render('Files/Show', [
            'mod' => $mod,
            'file' => $file,
            'userRole' => $mod->getUserRole($user),
        ]);
    }

    /**
     * Download the specified file.
     */
    public function download(Mod $mod, File $file)
    {
        $user = Auth::user();

        if ($file->mod_id !== $mod->id) {
            abort(404);
        }

        if (!$mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $disk = $file->storage_driver;

        if (!Storage::disk($disk)->exists($file->path)) {
            abort(404, 'File not found on storage.');
        }

        return Storage::disk($disk)->download($file->path, $file->original_name);
    }

    /**
     * Delete the specified file.
     */
    public function destroy(Mod $mod, File $file)
    {
        $user = Auth::user();

        if ($file->mod_id !== $mod->id) {
            abort(404);
        }

        if (!$mod->userCan($user, 'edit')) {
            abort(403);
        }

        $file->delete();

        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'message' => 'File deleted successfully!']);
        }

        return redirect()->back()->with('success', 'File deleted successfully!');
    }

    /**
     * Upload file via drag-and-drop or editor.
     */
    public function quickUpload(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (!$mod->userCan($user, 'edit')) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $uploadedFile = $request->file('file');

        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/markdown',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!in_array($uploadedFile->getMimeType(), $allowedMimes)) {
            return response()->json(['error' => 'File type not allowed.'], 422);
        }

        $originalName = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        $path = "mods/{$mod->id}/files/{$filename}";
        $disk = $mod->storage_driver;
        $uploadedFile->storeAs("mods/{$mod->id}/files", $filename, $disk);

        $file = File::create([
            'mod_id' => $mod->id,
            'original_name' => $originalName,
            'filename' => $filename,
            'path' => $path,
            'mime_type' => $uploadedFile->getMimeType(),
            'size' => $uploadedFile->getSize(),
            'storage_driver' => $disk,
            'uploaded_by' => $user->id,
        ]);

        if ($disk === 's3') {
            $url = Storage::disk('s3')->url($path);
        } else {
            $url = Storage::disk('local')->url($path);
        }

        $file->update(['url' => $url]);

        return response()->json([
            'success' => true,
            'file' => [
                'id' => $file->id,
                'url' => $file->url,
                'original_name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size' => $file->human_size,
                'is_image' => $file->isImage(),
            ],
            'message' => 'File uploaded successfully!'
        ]);
    }

    /**
     * Get files for a specific page (for editor integration).
     */
    public function getPageFiles(Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (!$mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $files = $page->files()
            ->with('uploader')
            ->latest()
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'original_name' => $file->original_name,
                    'url' => $file->url,
                    'mime_type' => $file->mime_type,
                    'size' => $file->human_size,
                    'is_image' => $file->isImage(),
                    'uploaded_at' => $file->created_at->format('M j, Y'),
                ];
            });

        return response()->json(['files' => $files]);
    }
}
