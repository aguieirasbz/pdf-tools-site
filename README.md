# PDF TRUE

Site para hospedagem PHP/MySQL (HostGator, cPanel, XAMPP ou Laragon). As ferramentas PDF permanecem em HTML/JavaScript; o módulo de notícias usa PHP, MySQL, Gemini e Pexels.

## Estrutura

- `public/`: arquivos que devem ficar acessíveis pela web.
- `app/`: Model e Service da aplicação.
- `.env`: conexão MySQL, chaves privadas e acesso administrativo. Mantenha-o fora da pasta pública da hospedagem.
- `database/news.sql`: estrutura da tabela de notícias.

## Instalação na HostGator

1. Crie um banco MySQL e um usuário pelo **cPanel > MySQL Databases**.
2. Abra o **phpMyAdmin**, selecione o banco e importe `database/news.sql`.
   Se a tabela `news` já foi criada antes desta atualização, importe também `database/news-migration-metrics.sql`.
   Importe também `database/admin_users.sql` para a tabela de administradores.
3. Copie `.env.example` para `.env` e informe host, nome do banco, usuário e senha MySQL.
4. No mesmo `.env`, informe:

   - `gemini_api_key`;
   - `pexels_api_key` (opcional, para imagens);
   - `admin_email`;
   - `admin_password_hash`.

   Gere a senha com este comando em um terminal que tenha PHP:

   ```powershell
   php -r "echo password_hash('SUA_SENHA_FORTE', PASSWORD_DEFAULT), PHP_EOL;"
   ```

5. Envie o conteúdo de `public/` para `public_html/`.
6. Envie `app/`, `.env`, `bootstrap.php` e `database/` para uma pasta **fora** de `public_html/`. Mantenha a mesma estrutura relativa ou ajuste os `require` dos arquivos PHP.
7. Acesse `https://seu-dominio.com/admin/noticias.php` e entre com o e-mail e senha configurados.

Para criar o primeiro administrador no banco, execute na raiz do projeto:

```powershell
php scripts/create-admin.php
```

## Fluxo de notícias

1. O administrador informa tema, programa e orientações.
2. O PHP chama Gemini no servidor e cria um rascunho no MySQL.
3. O PHP consulta Pexels para obter uma imagem licenciada, quando a chave estiver configurada.
4. O artigo é publicado automaticamente em `blog.php` e pode ser corrigido no painel a qualquer momento.
5. O painel mostra usuários únicos e total de visualizações de cada matéria.

## Segurança

- Nunca publique `.env` dentro de `public_html`.
- Não coloque as chaves Gemini ou Pexels em JavaScript.
- Em notícias de benefícios governamentais, confirme manualmente valores, calendários, requisitos e fontes oficiais antes de publicar.
- Métricas usam um identificador aleatório em cookie, sem salvar endereço IP.

## Geração automática por cron

O script `scripts/generate-scheduled-news.php` gera e publica uma notícia por execução. Ele alterna entre os principais programas federais e evita repetir o mesmo tema nos últimos 10 dias.

1. Importe `database/news-migration-auto-generation.sql` no phpMyAdmin caso a tabela `news` já exista.
2. No `.env`, habilite:

   ```env
   AUTO_NEWS_ENABLED=true
   ```

3. Teste localmente na raiz do projeto:

   ```powershell
   php scripts/generate-scheduled-news.php
   ```

4. Na HostGator, em **cPanel > Cron Jobs**, crie uma tarefa diária. Ajuste o usuário e os caminhos ao seu cPanel:

   ```bash
   /usr/local/bin/php -q /home/USUARIO/pdf-tools-site/scripts/generate-scheduled-news.php >> /home/USUARIO/logs/pdftrue-cron.log 2>&1
   ```

O cron publica automaticamente. Use o painel administrativo para corrigir texto, fontes, datas e informações após a publicação.

Se houver indisponibilidade temporária, o sistema alterna os modelos definidos em `GEMINI_MODELS` no `.env`. Separe os modelos por vírgula e mantenha somente nomes disponíveis na sua conta Gemini.
- O servidor precisa ter as extensões PHP `pdo_mysql`, `curl`, `mbstring` e `json` habilitadas.
- Se o PHP local informar erro de certificado SSL, baixe `cacert.pem` em https://curl.se/ca/cacert.pem, salve por exemplo em `C:/php/cacert.pem` e configure `CURL_CAINFO=C:/php/cacert.pem` no `.env`.
