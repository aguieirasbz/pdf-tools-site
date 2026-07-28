<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/bootstrap.php';

use App\Model\AdminUserModel;

$users = new AdminUserModel(database());
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
    $email = strtolower(trim((string) ($_POST['email'] ?? '')));
    $password = (string) ($_POST['password'] ?? '');
    $user = $users->authenticate($email, $password);
    if ($user) {
        session_regenerate_id(true);
        $_SESSION['admin_email'] = $user['email'];
        $_SESSION['admin_id'] = $user['id'];
        header('Location: noticias.php');
        exit;
    }
    $error = 'E-mail ou senha inválidos.';
}
if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: noticias.php');
    exit;
}
$authenticated = !empty($_SESSION['admin_email']);
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Painel de notícias | PDF TRUE</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/news.css">
  <link rel="stylesheet" href="../css/admin-metrics.css">
</head>
<body>
  <main class="admin-page container">
    <header class="admin-header"><div><h1>Painel de notícias</h1><p>Gere rascunhos com IA, confira as fontes e publique com segurança.</p></div>
    <?php if ($authenticated): ?><div><span><?= escape($_SESSION['admin_email']) ?></span> <a href="?logout=1" class="btn btn-outline">Sair</a></div><?php endif; ?></header>
    <?php if (!$authenticated): ?>
      <form class="admin-form" method="post" autocomplete="off">
        <input type="hidden" name="action" value="login">
        <h2>Acesso administrativo</h2>
        <?php if ($error): ?><p class="admin-status error"><?= escape($error) ?></p><?php endif; ?>
        <label>E-mail <input type="email" name="email" required></label>
        <label>Senha <input type="password" name="password" required></label>
        <button class="btn btn-primary" type="submit">Entrar</button>
      </form>
    <?php else: ?>
      <p id="admin-status" class="admin-status" role="status">Artigos gerados são publicados automaticamente. Revise e corrija quando necessário.</p>
      <form id="news-generator-form" class="admin-form">
        <label>Tema <input id="news-topic" required minlength="8" maxlength="180" placeholder="Ex.: Como consultar o benefício do INSS"></label>
        <label>Programa ou órgão <input id="news-program" placeholder="Ex.: INSS"></label>
        <label>Orientações <textarea id="news-notes" rows="4" placeholder="Ex.: linguagem simples e canais oficiais"></textarea></label>
        <button class="btn btn-primary" type="submit">Gerar e publicar artigo</button>
      </form>
      <section id="news-review" class="news-review" hidden>
        <h2>Editar artigo</h2><p>Você pode corrigir qualquer artigo já publicado. Confirme os dados oficiais antes de salvar.</p>
        <div id="review-image" class="review-image"></div>
        <label>Título <input id="review-title" maxlength="140"></label>
        <label>Resumo <textarea id="review-excerpt" rows="3" maxlength="300"></textarea></label>
        <label>Meta description <textarea id="review-meta" rows="2" maxlength="160"></textarea></label>
        <label>Tags (separadas por vírgula) <input id="review-tags"></label>
        <label>Fontes oficiais (uma por linha: Título | https://url) <textarea id="review-sources" rows="5"></textarea></label>
        <label>Conteúdo HTML <textarea id="review-content" rows="18"></textarea></label>
        <div class="review-actions"><button id="save-draft" class="btn btn-primary" type="button">Salvar alterações</button></div>
      </section>
      <section class="admin-articles"><h2>Artigos e métricas</h2><div id="admin-articles-list">Carregando artigos...</div></section>
      <script src="../js/admin-news.js"></script>
    <?php endif; ?>
  </main>
</body>
</html>
