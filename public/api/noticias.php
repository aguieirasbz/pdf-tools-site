<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/bootstrap.php';

use App\Model\NewsModel;
use App\Service\NewsGeneratorService;

header('Content-Type: application/json; charset=utf-8');

try {
    require_admin();
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new RuntimeException('Método não permitido.');
    }

    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        throw new RuntimeException('Dados inválidos.');
    }

    $action = $input['action'] ?? '';
    $model = new NewsModel(database());
    $generator = new NewsGeneratorService(services_config());

    if ($action === 'list') {
        echo json_encode(['ok' => true, 'articles' => $model->adminList()], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'get') {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        $article = $id ? $model->findById((int) $id) : null;
        if (!$article) {
            throw new RuntimeException('Artigo não encontrado.');
        }
        $article['tags'] = json_decode($article['tags'], true) ?: [];
        $article['official_sources'] = json_decode($article['official_sources'], true) ?: [];
        $article['image'] = ['url' => $article['image_url'], 'alt' => $article['image_alt'], 'author' => $article['image_author'], 'source_url' => $article['image_source_url']];
        echo json_encode(['ok' => true, 'article' => $article], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($action === 'generate') {
        $topic = trim((string) ($input['topic'] ?? ''));
        if (mb_strlen($topic) < 8 || mb_strlen($topic) > 180) {
            throw new RuntimeException('Informe um tema entre 8 e 180 caracteres.');
        }
        $article = $generator->generate($topic, trim((string) ($input['program'] ?? '')), trim((string) ($input['notes'] ?? '')));
        $article['id'] = $model->create($article, $_SESSION['admin_email']);
        echo json_encode(['ok' => true, 'article' => $article], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        throw new RuntimeException('Identificador do rascunho inválido.');
    }

    if ($action === 'save' || $action === 'publish') {
        $article = $generator->normalize((array) ($input['article'] ?? []));
        $model->updateDraft((int) $id, $article);
        if ($action === 'publish') {
            $model->publish((int) $id);
        }
        echo json_encode(['ok' => true, 'status' => $action === 'publish' ? 'published' : 'draft'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    throw new RuntimeException('Ação inválida.');
} catch (Throwable $error) {
    http_response_code(http_response_code() >= 400 ? http_response_code() : 400);
    echo json_encode(['ok' => false, 'message' => $error->getMessage()], JSON_UNESCAPED_UNICODE);
}
