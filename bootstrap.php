<?php

declare(strict_types=1);

function load_env_file(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $isDoubleQuoted = strlen($value) >= 2 && $value[0] === '"' && substr($value, -1) === '"';
        $isSingleQuoted = strlen($value) >= 2 && $value[0] === "'" && substr($value, -1) === "'";
        if ($isDoubleQuoted || $isSingleQuoted) {
            $value = substr($value, 1, -1);
        }
        $_ENV[$key] = $value;
        putenv("{$key}={$value}");
    }
}

function env_value(string $key, string $default = ''): string
{
    $value = $_ENV[$key] ?? getenv($key);
    return $value === false || $value === null || $value === '' ? $default : (string) $value;
}

function services_config(): array
{
    return [
        'gemini_api_key' => env_value('GEMINI_API_KEY'),
        'gemini_model' => env_value('GEMINI_MODEL', 'gemini-3.5-flash'),
        'gemini_models' => array_values(array_filter(array_map('trim', explode(',', env_value('GEMINI_MODELS', env_value('GEMINI_MODEL', 'gemini-3.5-flash')))))),
        'pexels_api_key' => env_value('PEXELS_API_KEY'),
        'curl_ca_info' => env_value('CURL_CAINFO'),
        'admin_email' => env_value('ADMIN_EMAIL'),
        'admin_password_hash' => env_value('ADMIN_PASSWORD_HASH'),
    ];
}

load_env_file(__DIR__ . '/.env');

session_name('pdf_true_admin');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (strpos($class, $prefix) !== 0) {
        return;
    }

    $file = __DIR__ . '/app/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

function database(): PDO
{
    static $connection;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', env_value('DB_HOST', 'localhost'), env_value('DB_NAME'));
    $connection = new PDO($dsn, env_value('DB_USER'), env_value('DB_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $connection;
}

function escape(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function require_admin(): void
{
    if (empty($_SESSION['admin_email'])) {
        http_response_code(401);
        throw new RuntimeException('Acesso administrativo necessário.');
    }
}
