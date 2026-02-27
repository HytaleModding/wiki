<?php

namespace App\Http\Controllers;

use App\Models\Mod;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PageController extends Controller
{
    /**
     * Display pages for a specific mod.
     */
    public function index(Mod $mod)
    {
        $user = Auth::user();

        if (! $user || ! $mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $pages = $mod->pages()
            ->with(['parent', 'creator', 'updater'])
            ->orderBy('parent_id')
            ->orderBy('order_index')
            ->get();

        return Inertia::render('Pages/Index', [
            'mod' => $mod->load(['owner']),
            'pages' => $pages,
            'userRole' => $user ? $mod->getUserRole($user) : null,
            'canEdit' => $user && $mod->userCan($user, 'edit'),
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(Mod $mod, Request $request)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $parentId = $request->get('parent_id');
        $parent = $parentId ? Page::findOrFail($parentId) : null;

        return Inertia::render('Pages/Create', [
            'mod' => $mod,
            'parent' => $parent,
        ]);
    }

    /**
     * Store a newly created page.
     */
    public function store(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:pages,id',
            'is_index' => 'boolean',
            'published' => 'boolean',
        ]);

        if ($validated['parent_id']) {
            $parent = Page::findOrFail($validated['parent_id']);
            if ($parent->mod_id !== $mod->id) {
                abort(422, 'Parent page must belong to the same mod.');
            }
        }

        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;

        while (Page::where('mod_id', $mod->id)->where('slug', $slug)->exists()) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;
        }

        if ($validated['is_index'] ?? false) {
            $mod->pages()->where('is_index', true)->update(['is_index' => false]);
        }

        $page = Page::create([
            'mod_id' => $mod->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'content' => $validated['content'] ?? '',
            'is_index' => $validated['is_index'] ?? false,
            'published' => $validated['published'] ?? true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return redirect()->route('pages.show', ['mod' => $mod, 'page' => $page])
            ->with('success', 'Page created successfully!');
    }

    /**
     * Display the specified page.
     */
    public function show(Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if ($mod->visibility === 'private') {
            if (! $user || ! $mod->canBeAccessedBy($user)) {
                abort(403);
            }
        }

        $page->load(['creator', 'updater', 'children' => function ($query) {
            $query->where('published', true)->orderBy('order_index');
        }]);

        $navigation = $mod->pages()
            ->whereNull('parent_id')
            ->where('published', true)
            ->with(['children' => function ($query) {
                $query->where('published', true)->orderBy('order_index');
            }])
            ->orderBy('order_index')
            ->get()
            ->map(function ($navPage) {
                return [
                    'id' => $navPage->id,
                    'title' => $navPage->title,
                    'slug' => $navPage->slug,
                    'children' => $navPage->children->map(function ($child) {
                        return [
                            'id' => $child->id,
                            'title' => $child->title,
                            'slug' => $child->slug,
                        ];
                    })->toArray(),
                ];
            });

        $path = [];
        $current = $page;
        while ($current) {
            array_unshift($path, [
                'id' => $current->id,
                'title' => $current->title,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }

        return Inertia::render('Pages/Show', [
            'mod' => $mod->load(['owner']),
            'page' => array_merge($page->toArray(), [
                'path' => $path,
                'children' => $page->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'title' => $child->title,
                        'slug' => $child->slug,
                        'content' => substr($child->content ?? '', 0, 200),
                    ];
                })->toArray(),
            ]),
            'navigation' => $navigation,
            'userRole' => $user ? $mod->getUserRole($user) : null,
            'canEdit' => $user && $mod->userCan($user, 'edit'),
        ]);
    }

    /**
     * Show the form for editing the page.
     */
    public function edit(Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $page->load(['parent']);

        $potentialParents = $mod->pages()
            ->where('id', '!=', $page->id)
            ->orderBy('title')
            ->get();

        return Inertia::render('Pages/Edit', [
            'mod' => $mod,
            'page' => $page,
            'potentialParents' => $potentialParents,
        ]);
    }

    /**
     * Update the specified page.
     */
    public function update(Request $request, Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:pages,id',
            'is_index' => 'boolean',
            'published' => 'boolean',
        ]);

        if ($validated['parent_id']) {
            $parent = Page::findOrFail($validated['parent_id']);
            if ($parent->mod_id !== $mod->id || $parent->id === $page->id) {
                abort(422, 'Invalid parent page.');
            }
        }

        if ($validated['title'] !== $page->title) {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $counter = 1;

            while (Page::where('mod_id', $mod->id)->where('slug', $slug)->where('id', '!=', $page->id)->exists()) {
                $slug = $originalSlug.'-'.$counter;
                $counter++;
            }

            $validated['slug'] = $slug;
        }

        if ($validated['is_index'] ?? false) {
            $mod->pages()->where('id', '!=', $page->id)->where('is_index', true)->update(['is_index' => false]);
        }

        $validated['updated_by'] = $user->id;
        $page->update($validated);

        return redirect()->route('pages.show', ['mod' => $mod, 'page' => $page])
            ->with('success', 'Page updated successfully!');
    }

    /**
     * Remove the specified page.
     */
    public function destroy(Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $page->delete();

        return redirect()->route('mods.show', $mod)
            ->with('success', 'Page deleted successfully!');
    }

    /**
     * Update page order (for drag-and-drop).
     */
    public function updateOrder(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'pages' => 'required|array',
            'pages.*.id' => 'required|uuid|exists:pages,id',
            'pages.*.parent_id' => 'nullable|uuid|exists:pages,id',
            'pages.*.order_index' => 'required|integer|min:0',
        ]);

        foreach ($validated['pages'] as $pageData) {
            $page = Page::findOrFail($pageData['id']);

            if ($page->mod_id !== $mod->id) {
                continue;
            }

            $page->update([
                'parent_id' => $pageData['parent_id'],
                'order_index' => $pageData['order_index'],
                'updated_by' => $user->id,
            ]);
        }

        return redirect()->back()->with('success', 'Page order updated successfully!');
    }

    /**
     * Auto-save page content.
     */
    public function autoSave(Request $request, Mod $mod, Page $page)
    {
        $user = Auth::user();

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (! $mod->userCan($user, 'edit')) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $page->update([
            'content' => $validated['content'],
            'updated_by' => $user->id,
        ]);

        return response()->json(['success' => true, 'updated_at' => $page->fresh()->updated_at]);
    }

    /**
     * Search pages within a mod.
     */
    public function search(Request $request, Mod $mod)
    {
        $user = Auth::user();

        if (! $mod->canBeAccessedBy($user)) {
            abort(403);
        }

        $validated = $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $query = $validated['query'];

        $pages = $mod->pages()
            ->where(function ($q) use ($query) {
                $q->where('title', 'ilike', "%{$query}%")
                    ->orWhere('content', 'ilike', "%{$query}%");
            })
            ->where('published', true)
            ->select(['id', 'title', 'slug', 'updated_at'])
            ->limit(20)
            ->get();

        return response()->json(['pages' => $pages]);
    }

    /**
     * Display the specified page for public viewing.
     */
    public function publicShow(Mod $mod, Page $page)
    {
        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if ($mod->visibility === 'private') {
            abort(404, 'Documentation not found');
        }

        if (! $page->published) {
            abort(404, 'Page not found');
        }

        $page->load(['children' => function ($query) {
            $query->where('published', true)->orderBy('order_index');
        }]);

        $navigation = $mod->pages()
            ->whereNull('parent_id')
            ->where('published', true)
            ->with(['children' => function ($query) {
                $query->where('published', true)->orderBy('order_index');
            }])
            ->orderBy('order_index')
            ->get()
            ->map(function ($navPage) {
                return [
                    'id' => $navPage->id,
                    'title' => $navPage->title,
                    'slug' => $navPage->slug,
                    'children' => $navPage->children->map(function ($child) {
                        return [
                            'id' => $child->id,
                            'title' => $child->title,
                            'slug' => $child->slug,
                        ];
                    })->toArray(),
                ];
            });

        return Inertia::render('Public/Page', [
            'mod' => $mod->load(['owner']),
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'content' => $page->content,
                'published' => $page->published,
                'updated_at' => $page->updated_at,
                'children' => $page->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'title' => $child->title,
                        'slug' => $child->slug,
                        'content' => substr($child->content ?? '', 0, 200),
                    ];
                })->toArray(),
            ],
            'navigation' => $navigation,
        ]);
    }
}
