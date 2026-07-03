<?php

// Exemplo de app PHP (server-side) consumindo o Unleash via unleash/client.
// composer require unleash/client guzzlehttp/guzzle symfony/cache

require __DIR__ . '/vendor/autoload.php';

use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Cache\Psr16Cache;
use Unleash\Client\UnleashBuilder;

$unleash = UnleashBuilder::create()
    // Backend/client API token criado na Unleash (Admin UI > Settings > API access).
    // Nunca use um token de backend em código que roda no navegador ou em um executável distribuído.
    ->withAppUrl(getenv('UNLEASH_URL') ?: 'http://localhost:4242/api')
    ->withInstanceId('php-app')
    ->withAppName('meu-app-php')
    ->withHeader('Authorization', getenv('UNLEASH_BACKEND_TOKEN') ?: 'default:development.unleash-insecure-api-token')
    ->withCacheHandler(new Psr16Cache(new FilesystemAdapter()))
    ->withCacheTimeToLive(15)
    ->build();

if ($unleash->isEnabled('minha-feature-exemplo')) {
    echo "Feature habilitada\n";
} else {
    echo "Feature desabilitada\n";
}
