install:
    bun install
    php artisan key:generate
    php artisan migrate --seed

run-dev:
    bun run dev

run-server:
    php artisan serve
