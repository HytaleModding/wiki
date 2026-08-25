<?php

namespace App\Http\Controllers;

use App\Models\GitHubConnection;
use App\Models\Mod;
use App\Services\GitHubRepositoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GitHubConnectionController extends Controller
{
    public function redirect(Mod $mod): RedirectResponse
    {
        $this->authorizeSettings($mod);
        abort_unless(
            filled(config('services.github.client_id')) &&
            filled(config('services.github.client_secret')) &&
            filled(config('services.github.app_slug')),
            503,
            'GitHub App installation is not configured.'
        );

        $state = Str::random(64);
        session(['github_oauth_state' => $state, 'github_oauth_mod_id' => $mod->id]);

        return redirect()->away('https://github.com/apps/'.config('services.github.app_slug').'/installations/new?'.http_build_query([
            'state' => $state,
        ]));
    }

    public function callback(Request $request, GitHubRepositoryService $repositories): RedirectResponse
    {
        $modId = session()->pull('github_oauth_mod_id');
        $state = session()->pull('github_oauth_state');
        abort_unless(is_string($state) && hash_equals($state, (string) $request->query('state')), 403, 'Invalid GitHub authorization state.');
        abort_unless(is_string($modId), 403);

        $mod = Mod::findOrFail($modId);
        $this->authorizeSettings($mod);

        if ($request->filled('error')) {
            return redirect()->route('mods.edit', $mod)->withErrors(['github' => 'GitHub authorization was cancelled.']);
        }

        $tokenResponse = Http::asForm()->acceptJson()->post('https://github.com/login/oauth/access_token', [
            'client_id' => config('services.github.client_id'),
            'client_secret' => config('services.github.client_secret'),
            'code' => $request->query('code'),
            'redirect_uri' => route('github.callback'),
        ]);
        if (! $tokenResponse->successful() || blank($tokenResponse->json('access_token'))) {
            return redirect()->route('mods.edit', $mod)->withErrors(['github' => 'GitHub authorization failed. Please try again.']);
        }

        $userResponse = Http::withToken($tokenResponse->json('access_token'))->accept('application/vnd.github+json')->get('https://api.github.com/user');
        if (! $userResponse->successful() || ! is_int($userResponse->json('id'))) {
            return redirect()->route('mods.edit', $mod)->withErrors(['github' => 'GitHub account details could not be read.']);
        }

        $user = Auth::user();
        $connection = GitHubConnection::updateOrCreate(['user_id' => $user->id], [
            'github_user_id' => $userResponse->json('id'),
            'github_login' => (string) $userResponse->json('login'),
            ...$repositories->tokenAttributes($tokenResponse->json()),
        ]);

        return redirect()->route('mods.edit', $mod)->with('success', "Connected GitHub account @{$connection->github_login}. Choose a repository below.");
    }

    public function disconnect(Mod $mod): RedirectResponse
    {
        $this->authorizeSettings($mod);

        Auth::user()?->githubConnection()?->delete();

        return redirect()
            ->route('mods.edit', $mod)
            ->with('success', 'GitHub has been unlinked from your account.');
    }

    public function repositories(Mod $mod, GitHubRepositoryService $repositories)
    {
        $this->authorizeSettings($mod);

        try {
            return response()->json(['repositories' => $repositories->repositoriesFor(Auth::user())]);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function selectRepository(Request $request, Mod $mod, GitHubRepositoryService $repositories)
    {
        $this->authorizeSettings($mod);
        $validated = $request->validate(['repository_id' => ['required', 'integer']]);

        try {
            $repository = collect($repositories->repositoriesFor(Auth::user()))->firstWhere('id', (int) $validated['repository_id']);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if (! $repository) {
            return response()->json(['message' => 'That repository is no longer available to your GitHub App connection.'], 422);
        }

        $mod->update(['github_repository_url' => $repository['html_url']]);

        return response()->json(['repository' => $repository]);
    }

    private function authorizeSettings(Mod $mod): void
    {
        abort_unless($mod->userCan(Auth::user(), 'manage_settings'), 403);
    }
}
