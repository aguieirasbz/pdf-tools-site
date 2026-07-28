<?php

declare(strict_types=1);

namespace App\Service;

use App\Model\NewsModel;

final class AutoNewsService
{
    private const PROGRAMS = [
        ['key' => 'bolsa-familia', 'name' => 'Bolsa Família', 'agency' => 'Ministério do Desenvolvimento e Assistência Social'],
        ['key' => 'cadunico', 'name' => 'Cadastro Único (CadÚnico)', 'agency' => 'Ministério do Desenvolvimento e Assistência Social'],
        ['key' => 'bpc-loas', 'name' => 'Benefício de Prestação Continuada (BPC/LOAS)', 'agency' => 'INSS e Ministério do Desenvolvimento e Assistência Social'],
        ['key' => 'auxilio-gas', 'name' => 'Auxílio Gás dos Brasileiros', 'agency' => 'Ministério do Desenvolvimento e Assistência Social'],
        ['key' => 'pe-de-meia', 'name' => 'Pé-de-Meia', 'agency' => 'Ministério da Educação'],
        ['key' => 'tarifa-social', 'name' => 'Tarifa Social de Energia Elétrica', 'agency' => 'Ministério do Desenvolvimento e Assistência Social'],
        ['key' => 'minha-casa-minha-vida', 'name' => 'Minha Casa, Minha Vida', 'agency' => 'Ministério das Cidades'],
        ['key' => 'seguro-desemprego', 'name' => 'Seguro-Desemprego', 'agency' => 'Ministério do Trabalho e Emprego'],
        ['key' => 'pis-pasep', 'name' => 'Abono Salarial PIS/PASEP', 'agency' => 'Ministério do Trabalho e Emprego'],
        ['key' => 'meu-inss', 'name' => 'Serviços e benefícios do Meu INSS', 'agency' => 'INSS'],
        ['key' => 'farmacia-popular', 'name' => 'Programa Farmácia Popular do Brasil', 'agency' => 'Ministério da Saúde'],
    ];

    private $generator;
    private $news;

    public function __construct(NewsGeneratorService $generator, NewsModel $news)
    {
        $this->generator = $generator;
        $this->news = $news;
    }

    public function generateNext(): array
    {
        $recentKeys = $this->news->recentAutomaticProgramKeys(10);
        $available = array_values(array_filter(self::PROGRAMS, static function (array $program) use ($recentKeys): bool {
            return !in_array($program['key'], $recentKeys, true);
        }));
        $programs = $available ?: self::PROGRAMS;
        $program = $programs[(int) date('z') % count($programs)];

        $article = $this->generator->generate(
            'Guia atualizado: como funciona ' . $program['name'],
            $program['name'] . ' — ' . $program['agency'],
            'Produza uma atualização útil e atemporal. Não informe valores, datas de pagamento, prazos ou requisitos específicos sem fonte oficial verificável. Priorize como consultar, documentos, canais oficiais e alerta de atualização das regras.'
        );
        $article['id'] = $this->news->create($article, 'cron@local', 'cron', $program['key']);

        return ['id' => $article['id'], 'program' => $program['name'], 'title' => $article['title']];
    }
}
