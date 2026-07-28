<?php

declare(strict_types=1);

namespace App\Model;

use PDO;

final class NewsModel
{
    private $database;

    public function __construct(PDO $database)
    {
        $this->database = $database;
    }

    public function create(array $article, string $author, string $generationMode = 'manual', ?string $programKey = null): int
    {
        $article['slug'] = $this->uniqueSlug($article['slug']);
        $sql = 'INSERT INTO news (title, slug, excerpt, meta_description, content_html, tags, official_sources, image_url, image_alt, image_author, image_source_url, status, author_email, generation_mode, program_key, published_at)
                VALUES (:title, :slug, :excerpt, :meta_description, :content_html, :tags, :official_sources, :image_url, :image_alt, :image_author, :image_source_url, "published", :author_email, :generation_mode, :program_key, CURRENT_TIMESTAMP)';
        $statement = $this->database->prepare($sql);
        $statement->execute($this->params($article) + ['author_email' => $author, 'generation_mode' => $generationMode, 'program_key' => $programKey]);

        return (int) $this->database->lastInsertId();
    }

    public function updateDraft(int $id, array $article): void
    {
        $sql = 'UPDATE news SET title = :title, slug = :slug, excerpt = :excerpt, meta_description = :meta_description, content_html = :content_html,
                tags = :tags, official_sources = :official_sources, image_url = :image_url, image_alt = :image_alt, image_author = :image_author,
                image_source_url = :image_source_url, updated_at = CURRENT_TIMESTAMP WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $statement->execute($this->params($article) + ['id' => $id]);

        if ($statement->rowCount() === 0) {
            throw new \RuntimeException('Artigo não encontrado.');
        }
    }

    public function publish(int $id): void
    {
        $statement = $this->database->prepare('UPDATE news SET status = "published", published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND status = "draft"');
        $statement->execute(['id' => $id]);
        if ($statement->rowCount() === 0) {
            throw new \RuntimeException('Rascunho não encontrado ou já publicado.');
        }
    }

    public function published(int $limit = 24): array
    {
        $statement = $this->database->prepare('SELECT * FROM news WHERE status = "published" ORDER BY published_at DESC LIMIT :limit');
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetchAll();
    }

    public function latestPublished(int $limit = 5): array
    {
        $statement = $this->database->prepare('SELECT title, slug, excerpt, image_url, image_alt, published_at FROM news WHERE status = "published" ORDER BY published_at DESC LIMIT :limit');
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();

        return $statement->fetchAll();
    }

    public function findPublishedBySlug(string $slug): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM news WHERE slug = :slug AND status = "published" LIMIT 1');
        $statement->execute(['slug' => $slug]);
        $article = $statement->fetch();

        return $article ?: null;
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM news WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $article = $statement->fetch();

        return $article ?: null;
    }

    public function adminList(): array
    {
        return $this->database->query('SELECT id, title, slug, status, page_views, unique_views, created_at, updated_at, published_at FROM news ORDER BY updated_at DESC LIMIT 100')->fetchAll();
    }

    public function recentAutomaticProgramKeys(int $days): array
    {
        $days = max(1, min($days, 365));
        $statement = $this->database->prepare("SELECT DISTINCT program_key FROM news WHERE generation_mode = 'cron' AND program_key IS NOT NULL AND published_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)");
        $statement->execute();

        return array_column($statement->fetchAll(), 'program_key');
    }

    public function recordView(int $id, string $visitorHash): void
    {
        $this->database->beginTransaction();
        try {
            $this->database->prepare('UPDATE news SET page_views = page_views + 1 WHERE id = :id')->execute(['id' => $id]);
            $statement = $this->database->prepare('INSERT IGNORE INTO news_views (news_id, visitor_hash) VALUES (:news_id, :visitor_hash)');
            $statement->execute(['news_id' => $id, 'visitor_hash' => $visitorHash]);
            if ($statement->rowCount() === 1) {
                $this->database->prepare('UPDATE news SET unique_views = unique_views + 1 WHERE id = :id')->execute(['id' => $id]);
            }
            $this->database->commit();
        } catch (\Throwable $error) {
            $this->database->rollBack();
            throw $error;
        }
    }

    private function params(array $article): array
    {
        return [
            'title' => $article['title'], 'slug' => $article['slug'], 'excerpt' => $article['excerpt'],
            'meta_description' => $article['meta_description'], 'content_html' => $article['content_html'],
            'tags' => json_encode($article['tags'], JSON_UNESCAPED_UNICODE),
            'official_sources' => json_encode($article['official_sources'], JSON_UNESCAPED_UNICODE),
            'image_url' => $article['image']['url'] ?? null, 'image_alt' => $article['image']['alt'] ?? null,
            'image_author' => $article['image']['author'] ?? null, 'image_source_url' => $article['image']['source_url'] ?? null,
        ];
    }

    private function uniqueSlug(string $slug): string
    {
        $base = substr($slug, 0, 110);
        $candidate = $base;
        $index = 2;
        $statement = $this->database->prepare('SELECT 1 FROM news WHERE slug = :slug LIMIT 1');
        while (true) {
            $statement->execute(['slug' => $candidate]);
            if (!$statement->fetchColumn()) {
                return $candidate;
            }
            $candidate = $base . '-' . $index++;
        }
    }
}
