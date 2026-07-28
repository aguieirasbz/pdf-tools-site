<?php

declare(strict_types=1);
require dirname(__DIR__) . '/bootstrap.php';

use App\Model\NewsModel;
$slug = trim((string) ($_GET['slug'] ?? ''));
$newsModel = new NewsModel(database());
$article = $slug !== '' ? $newsModel->findPublishedBySlug($slug) : null;
if (!$article) { http_response_code(404); }
$visitorId = $_COOKIE['pdf_true_visitor'] ?? '';
if ($article) {
    if (!preg_match('/^[a-f0-9]{64}$/', $visitorId)) {
        $visitorId = bin2hex(random_bytes(32));
        setcookie('pdf_true_visitor', $visitorId, [
            'expires' => time() + (365 * 24 * 60 * 60), 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true, 'samesite' => 'Lax',
        ]);
    }
    $newsModel->recordView((int) $article['id'], hash('sha256', $visitorId));
}
$sources = $article ? (json_decode($article['official_sources'], true) ?: []) : [];
?><!DOCTYPE html>
<html lang="pt-BR"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= $article ? escape($article['title']) . ' | PDF TRUE' : 'Notícia não encontrada | PDF TRUE' ?></title>
  <?php if ($article): ?><meta name="description" content="<?= escape($article['meta_description']) ?>"><?php endif; ?>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><link rel="stylesheet" href="css/style.css"><link rel="stylesheet" href="css/news.css">
</head><body>
  <header id="header-placeholder"></header><main class="container news-page">
  <?php if (!$article): ?><p class="news-error">Artigo não encontrado.</p>
  <?php else: ?><article class="news-article-content"><h1><?= escape($article['title']) ?></h1>
    <?php if ($article['image_url']): ?><img class="news-hero-image" src="<?= escape($article['image_url']) ?>" alt="<?= escape($article['image_alt'] ?: $article['title']) ?>"><?php endif; ?>
    <p class="news-excerpt"><?= escape($article['excerpt']) ?></p><div class="news-body"><?= $article['content_html'] ?></div>
    <?php if ($sources): ?><section><h2>Fontes oficiais</h2><ul><?php foreach ($sources as $source): ?><li><a href="<?= escape($source['url']) ?>" target="_blank" rel="noopener noreferrer"><?= escape($source['title']) ?></a></li><?php endforeach; ?></ul></section><?php endif; ?>
  </article><?php endif; ?></main><footer id="footer-placeholder"></footer><script src="js/main.js"></script>
</body></html>
