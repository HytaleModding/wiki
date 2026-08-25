<?php

namespace App\Jobs;

use App\Mail\CustomDomainReady;
use App\Models\Mod;
use App\Services\CustomDomainService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class ProvisionCustomDomain implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $modId) {}

    public function handle(CustomDomainService $domains): void
    {
        $mod = Mod::with('owner')->find($this->modId);

        if (! $mod || blank($mod->custom_domain)) {
            return;
        }

        if ($mod->domain_status === 'ready') {
            $this->sendReadyEmail($mod);

            return;
        }

        if (! $domains->pointsToApplication($mod->custom_domain)) {
            $mod->update([
                'domain_verified' => false,
                'domain_status' => 'pending_dns',
                'domain_checked_at' => now(),
            ]);

            return;
        }

        $mod->update([
            'domain_verified' => true,
            'domain_status' => 'provisioning',
            'domain_checked_at' => now(),
        ]);

        if (! config('custom-domains.enabled') || ! $domains->provisionCertificate($mod)) {
            return;
        }

        $mod->update([
            'domain_status' => 'ready',
            'domain_ready_at' => now(),
        ]);

        $this->sendReadyEmail($mod);
    }

    private function sendReadyEmail(Mod $mod): void
    {
        if ($mod->domain_ready_email_sent_at) {
            return;
        }

        Mail::to($mod->owner->email)->send(new CustomDomainReady($mod));

        $mod->update(['domain_ready_email_sent_at' => now()]);
    }
}
