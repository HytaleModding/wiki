<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GitHubAppTokenService
{
    public function tokenForRepository(string $owner, string $repo): ?string
    {
        $appId = config('services.github.app_id');
        $privateKey = config('services.github.private_key');

        if (blank($appId) || blank($privateKey)) {
            return config('services.github.token');
        }

        $installation = Http::withToken($this->appJwt())->accept('application/vnd.github+json')->withHeaders([
            'User-Agent' => 'wiki-mod-sync',
            'X-GitHub-Api-Version' => '2022-11-28',
        ])
            ->get("https://api.github.com/repos/{$owner}/{$repo}/installation");

        if (! $installation->successful()) {
            throw new RuntimeException("Unable to find the GitHub App installation for {$owner}/{$repo}.");
        }

        $installationId = (string) $installation->json('id');

        return Cache::remember("github-app-installation-token:{$installationId}", now()->addMinutes(50), function () use ($installationId): string {
            $response = Http::withToken($this->appJwt())->accept('application/vnd.github+json')->withHeaders([
                'User-Agent' => 'wiki-mod-sync',
                'X-GitHub-Api-Version' => '2022-11-28',
            ])
                ->post("https://api.github.com/app/installations/{$installationId}/access_tokens");

            if (! $response->successful() || blank($response->json('token'))) {
                throw new RuntimeException('Unable to create a GitHub App installation token.');
            }

            return (string) $response->json('token');
        });
    }

    private function appJwt(): string
    {
        $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $payload = $this->base64Url(json_encode(['iat' => now()->subMinute()->timestamp, 'exp' => now()->addMinutes(9)->timestamp, 'iss' => (string) config('services.github.app_id')], JSON_THROW_ON_ERROR));
        $unsignedToken = "{$header}.{$payload}";
        $privateKey = str_replace('\\n', "\n", (string) config('services.github.private_key'));

        if (! openssl_sign($unsignedToken, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Unable to sign the GitHub App authentication token.');
        }

        return $unsignedToken.'.'.$this->base64Url($signature);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
