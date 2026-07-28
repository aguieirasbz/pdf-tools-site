-- Execute este arquivo no phpMyAdmin após já ter importado news.sql.
ALTER TABLE news
    ADD COLUMN page_views INT UNSIGNED NOT NULL DEFAULT 0 AFTER published_at,
    ADD COLUMN unique_views INT UNSIGNED NOT NULL DEFAULT 0 AFTER page_views;

CREATE TABLE news_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    news_id BIGINT UNSIGNED NOT NULL,
    visitor_hash CHAR(64) NOT NULL,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_news_visitor (news_id, visitor_hash),
    CONSTRAINT fk_news_views_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    INDEX idx_news_views_news (news_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
