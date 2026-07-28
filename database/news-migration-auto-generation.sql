-- Execute uma vez no phpMyAdmin para habilitar o cron de notícias.
ALTER TABLE news
    ADD COLUMN generation_mode ENUM('manual', 'cron') NOT NULL DEFAULT 'manual' AFTER author_email,
    ADD COLUMN program_key VARCHAR(80) NULL AFTER generation_mode,
    ADD INDEX idx_news_auto_program (generation_mode, program_key, published_at);
