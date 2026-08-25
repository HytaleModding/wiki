<?php

namespace App\Http\Controllers;

use App\Jobs\SyncGithubMod;
use App\Models\Mod;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GitHubWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        if (! $this->hasValidSignature($request)) {
            abort(401);
        }

        if ($request->header('X-GitHub-Event') !== 'push') {
            return response()->noContent();
        }

        $repositoryUrl = $request->input('repository.html_url');
        if (! is_string($repositoryUrl) || blank($repositoryUrl)) {
            return response()->noContent();
        }

        $normalizedUrl = rtrim(strtolower($repositoryUrl), '/');
        Mod::query()->whereNotNull('github_repository_url')->get()
            ->filter(fn (Mod $mod) => rtrim(strtolower((string) $mod->github_repository_url), '/') === $normalizedUrl)
            ->each(fn (Mod $mod) => SyncGithubMod::dispatch($mod->id));

        return response()->noContent(Response::HTTP_ACCEPTED);
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.github.webhook_secret');
        $signature = $request->header('X-Hub-Signature-256');

        if (blank($secret) || ! is_string($signature)) {
            return false;
        }

        return hash_equals('sha256='.hash_hmac('sha256', $request->getContent(), $secret), $signature);
    }
}
