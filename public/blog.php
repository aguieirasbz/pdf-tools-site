<?php

declare(strict_types=1);
require dirname(__DIR__) . '/bootstrap.php';

use App\Model\NewsModel;
$articles = (new NewsModel(database()))->published();
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - Guias e Artigos | PDF TRUE</title>
  <meta name="description" content="Notícias, guias e orientações sobre programas e benefícios do governo.">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css"><link rel="stylesheet" href="css/news.css">
</head>
<body>
  <header id="header-placeholder"></header>
  <main class="main-content"><section class="tools-section"><div class="container">
    <div class="section-title"><h1>Notícias e benefícios</h1><p>Guias e informações para ajudar você a encontrar serviços e canais oficiais.</p></div>
    <?php if (!$articles): ?><p class="empty-news">Ainda não há notícias publicadas.</p><?php else: ?><div class="tools-grid generated-news-grid">
      <?php foreach ($articles as $article): ?><article class="news-card">
        <?php if ($article['image_url']): ?><img src="<?= escape($article['image_url']) ?>" alt="<?= escape($article['image_alt'] ?: $article['title']) ?>" loading="lazy"><?php endif; ?>
        <div class="news-card-content"><span class="news-date">Atualizado em <?= date('d/m/Y', strtotime($article['published_at'])) ?></span><h2><?= escape($article['title']) ?></h2><p><?= escape($article['excerpt']) ?></p>
        <?php if ($article['image_author'] && $article['image_source_url']): ?><small>Foto: <a href="<?= escape($article['image_source_url']) ?>" target="_blank" rel="noopener noreferrer"><?= escape($article['image_author']) ?> / Pexels</a></small><?php endif; ?>
        <a class="btn btn-primary" href="noticia.php?slug=<?= rawurlencode($article['slug']) ?>">Ler artigo</a></div>
      </article><?php endforeach; ?>
    </div><?php endif; ?>
  </div></section></main>
  <footer id="footer-placeholder"></footer><script src="js/main.js"></script>
</body>
</html>
