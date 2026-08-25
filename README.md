<p align="center"><a href="https://hytalemodding.dev"><img src="https://cdn.internal.hytalemodding.dev/assets/HytaleLogo_DiscordBannerV6.png" width="600"></a></p>

# HytaleModding Wiki

This is the official Wiki project from HytaleModding, hosted at https://wiki.hytalemodding.dev. It allows mod teams to create and manage documentation for their mods, making it easy for players and developers to find the information they need.

## Requirements

Before you start, make sure you have the following installed:

- PHP 8.2 or newer
- Composer
- Node.js 18 or newer
- Bun
- Git

You also need these PHP extensions enabled:

- `fileinfo`
- `iconv`
- `pdo_sqlite`
- `sqlite3`

You can check the PHP extensions required by the lockfile with:

```bash
composer check-platform-reqs
```

## Getting Started

Clone the repository and install the project dependencies:

```bash
git clone https://github.com/HytaleModding/wiki.git
cd wiki
composer install
bun install
```

Create your local environment file and application key:

```bash
cp .env.example .env
php artisan key:generate
```

Create the local SQLite database, run migrations, seed demo data, and link storage:

```bash
touch database/database.sqlite
php artisan migrate --seed
php artisan storage:link
```

Start the local development server:

```bash
composer dev
```

The app will be available at [http://localhost:8000](http://localhost:8000).

## GitHub Sync

GitHub sync is event-driven through a GitHub App. Create an app with **Contents: Read-only** and **Metadata: Read-only** repository permissions, enable user authorization (OAuth), install it on the repositories that provide documentation, and subscribe it to **Push** events. Set its webhook URL to `https://your-wiki-domain/webhooks/github` and its user authorization callback URL to `https://your-wiki-domain/api/github/callback`.

Configure these values in production:

```dotenv
GITHUB_APP_ID=your-app-id
GITHUB_APP_CLIENT_ID=your-client-id
GITHUB_APP_CLIENT_SECRET=your-client-secret
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=a-long-random-secret
```

Each verified push queues a sync for the matching repository. Keep a queue worker running in production. `GITHUB_TOKEN` remains supported only as a legacy fallback; GitHub App installation tokens are used for normal synchronization.

## Demo Accounts

After seeding the database, you can log in with:

| Email | Password |
| --- | --- |
| `admin@example.com` | `password` |
| `user@example.com` | `password` |
| `collaborator@example.com` | `password` |

## Development Commands

Run the frontend development server only:

```bash
bun run dev
```

Build frontend assets:

```bash
bun run build
```

Run frontend formatting, linting, and type checks:

```bash
bun run quality
```

Run PHP tests and style checks:

```bash
composer test
```

Format PHP code with Laravel Pint:

```bash
./vendor/bin/pint
```

## Resetting Local Data

To rebuild your local database from scratch and seed it again:

```bash
php artisan migrate:fresh --seed
```

## Troubleshooting

If `composer install` fails with a message like `requires ext-iconv`, your PHP CLI installation is missing a required extension. Composer can detect and report missing extensions, but extensions are installed through your operating system, package manager, PHP version manager, or Docker image.

Run this to see which `php.ini` file your terminal PHP is using:

```bash
php --ini
```

Run this to list enabled PHP extensions:

```bash
php -m
```

For the most reproducible local setup, use a PHP environment manager or Docker image that includes the required extensions instead of installing extensions one by one on each machine.

## Contributing

If you'd like to contribute to this project, you can follow our [Contributing Guide](./CONTRIBUTING.md).
