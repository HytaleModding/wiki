<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use App\Models\ApiKeyLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateAPIKey
{
    /**
     * Accept the key from either:
     *   Authorization: Bearer <key>
     *   X-API-Key: <key>
     */
    public function handle(Request $request, Closure $next, string ...$requiredScopes): Response
    {
        $token = $request->bearerToken() ?? $request->header('X-API-Key');

        if (! $token) {
            return $this->unauthorized('API key required. Provide it via the Authorization header or X-API-Key.');
        }

        $apiKey = ApiKey::where('key', $token)->first();

        if (! $apiKey) {
            return $this->unauthorized('Invalid API key.');
        }

        if ($apiKey->isExpired()) {
            return $this->unauthorized('This API key has expired.');
        }

        if (! $apiKey->user || $apiKey->user->is_suspended) {
            return $this->unauthorized('The account for this API key is suspended.');
        }

        if ($this->isRateLimited($apiKey)) {
            return response()->json([
                'error' => 'Rate limit exceeded.',
                'limit' => $apiKey->rate_limit,
                'message' => "This key allows {$apiKey->rate_limit} requests per minute.",
            ], 429, [
                'X-RateLimit-Limit' => $apiKey->rate_limit,
                'X-RateLimit-Remaining' => 0,
                'Retry-After' => 60,
            ]);
        }

        if (! empty($requiredScopes) && ! $apiKey->hasAllScopes($requiredScopes)) {
            return response()->json([
                'error' => 'Insufficient permissions.',
                'required_scopes' => $requiredScopes,
                'key_scopes' => $apiKey->scopes,
            ], 403);
        }

        Auth::login($apiKey->user);
        $request->attributes->set('api_key', $apiKey);

        $lastUsedCacheKey = "api_key_last_used:{$apiKey->id}";
        if (! Cache::has($lastUsedCacheKey)) {
            $apiKey->update(['last_used_at' => now()]);
            Cache::put($lastUsedCacheKey, true, 60);
        }

        $startTime = microtime(true);
        $response = $next($request);
        $elapsedMs = (int) ((microtime(true) - $startTime) * 1000);

        $this->logRequest($apiKey, $request, $response, $elapsedMs);

        // Attach rate-limit headers to the response
        $remaining = $this->getRemainingRequests($apiKey);
        $response->headers->set('X-RateLimit-Limit', $apiKey->rate_limit);
        $response->headers->set('X-RateLimit-Remaining', max(0, $remaining));

        return $response;
    }

    private function isRateLimited(ApiKey $apiKey): bool
    {
        $cacheKey = "api_key_rate_limit:{$apiKey->id}";
        $hits = (int) Cache::get($cacheKey, 0);

        if ($hits >= $apiKey->rate_limit) {
            return true;
        }

        if ($hits === 0) {
            Cache::put($cacheKey, 1, 60);
        } else {
            Cache::increment($cacheKey);
        }

        return false;
    }

    private function getRemainingRequests(ApiKey $apiKey): int
    {
        $hits = (int) Cache::get("api_key_rate_limit:{$apiKey->id}", 0);

        return $apiKey->rate_limit - $hits;
    }

    private function logRequest(ApiKey $apiKey, Request $request, Response $response, int $elapsedMs): void
    {
        try {
            ApiKeyLog::create([
                'api_key_id' => $apiKey->id,
                'method' => $request->method(),
                'path' => $request->path(),
                'status_code' => $response->getStatusCode(),
                'ip_address' => $request->ip(),
                'response_ms' => $elapsedMs,
            ]);
        } catch (\Throwable) {
        }
    }

    private function unauthorized(string $message): Response
    {
        return response()->json(['error' => $message], 401);
    }
}
