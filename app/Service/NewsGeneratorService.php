<?php

declare(strict_types=1);

namespace App\Service;

final class NewsGeneratorService
{
    private $services;

    public function __construct(array $services)
    {
        $this->services = $services;
    }

    public function generate(string $topic, string $program, string $notes): array
    {
        if (empty($this->services['gemini_api_key'])) {
            throw new \RuntimeException('Configure a chave GEMINI_API_KEY no arquivo .env.');
        }

        $prompt = "Crie um rascunho em português do Brasil para um artigo sobre programas e benefícios governamentais.\n"
            . "Tema: {$topic}\nPrograma/órgão: {$program}\nOrientações: {$notes}\n\n"
            . 'Retorne APENAS JSON válido com title, slug, excerpt, metaDescription, contentHtml, tags, imageQuery e officialSources. '
            . 'officialSources é uma lista de objetos title e url. Não invente valores, datas, critérios, leis ou links. '
            . 'Quando precisar de confirmação, oriente o leitor a consultar uma fonte oficial. contentHtml deve usar somente h2, h3, p, ul, ol, li, strong e em. '
            . 'As fontes devem ser preferencialmente gov.br, caixa.gov.br, inss.gov.br ou receita.fazenda.gov.br.';

        $lastError = null;
        foreach ($this->services['gemini_models'] ?: [$this->services['gemini_model']] as $model) {
            try {
                $response = $this->request('https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent', [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.35],
                ], ['x-goog-api-key: ' . $this->services['gemini_api_key']]);

                $text = $response['candidates'][0]['content']['parts'][0]['text'] ?? '';
                $article = json_decode($text, true);
                if (!is_array($article)) {
                    throw new \RuntimeException('O Gemini retornou uma resposta inválida.');
                }

                $normalized = $this->normalize($article);
                $normalized['image'] = $this->findImage($normalized['image_query']);

                return $normalized;
            } catch (\RuntimeException $error) {
                $lastError = $error;
                if (!preg_match('/HTTP (429|5\\d\\d)/', $error->getMessage())) {
                    throw $error;
                }
            }
        }

        throw new \RuntimeException('Todos os modelos Gemini configurados estão indisponíveis. Último erro: ' . ($lastError ? $lastError->getMessage() : 'desconhecido'));
    }

    public function normalize(array $article): array
    {
        $title = trim((string) ($article['title'] ?? ''));
        $content = $this->sanitizeHtml((string) ($article['contentHtml'] ?? $article['content_html'] ?? ''));
        $slug = $this->slug((string) ($article['slug'] ?? $title));
        if ($title === '' || $content === '' || $slug === '') {
            throw new \RuntimeException('O artigo não possui título, slug ou conteúdo válido.');
        }

        $sources = [];
        foreach (($article['officialSources'] ?? $article['official_sources'] ?? []) as $source) {
            $url = trim((string) ($source['url'] ?? ''));
            $sourceTitle = trim((string) ($source['title'] ?? 'Fonte oficial'));
            if (filter_var($url, FILTER_VALIDATE_URL) && strpos($url, 'https://') === 0) {
                $sources[] = ['title' => $sourceTitle, 'url' => $url];
            }
        }

        return [
            'title' => mb_substr($title, 0, 140), 'slug' => $slug, 'excerpt' => mb_substr(trim((string) ($article['excerpt'] ?? '')), 0, 300),
            'meta_description' => mb_substr(trim((string) ($article['metaDescription'] ?? $article['meta_description'] ?? '')), 0, 160),
            'content_html' => $content, 'tags' => array_slice(array_values(array_filter(array_map('trim', (array) ($article['tags'] ?? [])))), 0, 8),
            'official_sources' => array_slice($sources, 0, 6), 'image_query' => mb_substr(trim((string) ($article['imageQuery'] ?? $title)), 0, 160),
            'image' => $article['image'] ?? null,
        ];
    }

    private function findImage(string $query): ?array
    {
        if (empty($this->services['pexels_api_key'])) {
            return null;
        }
        $response = $this->request('https://api.pexels.com/v1/search?query=' . rawurlencode($query) . '&per_page=1&orientation=landscape', null, ['Authorization: ' . $this->services['pexels_api_key']], 'GET');
        $photo = $response['photos'][0] ?? null;
        if (!$photo) {
            return null;
        }

        return ['url' => $photo['src']['large'] ?? null, 'alt' => $query, 'author' => $photo['photographer'] ?? '', 'source_url' => $photo['url'] ?? ''];
    }

    private function request(string $url, ?array $payload, array $headers, string $method = 'POST'): array
    {
        $lastError = '';
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $curl = curl_init($url);
            $options = [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 45,
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            ];
            if (!empty($this->services['curl_ca_info'])) {
                $options[CURLOPT_CAINFO] = $this->services['curl_ca_info'];
            }
            curl_setopt_array($curl, $options);
            if ($payload !== null) {
                curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
            }
            $body = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $error = curl_error($curl);
            curl_close($curl);

            if ($body !== false && $status >= 200 && $status < 300) {
                $decoded = json_decode($body, true);
                if (!is_array($decoded)) {
                    throw new \RuntimeException('Resposta inválida do serviço externo.');
                }
                return $decoded;
            }

            $lastError = $error ?: 'HTTP ' . $status;
            if ($attempt < 3 && ($status === 429 || $status >= 500 || $body === false)) {
                sleep($attempt * 2);
                continue;
            }
            break;
        }

        throw new \RuntimeException('Falha ao consultar serviço externo após 3 tentativas: ' . $lastError);
    }

    private function slug(string $value): string
    {
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $value = strtolower((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $value));
        return trim($value, '-');
    }

    private function sanitizeHtml(string $html): string
    {
        $html = strip_tags($html, '<h2><h3><p><ul><ol><li><strong><em><br>');
        // Remove todos os atributos dos elementos permitidos (inclusive onclick, style e href).
        $html = preg_replace('/<(h2|h3|p|ul|ol|li|strong|em|br)(?:\s+[^>]*)?>/i', '<$1>', $html);

        return trim((string) $html);
    }
}
