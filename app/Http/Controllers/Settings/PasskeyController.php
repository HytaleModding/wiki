<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasskeyController extends Controller
{
    /**
     * Show the user's passkey settings.
     */
    public function show(Request $request): Response
    {
        return Inertia::render('settings/passkeys', [
            'passkeys' => $request->user()->passkeys()
                ->latest()
                ->get()
                ->map(fn ($passkey) => [
                    'id' => $passkey->id,
                    'name' => $passkey->name,
                    'authenticator' => $passkey->authenticator,
                    'created_at' => $passkey->created_at,
                    'last_used_at' => $passkey->last_used_at,
                ]),
            'status' => $request->session()->get('status'),
        ]);
    }
}
