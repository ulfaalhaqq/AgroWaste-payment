#!/usr/bin/env bash
set -e

php artisan storage:link || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache

php artisan serve --host=0.0.0.0 --port=${PORT:-8000}