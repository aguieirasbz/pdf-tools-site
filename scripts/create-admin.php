<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

use App\Model\AdminUserModel;

$services = services_config();
if (!filter_var($services['admin_email'], FILTER_VALIDATE_EMAIL) || $services['admin_password_hash'] === '') {
    fwrite(STDERR, "Preencha ADMIN_EMAIL e ADMIN_PASSWORD_HASH no arquivo .env antes de executar.\n");
    exit(1);
}

$users = new AdminUserModel(database());
$users->ensureTable();
$users->createOrUpdateAdmin($services['admin_email'], $services['admin_password_hash']);

echo "Usuário administrador criado/atualizado com sucesso.\n";
