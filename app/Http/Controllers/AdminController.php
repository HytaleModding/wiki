<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\ApiKeyLog;
use App\Models\Mod;
use App\Models\User;
use App\Jobs\SyncGithubMod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $users = User::query()->withCount(['ownedMods', 'apiKeys'])
            ->latest()->limit(8)->get()
            ->map(fn (User $user) => [
                'id' => $user->id, 'name' => $user->name, 'username' => $user->username,
                'email' => $user->email, 'avatar' => $user->avatar, 'is_admin' => $user->is_admin,
                'is_suspended' => $user->is_suspended, 'owned_mods_count' => $user->owned_mods_count,
                'api_keys_count' => $user->api_keys_count, 'created_at' => $user->created_at->toISOString(),
            ]);

        $keys = ApiKey::with('user:id,name,username')->latest()->limit(8)->get()
            ->map(fn (ApiKey $key) => [
                'id' => $key->id, 'name' => $key->name, 'prefix' => substr($key->key, 0, 8).'••••••••',
                'user' => $key->user?->name ?? 'Deleted user', 'scopes' => $key->scopes ?? [],
                'last_used_at' => $key->last_used_at?->diffForHumans(), 'expires_at' => $key->expires_at?->toISOString(),
            ]);

        $activity = ApiKeyLog::with('apiKey.user')->latest()->limit(6)->get()->map(fn (ApiKeyLog $log) => [
            'id' => $log->id, 'method' => $log->method, 'path' => $log->path, 'status_code' => $log->status_code,
            'user' => $log->apiKey?->user?->name ?? 'Unknown', 'created_at' => $log->created_at->diffForHumans(),
        ]);

        $mods = Mod::with(['owner:id,name,username', 'pages' => fn ($query) => $query->latest('updated_at')->limit(3)])
            ->withCount('pages')->latest()->limit(6)->get()->map(fn (Mod $mod) => [
            'id' => $mod->id, 'name' => $mod->name, 'slug' => $mod->slug,
            'owner' => $mod->owner?->name ?? 'Unknown', 'pages_count' => $mod->pages_count,
            'is_suspended' => $mod->is_suspended, 'github_connected' => filled($mod->github_repository_url),
            'updated_at' => $mod->updated_at->diffForHumans(),
            'activity' => $mod->pages->map(fn ($page) => ['title' => $page->title, 'updated_at' => $page->updated_at->diffForHumans()])->values(),
        ]);

        return Inertia::render('admin', [
            'metrics' => [
                'users' => User::count(), 'mods' => Mod::count(), 'api_keys' => ApiKey::count(),
                'requests_today' => ApiKeyLog::where('created_at', '>=', now()->startOfDay())->count(),
            ], 'users' => $users, 'keys' => $keys, 'activity' => $activity, 'mods' => $mods,
        ]);
    }

    public function toggleUser(Request $request, User $user)
    {
        $this->ensureAdmin($request);
        abort_if($user->is($request->user()), 422, 'You cannot suspend your own account.');
        $user->update(['is_suspended' => ! $user->is_suspended]);
        return back()->with('success', $user->is_suspended ? 'User suspended.' : 'User reactivated.');
    }

    public function toggleAdmin(Request $request, User $user)
    {
        $this->ensureAdmin($request);
        abort_if($user->is($request->user()), 422, 'You cannot change your own admin access.');
        $user->update(['is_admin' => ! $user->is_admin]);
        return back()->with('success', $user->is_admin ? 'Platform admin access granted.' : 'Admin access removed.');
    }

    public function revokeKey(Request $request, ApiKey $apiKey)
    {
        $this->ensureAdmin($request);
        $apiKey->delete();
        return back()->with('success', 'API key revoked.');
    }

    public function toggleMod(Request $request, Mod $mod)
    {
        $this->ensureAdmin($request);
        $mod->update(['is_suspended' => ! $mod->is_suspended]);
        return back()->with('success', $mod->is_suspended ? 'Mod suspended from public access.' : 'Mod reactivated.');
    }

    public function syncMod(Request $request, Mod $mod)
    {
        $this->ensureAdmin($request);
        abort_unless(filled($mod->github_repository_url), 422, 'This mod has no GitHub repository connected.');
        SyncGithubMod::dispatch($mod->id);
        return back()->with('success', "GitHub sync queued for {$mod->name}.");
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->isPlatformAdmin(), 403);
    }
}
