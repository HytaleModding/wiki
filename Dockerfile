##############################################################################
# Stage 1 — Composer dependencies
##############################################################################
FROM composer:2 AS vendor

WORKDIR /app

# Install dependencies.
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative


##############################################################################
# Stage 2 — Frontend build (Bun + Vite).
##############################################################################
FROM php:8.4-cli-bookworm AS frontend

WORKDIR /app

# Tools + the PHP extensions needed to boot the app for Wayfinder generation.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl unzip git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions mbstring pdo_sqlite intl bcmath

# Bun (JS dependency manager + build runner) installed into /usr/local/bin.
ENV BUN_INSTALL=/usr/local
RUN curl -fsSL https://bun.sh/install | bash

# JS deps (cached on lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Bring in PHP vendor (needed to boot the app for wayfinder) + source
COPY --from=vendor /app/vendor ./vendor
COPY . .

# Throwaway key so artisan can boot during the asset build only.
RUN cp .env.example .env && php artisan key:generate --force

ARG VITE_APP_NAME="HytaleModding Wiki"
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build client assets + the SSR bundle (bootstrap/ssr/ssr.mjs)
RUN bun run build:ssr
RUN rm -rf node_modules && bun install --frozen-lockfile --production


##############################################################################
# Stage 3 — Production runtime (Nginx + PHP-FPM + queue worker + Inertia SSR)
##############################################################################
FROM php:8.4-fpm-alpine AS app

RUN apk add --no-cache \
    nginx \
    supervisor \
    nodejs \
    bash \
    tzdata \
    fcgi

COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions \
    pdo_mysql \
    pdo_pgsql \
    pdo_sqlite \
    mbstring \
    bcmath \
    gd \
    zip \
    intl \
    exif \
    pcntl \
    opcache

WORKDIR /var/www/html

# Application source, then overlay the production vendor + built assets.
COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build
COPY --from=frontend /app/bootstrap/ssr ./bootstrap/ssr
# Production node_modules for the Inertia SSR node process.
COPY --from=frontend /app/node_modules ./node_modules

# Container configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/app/public storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    # Never ship a baked .env — configuration is injected at runtime.
    && rm -f /var/www/html/.env

EXPOSE 80

ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
