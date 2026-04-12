<?php

namespace App\Http\Controllers\Api\Client;

use App\Models\Mod;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ModController extends ClientController
{
    /**
     * Display a listing of user's mods.
     */
    public function index()
    {
        $mods = Mod::where('visibility', 'public')
            ->where('external_access', true)
            ->with('owner')
            ->latest()
            ->get();

        return response()->json(
            $mods->map(function (Mod $mod) {
                return [
                    'id' => $mod->id,
                    'name' => $mod->name,
                    'slug' => $mod->slug,
                    'description' => $mod->description,
                    'author' => [
                        'name' => $mod->owner->name,
                        'username' => $mod->owner->username,
                        'avatar_url' => $mod->owner->avatar_url,
                    ],
                    'index' => $mod->indexPage ? $this->pagePayload($mod->indexPage) : null,
                    'created_at' => $mod->created_at->toISOString(),
                    'updated_at' => $mod->updated_at->toISOString(),
                ];
            })
        );
    }

    /**
     * Display all the pages of a mod in hierarchical structure.
     */
    public function show(Request $request)
    {
        $modIdentifier = $request->route('mod');

        $mod = Mod::where('visibility', 'public')
            ->where(function ($query) use ($modIdentifier) {
                $query->where('id', $modIdentifier)
                    ->orWhere('slug', $modIdentifier);
            })
            ->firstOrFail();

        if (! $mod->canBeAccessedBy(Auth::user()) || ! $mod->external_access) {
            return response()->json(['error' => 'Access denied. You do not have permission to view this mod.'], 403);
        }

        $allPages = $mod->pages()->orderBy('order_index')->get();

        $pages = $this->buildPageHierarchy($allPages);

        return response()->json([
            'mod' => [
                'id' => $mod->id,
                'name' => $mod->name,
                'slug' => $mod->slug,
                'description' => $mod->description,
                'visibility' => $mod->visibility,
                'author' => [
                    'name' => $mod->owner->name,
                    'username' => $mod->owner->username,
                    'avatar_url' => $mod->owner->avatar_url,
                ],
                'created_at' => $mod->created_at->toISOString(),
                'updated_at' => $mod->updated_at->toISOString(),
            ],
            'pages' => $pages,
        ]);
    }

    /**
     * Recursively build page hierarchy from flat collection.
     */
    private function buildPageHierarchy($pages, $parentId = null)
    {
        return $pages
            ->filter(function ($page) use ($parentId) {
                return $page->parent_id === $parentId;
            })
            ->map(function ($page) use ($pages) {
                $children = $this->buildPageHierarchy($pages, $page->id);

                return [
                    ...$this->pagePayload($page),
                    'children' => $children->values()->toArray(),
                ];
            })
            ->values();
    }

    /**
     * Get the markdown contents of a specified page.
     */
    public function getPageContent(Request $request)
    {
        $mod_id = $request->route('mod');
        $page_slug = $request->route('page');

        $mod = Mod::where('id', $mod_id)
            ->where('visibility', 'public')
            ->where('external_access', true)
            ->with('owner')
            ->firstOrFail();

        if (! $mod->canBeAccessedBy(Auth::user())) {
            return response()->json(['error' => 'Access denied. You do not have permission to view this mod.'], 403);
        }

        $page = $mod->pages()->where('slug', $page_slug)->firstOrFail();

        return response()->json([
            'page' => $this->pagePayload($page),
            'content' => $page->content,
            'parent' => $page->parent ? $this->pagePayload($page->parent) : null,
            'children' => $page->children()->orderBy('order_index')->get()->map(function (Page $child) {
                return $this->pagePayload($child);
            })->values()->toArray(),
        ]);
    }

    /**
     * Search pages for a mod by title, slug, or content.
     */
    public function search(Request $request)
    {
        $modIdentifier = $request->route('mod');
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:120',
            'limit' => 'nullable|integer|min:1|max:25',
        ]);

        $searchQuery = trim((string) $validated['query']);
        $limit = (int) ($validated['limit'] ?? 10);

        $mod = Mod::where('visibility', 'public')
            ->where(function ($query) use ($modIdentifier) {
                $query->where('id', $modIdentifier)
                    ->orWhere('slug', $modIdentifier);
            })
            ->firstOrFail();

        if (! $mod->canBeAccessedBy(Auth::user()) || ! $mod->external_access) {
            return response()->json(['error' => 'Access denied. You do not have permission to view this mod.'], 403);
        }

        $literalQuery = preg_replace('/\s+/', ' ', trim(str_replace(['%', '_'], ' ', $searchQuery))) ?? '';

        if (Str::length($literalQuery) < 2) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => [
                    'query' => ['Query must include at least two searchable characters.'],
                ],
            ], 422);
        }

        $queryPattern = '%'.$literalQuery.'%';

        $slugQuery = Str::slug($searchQuery);
        $slugNeedle = $slugQuery !== '' ? Str::lower($slugQuery) : '__never_match_slug__';
        $slugPattern = '%'.$slugNeedle.'%';

        $pages = $mod->pages()
            ->where('published', true)
            ->where(function ($query) use ($queryPattern, $slugPattern) {
                $query->where('title', 'like', $queryPattern)
                    ->orWhere('slug', 'like', $slugPattern)
                    ->orWhere('content', 'like', $queryPattern);
            })
            ->orderByRaw(
                'CASE
                    WHEN title = ? THEN 0
                    WHEN slug = ? THEN 1
                    WHEN title LIKE ? THEN 2
                    WHEN slug LIKE ? THEN 3
                    WHEN title LIKE ? THEN 4
                    WHEN slug LIKE ? THEN 5
                    ELSE 6
                END',
                [
                    $literalQuery,
                    $slugNeedle,
                    $literalQuery.'%',
                    $slugNeedle.'%',
                    $queryPattern,
                    $slugPattern,
                ]
            )
            ->orderBy('title')
            ->limit($limit)
            ->get();

        return response()->json([
            'mod' => [
                'id' => $mod->id,
                'name' => $mod->name,
                'slug' => $mod->slug,
            ],
            'query' => $searchQuery,
            'results' => $pages->map(function (Page $page) use ($mod) {
                return [
                    ...$this->pagePayload($page),
                    'url' => route('public.page', [
                        'mod' => $mod->slug,
                        'page' => $page->slug,
                    ]),
                    'snippet' => Str::limit(
                        preg_replace('/\s+/', ' ', trim((string) $page->content)) ?? '',
                        180
                    ),
                ];
            })->values()->toArray(),
        ]);
    }

    private function pagePayload(Page $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'kind' => $page->kind,
        ];
    }
}
