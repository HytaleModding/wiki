<?php

namespace App\Console\Commands;

use App\Jobs\ProvisionCustomDomain;
use App\Models\Mod;
use Illuminate\Console\Command;

class ProvisionCustomDomains extends Command
{
    protected $signature = 'custom-domains:provision';

    protected $description = 'Verify pending custom-domain CNAME records and provision certificates';

    public function handle(): int
    {
        Mod::query()
            ->whereNotNull('custom_domain')
            ->where(function ($query) {
                $query->whereIn('domain_status', ['pending_dns', 'provisioning'])
                    ->orWhere(function ($query) {
                        $query->where('domain_status', 'ready')
                            ->whereNull('domain_ready_email_sent_at');
                    });
            })
            ->pluck('id')
            ->each(fn (string $id) => ProvisionCustomDomain::dispatch($id));

        return self::SUCCESS;
    }
}
