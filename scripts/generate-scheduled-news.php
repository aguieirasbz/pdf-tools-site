<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Este script só pode ser executado pelo terminal/cron.' . PHP_EOL);
}

require dirname(__DIR__) . '/bootstrap.php';

use App\Model\NewsModel;
use App\Service\AutoNewsService;
use App\Service\NewsGeneratorService;

try {
    if (env_value('AUTO_NEWS_ENABLED') !== 'true') {
        throw new RuntimeException('Defina AUTO_NEWS_ENABLED=true no .env para liberar a geração automática.');
    }

    $service = new AutoNewsService(new NewsGeneratorService(services_config()), new NewsModel(database()));
    $result = $service->generateNext();
    echo sprintf("Notícia publicada: #%d — %s (%s)%s", $result['id'], $result['title'], $result['program'], PHP_EOL);
} catch (Throwable $error) {
    fwrite(STDERR, 'Erro: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
