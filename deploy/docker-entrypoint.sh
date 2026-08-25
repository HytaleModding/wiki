#!/bin/sh
set -eu

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache

# The web container is the single migration runner. Queue and scheduler use a
# PHP entrypoint directly, so deploys do not race schema migrations.
php artisan migrate --force --no-interaction
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
