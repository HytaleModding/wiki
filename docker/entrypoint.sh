#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html

# Only run the full application bootstrap when starting the server
if [ "${1:-}" != "supervisord" ]; then
    exec "$@"
fi

# Ensure writable directories exist.
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache

# Fail if the application key is not set.
if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY is not set. Generate one locally with:" >&2
    echo "       php artisan key:generate --show" >&2
    exit 1
fi

# Public storage symlink (uploads are served from the public disk).
php artisan storage:link --force || true

# Rebuild discovery + caches using the runtime environment.
php artisan package:discover --ansi
php artisan config:cache
php artisan event:cache
php artisan view:cache

# Optionally run migrations against the external database on startup.
# Enable by setting RUN_MIGRATIONS=true in the environment.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

exec "$@"
