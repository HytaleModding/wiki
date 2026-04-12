<?php

namespace App\Console\Commands;

use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Console\Command;

class MakeApiKey extends Command
{
    protected $signature = 'make:apikey
                            {user : Username or email address of the user}
                            {--name= : Label for the key (default: "CLI Generated Key")}
                            {--scopes= : Comma-separated scopes e.g. read:mods:index,read:mods:search}
                            {--rate= : Requests per minute (default: 60)}
                            {--expires= : Expiry date in YYYY-MM-DD format (optional)}';

    protected $description = 'Create an API key for a user by their username or email';

    public function handle(): int
    {
        $identifier = $this->argument('user');

        $user = User::where('email', $identifier)
            ->orWhere('name', $identifier)
            ->first();

        if (! $user) {
            $this->error("No user found matching: {$identifier}");

            return self::FAILURE;
        }

        $this->info("Found user: <fg=cyan>{$user->name}</> (<fg=cyan>{$user->email}</>)");

        if ($this->input->isInteractive() && ! $this->confirm('Create an API key for this user?', true)) {
            $this->line('Aborted.');

            return self::SUCCESS;
        }

        $name = $this->option('name') ?? 'CLI Generated Key';
        $rate = (int) ($this->option('rate') ?? 60);
        $expires = $this->option('expires');

        $scopes = $this->resolveScopes();

        // Validate expiry date if provided
        if ($expires && ! strtotime($expires)) {
            $this->error("Invalid date format for --expires: {$expires}. Use YYYY-MM-DD.");

            return self::FAILURE;
        }

        $plaintext = ApiKey::generate();

        $apiKey = $user->apiKeys()->create([
            'name' => $name,
            'key' => $plaintext,
            'scopes' => $scopes,
            'rate_limit' => $rate,
            'expires_at' => $expires ? \Carbon\Carbon::parse($expires)->endOfDay() : null,
        ]);

        $this->newLine();
        $this->components->twoColumnDetail('<fg=green;options=bold>API Key Created</>');
        $this->components->twoColumnDetail('User', "{$user->name} ({$user->email})");
        $this->components->twoColumnDetail('Key Name', $apiKey->name);
        $this->components->twoColumnDetail('Rate Limit', "{$apiKey->rate_limit} req/min");
        $this->components->twoColumnDetail('Scopes', empty($scopes) ? '<fg=yellow>none (full access)</>' : implode(', ', $scopes));
        $this->components->twoColumnDetail('Expires', $apiKey->expires_at?->toDateString() ?? '<fg=yellow>never</>');
        $this->newLine();

        $this->line('  <options=bold>API Key (copy now — will not be shown again):</>');
        $this->newLine();
        $this->line("  <fg=cyan;options=bold>  {$plaintext}  </>");
        $this->newLine();

        $this->components->warn('Store this key securely. It cannot be recovered.');
        $this->newLine();

        return self::SUCCESS;
    }

    private const AVAILABLE_SCOPES = [
        'read:mods',
        'read:mods:*',
        'read:mods:index',
        'read:mods:show',
        'read:mods:search',
        'read:mods:getPageContent',
        '*:*  (full access)',
    ];

    /**
     * If --scopes was passed, parse and return it.
     * Otherwise (interactive mode), present a checkbox menu.
     * In non-interactive mode with no --scopes, default to full access.
     */
    private function resolveScopes(): array
    {
        if ($this->option('scopes')) {
            return array_values(array_filter(
                array_map('trim', explode(',', $this->option('scopes')))
            ));
        }

        if (! $this->input->isInteractive()) {
            return [];
        }

        $this->newLine();
        $this->line('  <options=bold>Select scopes for this key:</>');
        $this->line('  <fg=gray>Space to toggle, Enter to confirm. Leave all unchecked for full access.</>');
        $this->newLine();

        $selected = $this->choice(
            question: 'Scopes',
            choices: self::AVAILABLE_SCOPES,
            default: null,
            attempts: null,
            multiple: true,
        );

        if (in_array('*:*  (full access)', (array) $selected, strict: true)) {
            $this->line('  <fg=yellow>Full access selected — no scope restrictions.</>');

            return [];
        }

        $scopes = array_values(array_filter((array) $selected));

        if ($this->confirm('Add any custom scopes not in the list above?', false)) {
            $this->line('  <fg=gray>Enter one scope per line (e.g. read:mods:search). Empty line to finish.</>');

            while (true) {
                $custom = $this->ask('Custom scope (or press Enter to finish)');

                if (blank($custom)) {
                    break;
                }

                if (! preg_match('/^[a-z*]+:[A-Za-z0-9_*]+(?::[A-Za-z0-9_*]+)*$/', $custom)) {
                    $this->line('  <fg=red>Invalid format. Use action:resource[:subresource...] (e.g. read:mods:search)</>  ');

                    continue;
                }

                if (! in_array($custom, $scopes, strict: true)) {
                    $scopes[] = $custom;
                    $this->line("  <fg=green>✓ Added:</> {$custom}");
                }
            }
        }

        if (empty($scopes)) {
            $this->line('  <fg=yellow>No scopes selected — key will have full access.</>');
        }

        return $scopes;
    }
}
