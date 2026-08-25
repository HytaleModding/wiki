<?php

namespace App\Services;

use App\Models\Mod;
use Illuminate\Support\Facades\Http;

class CustomDomainService
{
    public function pointsToApplication(string $domain): bool
    {
        $expectedTarget = rtrim(strtolower((string) config('custom-domains.target')), '.');

        if ($expectedTarget === '') {
            return false;
        }

        $records = dns_get_record($domain, DNS_CNAME) ?: [];

        return collect($records)->contains(function (array $record) use ($expectedTarget) {
            return rtrim(strtolower((string) ($record['target'] ?? '')), '.') === $expectedTarget;
        });
    }

    /**
     * Make a real HTTPS request so Caddy obtains the certificate before we
     * report the domain as ready. This must be run from a machine that can
     * resolve the public CNAME and reach the Caddy listener.
     */
    public function provisionCertificate(Mod $mod): bool
    {
        try {
            return Http::timeout(90)
                ->connectTimeout(15)
                ->get('https://'.$mod->custom_domain.'/')
                ->successful();
        } catch (\Throwable $exception) {
            report($exception);

            return false;
        }
    }
}
