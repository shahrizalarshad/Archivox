FROM php:8.4-fpm-alpine

# Pasang dependency sistem luar
RUN apk update && apk add --no-cache \
    build-base \
    shadow \
    curl \
    git \
    bash \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip

# Pasang extension PHP yang diperlukan
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install pdo_mysql gd zip bcmath

# Dapatkan Composer versi rasmi terbaru
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Tetapkan direktori kerja
WORKDIR /var/www

# Salin kebenaran folder asal
RUN chown -R www-data:www-data /var/www

USER www-data

EXPOSE 9000

CMD ["php-fpm"]
