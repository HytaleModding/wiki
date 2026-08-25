# syntax=docker/dockerfile:1

FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-scripts
COPY . ./
RUN composer dump-autoload --no-dev --classmap-authoritative --no-scripts \
    && php artisan package:discover --ansi

FROM oven/bun:1.3.10 AS frontend
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends php-cli php-intl php-mbstring php-xml \
    && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY --from=vendor /app /app
RUN php artisan wayfinder:generate --with-form
RUN bun run build

FROM dunglas/frankenphp:php8.3-bookworm AS production
WORKDIR /app

RUN install-php-extensions pdo_mysql intl opcache zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=vendor /app /app
COPY --from=frontend /app/public/build /app/public/build
COPY deploy/frankenphp/Caddyfile /etc/frankenphp/Caddyfile
COPY deploy/docker-entrypoint.sh /usr/local/bin/wiki-entrypoint

RUN chmod +x /usr/local/bin/wiki-entrypoint \
    && mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1

EXPOSE 8080 8443
ENTRYPOINT ["/usr/local/bin/wiki-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
