<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasskeySettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_passkey_settings_require_authentication(): void
    {
        $response = $this->get(route('passkeys.show'));

        $response->assertRedirect(route('login'));
    }

    public function test_passkey_settings_require_recent_password_confirmation(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this->actingAs($user)->get(route('passkeys.show'));

        $response->assertRedirect(route('password.confirm'));
    }

    public function test_user_can_view_their_passkey_settings(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $response = $this
            ->actingAs($user)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->get(route('passkeys.show'));

        $response
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/passkeys')
                ->has('passkeys', 0));
    }
}
