<?php

namespace Tests\Feature;

use App\Models\Mod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_caddy_can_only_request_certificates_for_verified_domains(): void
    {
        $mod = Mod::factory()->create([
            'custom_domain' => 'docs.example.com',
            'domain_verified' => true,
            'domain_status' => 'provisioning',
        ]);

        $this->get('/internal/caddy/allow-domain?domain=docs.example.com')->assertNoContent();
        $this->get('/internal/caddy/allow-domain?domain=other.example.com')->assertForbidden();
    }

    public function test_caddy_cannot_request_a_certificate_before_domain_verification(): void
    {
        Mod::factory()->create([
            'custom_domain' => 'docs.example.com',
            'domain_verified' => false,
            'domain_status' => 'pending_dns',
        ]);

        $this->get('/internal/caddy/allow-domain?domain=docs.example.com')->assertForbidden();
    }
}
