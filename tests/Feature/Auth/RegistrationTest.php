<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_new_users_must_accept_the_terms_and_privacy_policy()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('terms');
        $this->assertGuest();
    }
}
