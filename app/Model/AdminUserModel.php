<?php

declare(strict_types=1);

namespace App\Model;

use PDO;

final class AdminUserModel
{
    private $database;

    public function __construct(PDO $database)
    {
        $this->database = $database;
    }

    public function ensureTable(): void
    {
        $this->database->exec('CREATE TABLE IF NOT EXISTS admin_users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(190) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM("admin") NOT NULL DEFAULT "admin",
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    }

    public function createOrUpdateAdmin(string $email, string $passwordHash): void
    {
        $statement = $this->database->prepare('INSERT INTO admin_users (email, password_hash, role, active) VALUES (:email, :password_hash, "admin", 1)
            ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = "admin", active = 1, updated_at = CURRENT_TIMESTAMP');
        $statement->execute(['email' => strtolower($email), 'password_hash' => $passwordHash]);
    }

    public function authenticate(string $email, string $password): ?array
    {
        $statement = $this->database->prepare('SELECT id, email, password_hash, role FROM admin_users WHERE email = :email AND active = 1 LIMIT 1');
        $statement->execute(['email' => strtolower($email)]);
        $user = $statement->fetch();

        return $user && password_verify($password, $user['password_hash']) ? $user : null;
    }
}
