FROM oven/bun:1 AS assets

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY . .
RUN bun run build

FROM php:8.3-fpm-alpine AS production

RUN apk add --no-cache \
    git zip unzip libzip-dev freetype-dev libjpeg-turbo-dev libpng-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql zip exif pcntl bcmath gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY --chown=www-data:www-data . .
COPY --from=assets --chown=www-data:www-data /app/public/build ./public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && php artisan optimize:clear \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

CMD ["php-fpm"]
