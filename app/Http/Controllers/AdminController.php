<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGithubMod;
use App\Models\AdminAuditLog;
use App\Models\ApiKey;
use App\Models\ApiKeyLog;
use App\Models\Mod;
use App\Models\PageView;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    private const API_SCOPES = [
        '*',
        'read:mods',
        'read:mods:*',
        'read:mods:index',
        'read:mods:show',
        'read:mods:search',
        'read:mods:getPageContent',
    ];

    public function index()
    {
        return Inertia::render('Admin/Overview', [
            'metrics' => [
                'users' => User::count(),
                'suspended_users' => User::where('is_suspended', true)->count(),
                'mods' => Mod::count(),
                'suspended_mods' => Mod::where('is_suspended', true)->count(),
                'api_keys' => ApiKey::count(),
                'requests_today' => ApiKeyLog::where('created_at', '>=', now()->startOfDay())->count(),
            ],
            'recentMods' => Mod::with('owner:id,name')->withCount('pages')->latest()->limit(5)->get()->map(fn (Mod $mod) => $this->modSummary($mod)),
            'recentAudit' => AdminAuditLog::with('actor:id,name')->latest()->limit(8)->get()->map(fn (AdminAuditLog $log) => $this->auditSummary($log)),
        ]);
    }

    public function users(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', 'all');

        $users = User::query()->withCount(['ownedMods', 'apiKeys'])
            ->when($query, fn ($builder) => $builder->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$query}%")
                ->orWhere('username', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")))
            ->when($status === 'active', fn ($builder) => $builder->where('is_suspended', false))
            ->when($status === 'suspended', fn ($builder) => $builder->where('is_suspended', true))
            ->when($status === 'admins', fn ($builder) => $builder->where('is_admin', true))
            ->latest()->paginate(20)->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'is_admin' => $user->is_admin,
                'is_suspended' => $user->is_suspended,
                'owned_mods_count' => $user->owned_mods_count,
                'api_keys_count' => $user->api_keys_count,
                'created_at' => $user->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/Users', ['users' => $users, 'filters' => ['q' => $query, 'status' => $status]]);
    }

    public function mods(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', 'all');

        $mods = Mod::query()->with('owner:id,name,username')->withCount(['pages', 'collaborators'])
            ->when($query, fn ($builder) => $builder->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$query}%")
                ->orWhere('slug', 'like', "%{$query}%")))
            ->when($status === 'active', fn ($builder) => $builder->where('is_suspended', false))
            ->when($status === 'suspended', fn ($builder) => $builder->where('is_suspended', true))
            ->when($status === 'github', fn ($builder) => $builder->whereNotNull('github_repository_url'))
            ->latest()->paginate(18)->withQueryString()
            ->through(fn (Mod $mod) => $this->modSummary($mod));

        return Inertia::render('Admin/Mods', [
            'mods' => $mods,
            'filters' => ['q' => $query, 'status' => $status],
            'metrics' => [
                'total' => Mod::count(),
                'active' => Mod::where('is_suspended', false)->count(),
                'suspended' => Mod::where('is_suspended', true)->count(),
                'github' => Mod::whereNotNull('github_repository_url')->count(),
            ],
        ]);
    }

    public function showMod(Mod $mod)
    {
        $mod->load(['owner:id,name,username,email', 'collaborators:id,name,username']);
        $mod->loadCount(['pages', 'publishedPages', 'collaborators']);

        $recentPages = $mod->pages()->with('updater:id,name')->latest('updated_at')->limit(15)->get()->map(fn ($page) => [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'published' => $page->published,
            'source_type' => $page->source_type,
            'updated_by' => $page->updater?->name ?? 'System',
            'updated_at' => $page->updated_at->diffForHumans(),
        ]);

        $recentViews = PageView::with(['page:id,mod_id,title', 'user:id,name'])
            ->whereHas('page', fn ($query) => $query->where('mod_id', $mod->id))
            ->latest('viewed_at')->limit(15)->get()->map(fn (PageView $view) => [
                'id' => $view->id,
                'page' => $view->page?->title ?? 'Deleted page',
                'viewer' => $view->user?->name ?? 'Anonymous visitor',
                'viewed_at' => $view->viewed_at->diffForHumans(),
            ]);

        $audit = AdminAuditLog::with('actor:id,name')->where('subject_type', 'mod')
            ->where('subject_id', $mod->id)->latest()->limit(20)->get()->map(fn (AdminAuditLog $log) => $this->auditSummary($log));

        return Inertia::render('Admin/ModShow', [
            'mod' => array_merge($this->modSummary($mod), [
                'description' => $mod->description,
                'visibility' => $mod->visibility,
                'github_repository_url' => $mod->github_repository_url,
                'github_repository_path' => $mod->github_repository_path,
                'published_pages_count' => $mod->published_pages_count,
                'collaborators_count' => $mod->collaborators_count,
                'owner' => ['name' => $mod->owner?->name, 'username' => $mod->owner?->username, 'email' => $mod->owner?->email],
                'collaborators' => $mod->collaborators->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name, 'username' => $user->username, 'role' => $user->pivot->role]),
            ]),
            'recentPages' => $recentPages,
            'recentViews' => $recentViews,
            'audit' => $audit,
            'viewsCount' => PageView::whereHas('page', fn ($query) => $query->where('mod_id', $mod->id))->count(),
        ]);
    }

    public function apiKeys(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        $keys = ApiKey::with('user:id,name,email')->withCount('logs')
            ->when($query, fn ($builder) => $builder->where(fn ($inner) => $inner
                ->where('name', 'like', "%{$query}%")
                ->orWhereHas('user', fn ($users) => $users->where('name', 'like', "%{$query}%")->orWhere('email', 'like', "%{$query}%"))))
            ->latest()->paginate(20)->withQueryString()->through(fn (ApiKey $key) => [
                'id' => $key->id,
                'name' => $key->name,
                'prefix' => substr($key->key, 0, 8).'••••••••',
                'user' => ['name' => $key->user?->name ?? 'Deleted user', 'email' => $key->user?->email],
                'scopes' => $key->scopes ?? [],
                'rate_limit' => $key->rate_limit,
                'logs_count' => $key->logs_count,
                'last_used_at' => $key->last_used_at?->diffForHumans(),
                'expires_at' => $key->expires_at?->toISOString(),
                'expired' => $key->isExpired(),
                'created_at' => $key->created_at->toISOString(),
            ]);

        return Inertia::render('Admin/ApiKeys', [
            'keys' => $keys,
            'filters' => ['q' => $query],
            'availableScopes' => self::API_SCOPES,
            'users' => User::query()->orderBy('name')->limit(500)->get(['id', 'name', 'email']),
            'newKey' => $request->session()->get('new_api_key'),
        ]);
    }

    public function storeApiKey(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:100'],
            'scopes' => ['required', 'array', 'min:1'],
            'scopes.*' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9*:_-]+$/'],
            'rate_limit' => ['required', 'integer', 'min:1', 'max:100000'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $plaintext = ApiKey::generate();
        $apiKey = ApiKey::create([
            ...$validated,
            'key' => $plaintext,
            'expires_at' => filled($validated['expires_at'] ?? null) ? $validated['expires_at'] : null,
        ]);

        $this->record($request, 'api_key', (string) $apiKey->id, 'api_key.created', "API key {$apiKey->name} was created.", [
            'user_id' => $apiKey->user_id,
            'scopes' => $apiKey->scopes,
            'rate_limit' => $apiKey->rate_limit,
        ]);
        $request->session()->flash('new_api_key', ['name' => $apiKey->name, 'key' => $plaintext, 'rotated' => false]);

        return back()->with('success', 'API key created. Copy the secret now.');
    }

    public function updateApiKey(Request $request, ApiKey $apiKey)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'scopes' => ['required', 'array', 'min:1'],
            'scopes.*' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9*:_-]+$/'],
            'rate_limit' => ['required', 'integer', 'min:1', 'max:100000'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $apiKey->update([
            ...$validated,
            'expires_at' => filled($validated['expires_at'] ?? null) ? $validated['expires_at'] : null,
        ]);
        $this->record($request, 'api_key', (string) $apiKey->id, 'api_key.updated', "API key {$apiKey->name} was updated.", [
            'scopes' => $apiKey->scopes,
            'rate_limit' => $apiKey->rate_limit,
            'expires_at' => $apiKey->expires_at?->toISOString(),
        ]);

        return back()->with('success', 'API key settings updated.');
    }

    public function rotateApiKey(Request $request, ApiKey $apiKey)
    {
        $plaintext = ApiKey::generate();
        $apiKey->update(['key' => $plaintext, 'last_used_at' => null]);
        $this->record($request, 'api_key', (string) $apiKey->id, 'api_key.rotated', "API key {$apiKey->name} was rotated.");
        $request->session()->flash('new_api_key', ['name' => $apiKey->name, 'key' => $plaintext, 'rotated' => true]);

        return back()->with('success', 'API key rotated. Copy the new secret now.');
    }

    public function auditLog(Request $request)
    {
        $action = trim((string) $request->query('action', ''));
        $logs = AdminAuditLog::with('actor:id,name,email')->when($action, fn ($query) => $query->where('action', $action))
            ->latest()->paginate(30)->withQueryString()->through(fn (AdminAuditLog $log) => $this->auditSummary($log));

        return Inertia::render('Admin/AuditLog', ['logs' => $logs, 'filters' => ['action' => $action]]);
    }

    public function toggleUser(Request $request, User $user)
    {
        abort_if($user->is($request->user()), 422, 'You cannot suspend your own account.');
        $user->update(['is_suspended' => ! $user->is_suspended]);
        $this->record($request, 'user', (string) $user->id, $user->is_suspended ? 'user.suspended' : 'user.reactivated', "{$user->name} was ".($user->is_suspended ? 'suspended' : 'reactivated').'.');
        return back()->with('success', $user->is_suspended ? 'User suspended.' : 'User reactivated.');
    }

    public function toggleAdmin(Request $request, User $user)
    {
        abort_if($user->is($request->user()), 422, 'You cannot change your own admin access.');
        $user->update(['is_admin' => ! $user->is_admin]);
        $this->record($request, 'user', (string) $user->id, $user->is_admin ? 'user.admin_granted' : 'user.admin_revoked', "Platform admin access was ".($user->is_admin ? 'granted to' : 'removed from')." {$user->name}.");
        return back()->with('success', $user->is_admin ? 'Platform admin access granted.' : 'Admin access removed.');
    }

    public function revokeKey(Request $request, ApiKey $apiKey)
    {
        $name = $apiKey->name;
        $id = (string) $apiKey->id;
        $apiKey->delete();
        $this->record($request, 'api_key', $id, 'api_key.revoked', "API key {$name} was revoked.");
        return back()->with('success', 'API key revoked.');
    }

    public function toggleMod(Request $request, Mod $mod)
    {
        $mod->update(['is_suspended' => ! $mod->is_suspended]);
        $this->record($request, 'mod', $mod->id, $mod->is_suspended ? 'mod.suspended' : 'mod.reactivated', "{$mod->name} was ".($mod->is_suspended ? 'suspended' : 'reactivated').'.');
        return back()->with('success', $mod->is_suspended ? 'Mod suspended from public access.' : 'Mod reactivated.');
    }

    public function syncMod(Request $request, Mod $mod)
    {
        abort_unless(filled($mod->github_repository_url), 422, 'This mod has no GitHub repository connected.');
        SyncGithubMod::dispatch($mod->id, $request->user()->id);
        $this->record($request, 'mod', $mod->id, 'mod.github_sync_queued', "A GitHub sync was queued for {$mod->name}.");
        return back()->with('success', "GitHub sync queued for {$mod->name}.");
    }

    private function modSummary(Mod $mod): array
    {
        return [
            'id' => $mod->id,
            'name' => $mod->name,
            'slug' => $mod->slug,
            'owner' => $mod->owner?->name ?? 'Unknown',
            'pages_count' => $mod->pages_count ?? $mod->pages()->count(),
            'collaborators_count' => $mod->collaborators_count ?? null,
            'is_suspended' => $mod->is_suspended,
            'github_connected' => filled($mod->github_repository_url),
            'visibility' => $mod->visibility,
            'updated_at' => $mod->updated_at->diffForHumans(),
        ];
    }

    private function auditSummary(AdminAuditLog $log): array
    {
        return [
            'id' => $log->id,
            'actor' => $log->actor?->name ?? 'System',
            'action' => $log->action,
            'description' => $log->description,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'metadata' => $log->metadata,
            'created_at' => $log->created_at->diffForHumans(),
        ];
    }

    private function record(Request $request, string $subjectType, string $subjectId, string $action, string $description, array $metadata = []): void
    {
        AdminAuditLog::create([
            'actor_id' => $request->user()->id,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ?: null,
        ]);
    }
}
