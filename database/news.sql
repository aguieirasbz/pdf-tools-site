CREATE TABLE news (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(140) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    excerpt VARCHAR(300) NOT NULL,
    meta_description VARCHAR(160) NOT NULL,
    content_html LONGTEXT NOT NULL,
    tags LONGTEXT NULL,
    official_sources LONGTEXT NULL,
    image_url VARCHAR(1000) NULL,
    image_alt VARCHAR(255) NULL,
    image_author VARCHAR(255) NULL,
    image_source_url VARCHAR(1000) NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    author_email VARCHAR(190) NOT NULL,
    generation_mode ENUM('manual', 'cron') NOT NULL DEFAULT 'manual',
    program_key VARCHAR(80) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL DEFAULT NULL,
    page_views INT UNSIGNED NOT NULL DEFAULT 0,
    unique_views INT UNSIGNED NOT NULL DEFAULT 0,
    INDEX idx_news_status_published (status, published_at),
    INDEX idx_news_auto_program (generation_mode, program_key, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE news_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    news_id BIGINT UNSIGNED NOT NULL,
    visitor_hash CHAR(64) NOT NULL,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_news_visitor (news_id, visitor_hash),
    CONSTRAINT fk_news_views_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    INDEX idx_news_views_news (news_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
