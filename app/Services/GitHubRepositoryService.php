<?php

namespace App\Services;

use App\Models\GitHubConnection;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GitHubRepositoryService
{
    /** @return array<int, array{id:int,full_name:string,html_url:string,private:bool,default_branch:string}> */
    public function repositoriesFor(User $user): array
    {
        $connection = $user->githubConnection;
        if (! $connection) {
            throw new RuntimeException('Connect your GitHub account first.');
        }

        $token = $this->validAccessToken($connection);
        $repositories = [];
        foreach ($this->allInstallations($token) as $installation) {
            $installationId = $installation['id'] ?? null;
            if (! is_int($installationId)) {
                continue;
            }

            foreach ($this->allInstallationRepositories($token, $installationId) as $repository) {
                if (! isset($repository['id'], $repository['full_name'], $repository['html_url'])) {
                    continue;
                }

                $repositories[(int) $repository['id']] = [
                    'id' => (int) $repository['id'],
                    'full_name' => (string) $repository['full_name'],
                    'html_url' => (string) $repository['html_url'],
                    'private' => (bool) ($repository['private'] ?? false),
                    'default_branch' => (string) ($repository['default_branch'] ?? 'main'),
                ];
            }
        }

        return array_values($repositories);
    }

    /** @return array<int, array<string, mixed>> */
    private function allInstallations(string $token): array
    {
        $installations = [];
        for ($page = 1; ; $page++) {
            $response = $this->client($token)->get('https://api.github.com/user/installations', ['per_page' => 100, 'page' => $page]);
            if (! $response->successful()) {
                throw new RuntimeException('Unable to read your GitHub App installations. Reconnect GitHub and try again.');
            }

            $items = $response->json('installations', []);
            $installations = [...$installations, ...$items];
            if (count($items) < 100) {
                return $installations;
            }
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function allInstallationRepositories(string $token, int $installationId): array
    {
        $repositories = [];
        for ($page = 1; ; $page++) {
            $response = $this->client($token)->get("https://api.github.com/user/installations/{$installationId}/repositories", ['per_page' => 100, 'page' => $page]);
            if (! $response->successful()) {
                return [];
            }

            $items = $response->json('repositories', []);
            $repositories = [...$repositories, ...$items];
            if (count($items) < 100) {
                return $repositories;
            }
        }
    }

    private function validAccessToken(GitHubConnection $connection): string
    {
        if (! $connection->access_token_expires_at || $connection->access_token_expires_at->isAfter(now()->addMinutes(5))) {
            return $connection->access_token;
        }

        if (! $connection->refresh_token || ! $connection->refresh_token_expires_at?->isAfter(now())) {
            throw new RuntimeException('Your GitHub connection has expired. Please reconnect it.');
        }

        $response = Http::asForm()->acceptJson()->post('https://github.com/login/oauth/access_token', [
            'client_id' => config('services.github.client_id'),
            'client_secret' => config('services.github.client_secret'),
            'grant_type' => 'refresh_token',
            'refresh_token' => $connection->refresh_token,
        ]);
        if (! $response->successful() || blank($response->json('access_token'))) {
            throw new RuntimeException('Your GitHub connection has expired. Please reconnect it.');
        }

        $connection->update($this->tokenAttributes($response->json()));

        return $connection->access_token;
    }

    /** @param array<string, mixed> $token */
    public function tokenAttributes(array $token): array
    {
        return [
            'access_token' => (string) $token['access_token'],
            'refresh_token' => $token['refresh_token'] ?? null,
            'access_token_expires_at' => isset($token['expires_in']) ? now()->addSeconds((int) $token['expires_in']) : null,
            'refresh_token_expires_at' => isset($token['refresh_token_expires_in']) ? now()->addSeconds((int) $token['refresh_token_expires_in']) : null,
        ];
    }

    private function client(string $token)
    {
        return Http::withToken($token)->accept('application/vnd.github+json')->withHeaders([
            'User-Agent' => 'wiki-mod-sync',
            'X-GitHub-Api-Version' => '2022-11-28',
        ]);
    }
}
