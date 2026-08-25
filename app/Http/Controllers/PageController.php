<?php

namespace App\Http\Controllers;

use App\Models\Mod;
use App\Models\Page;
use App\Models\User;
use App\Services\PageViewService;
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
            'mod' => $this->serializeMod($mod->load(['owner'])),
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

        $this->ensureManualPageEditingAllowed($mod);

        $parentId = $request->get('parent_id');
        $parent = $parentId ? Page::findOrFail($parentId) : null;
        $initialKind = $request->get('kind') === Page::KIND_CATEGORY
            ? Page::KIND_CATEGORY
            : Page::KIND_PAGE;

        $potentialParents = $mod->pages()
            ->where('id', '!=', $parent?->id)
            ->orderBy('title')
            ->get();

        return Inertia::render('Pages/Create', [
            'mod' => $mod,
            'parent' => $parent,
            'potentialParents' => $potentialParents,
            'initialKind' => $initialKind,
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

        $this->ensureManualPageEditingAllowed($mod);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'kind' => 'nullable|in:page,category',
            'content' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:pages,id',
            'is_index' => 'boolean',
            'published' => 'boolean',
        ]);

        $validated['kind'] = $validated['kind'] ?? Page::KIND_PAGE;

        if ($validated['parent_id'] ?? null) {
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

        if (($validated['kind'] ?? Page::KIND_PAGE) === Page::KIND_CATEGORY) {
            $validated['is_index'] = false;
        }

        if ($validated['is_index'] ?? false) {
            $mod->pages()->where('is_index', true)->update(['is_index' => false]);
        }

        $page = Page::create([
            'mod_id' => $mod->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'kind' => $validated['kind'],
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

        $allChildren = function ($query) use (&$allChildren) {
            $query->orderBy('order_index')
                ->with(['children' => $allChildren]);
        };

        $navigation = $mod->pages()
            ->whereNull('parent_id')
            ->with(['children' => $allChildren])
            ->orderBy('order_index')
            ->get()
            ->map(fn (Page $navPage) => $this->serializeNavigationPage($navPage));

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

        // Get view statistics for the page if user can edit
        $viewStats = null;
        if ($user && $mod->userCan($user, 'edit')) {
            $pageViewService = app(PageViewService::class);
            $viewStats = [
                'totalViews' => $pageViewService->getPageViews($page),
                'uniqueViews' => $pageViewService->getUniquePageViews($page),
                'viewsThisMonth' => $pageViewService->getPageViewsInRange(
                    $page,
                    now()->startOfMonth()
                ),
                'viewsThisWeek' => $pageViewService->getPageViewsInRange(
                    $page,
                    now()->startOfWeek()
                ),
            ];
        }

        return Inertia::render('Pages/Show', [
            'mod' => $this->serializeMod($mod->load(['owner'])),
            'page' => array_merge($page->toArray(), [
                'path' => $path,
                'viewStats' => $viewStats,
                'children' => $page->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'title' => $child->title,
                        'slug' => $child->slug,
                        'kind' => $child->kind,
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

        $this->ensureManualPageEditingAllowed($mod);

        $page->load(['parent']);
        $descendantIds = $this->getDescendantIds($page);

        $potentialParents = $mod->pages()
            ->where('id', '!=', $page->id)
            ->when($descendantIds !== [], fn ($query) => $query->whereNotIn('id', $descendantIds))
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

        $this->ensureManualPageEditingAllowed($mod);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'kind' => 'nullable|in:page,category',
            'content' => 'nullable|string',
            'parent_id' => 'nullable|uuid|exists:pages,id',
            'is_index' => 'boolean',
            'published' => 'boolean',
        ]);

        $validated['kind'] = $validated['kind'] ?? $page->kind ?? Page::KIND_PAGE;

        if ($validated['parent_id'] ?? null) {
            $parent = Page::findOrFail($validated['parent_id']);
            if ($parent->mod_id !== $mod->id || $parent->id === $page->id) {
                abort(422, 'Invalid parent page.');
            }

            if (in_array($parent->id, $this->getDescendantIds($page), true)) {
                abort(422, 'Invalid parent page.');
            }
        }

        if (($validated['kind'] ?? $page->kind) === Page::KIND_CATEGORY) {
            $validated['is_index'] = false;
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

        $this->ensureManualPageEditingAllowed($mod);

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

        $this->ensureManualPageEditingAllowed($mod);

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $page->update([
            'content' => $validated['content'],
            'updated_by' => $user->id,
        ]);

        return response()->json(['success' => true, 'updated_at' => $page->fresh()->updated_at]);
    }

    private function ensureManualPageEditingAllowed(Mod $mod): void
    {
        if (! blank($mod->github_repository_url)) {
            abort(423, 'This mod is managed by GitHub sync. Manual page creation and editing are disabled.');
        }
    }

    /**
     * Get all descendant page IDs for a page in the same mod.
     *
     * @return array<int, string>
     */
    private function getDescendantIds(Page $page): array
    {
        $descendantIds = [];
        $currentParentIds = [$page->id];

        while ($currentParentIds !== []) {
            $childIds = Page::query()
                ->where('mod_id', $page->mod_id)
                ->whereIn('parent_id', $currentParentIds)
                ->pluck('id')
                ->all();

            if ($childIds === []) {
                break;
            }

            $descendantIds = array_merge($descendantIds, $childIds);
            $currentParentIds = $childIds;
        }

        return $descendantIds;
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
     * Display a mod's index page using the standard public page view.
     */
    public function publicIndex(Mod $mod, Request $request)
    {
        $page = $mod->pages()
            ->where('is_index', true)
            ->where('published', true)
            ->firstOrFail();

        return $this->publicShow($mod, $page, $request);
    }

    /**
     * Display the specified page for public viewing.
     */
    public function publicShow(Mod $mod, Page $page, Request $request)
    {
        $user = Auth::user();
        $resolvedMod = $request->attributes->get('resolved_mod');
        if ($resolvedMod instanceof Mod && $resolvedMod->id !== $mod->id) {
            abort(404, 'Documentation not found');
        }

        if ($page->mod_id !== $mod->id) {
            abort(404);
        }

        if (! $this->canViewPublicDocumentation($mod, $user)) {
            abort(404, 'Documentation not found');
        }

        if (! $page->published) {
            abort(404, 'Page not found');
        }

        // Track page view
        $pageViewService = app(PageViewService::class);
        $pageViewService->trackView($page, $request);

        $page->load(['children' => function ($query) {
            $query->where('published', true)->orderBy('order_index');
        }]);

        $publishedChildren = function ($query) use (&$publishedChildren) {
            $query->where('published', true)
                ->orderBy('order_index')
                ->with(['children' => $publishedChildren]);
        };

        $navigation = $mod->pages()
            ->whereNull('parent_id')
            ->where('published', true)
            ->with(['children' => $publishedChildren])
            ->orderBy('order_index')
            ->get()
            ->map(fn (Page $navPage) => $this->serializeNavigationPage($navPage));

        return Inertia::render('Public/Page', [
            'mod' => $this->serializeMod($mod->load(['owner'])),
            'page' => [
                'id' => $page->id,
                'title' => $page->title,
                'slug' => $page->slug,
                'kind' => $page->kind,
                'content' => $page->content,
                'published' => $page->published,
                'updated_at' => $page->updated_at,
                'children' => $page->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'title' => $child->title,
                        'slug' => $child->slug,
                        'kind' => $child->kind,
                        'content' => substr($child->content ?? '', 0, 200),
                    ];
                })->toArray(),
            ],
            'navigation' => $navigation,
        ]);
    }

    /**
     * Display a public page using a custom domain path (/page-slug).
     */
    public function publicShowResolved(Request $request, string $pageSlug)
    {
        $user = Auth::user();
        $mod = $request->attributes->get('resolved_mod');

        if (! $mod instanceof Mod) {
            abort(404, 'Documentation not found');
        }

        $page = Page::where('mod_id', $mod->id)
            ->where('slug', $pageSlug)
            ->firstOrFail();

        if (! $this->canViewPublicDocumentation($mod, $user)) {
            abort(404, 'Documentation not found');
        }

        return $this->publicShow($mod, $page, $request);
    }

    private function canViewPublicDocumentation(Mod $mod, ?User $user): bool
    {
        if (in_array($mod->visibility, ['public', 'unlisted'], true)) {
            return true;
        }

        return $user ? $mod->canBeAccessedBy($user) : false;
    }

    private function serializeMod(Mod $mod): array
    {
        return [
            'id' => $mod->id,
            'name' => $mod->name,
            'slug' => $mod->slug,
            'description' => $mod->description,
            'icon_url' => $mod->icon_url,
            'visibility' => $mod->visibility,
            'github_repository_url' => $mod->github_repository_url,
            'custom_css' => $mod->safe_custom_css,
            'owner' => $this->serializeOwner($mod->owner),
        ];
    }

    private function serializeOwner(User $owner): array
    {
        return [
            'id' => $owner->id,
            'name' => $owner->name,
            'username' => $owner->username,
            'avatar_url' => $owner->avatar_url,
        ];
    }

    private function serializeNavigationPage(Page $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'kind' => $page->kind,
            'published' => $page->published,
            'children' => $page->children
                ->map(fn (Page $child) => $this->serializeNavigationPage($child))
                ->values()
                ->toArray(),
        ];
    }
}
