document.addEventListener('DOMContentLoaded', () => {
    const betaTools = new Set([
        'cortar-pdf.html',
        'pdf-avancado.html?tool=scan',
        'pdf-avancado.html?tool=ocr',
        'pdf-avancado.html?tool=comparar',
        'pdf-para-excel.html',
        'powerpoint-para-pdf.html',
        'excel-para-pdf.html',
        'word-para-pdf.html',
        'pdf-para-word.html',
        'comprimir-pdf.html',
        'pdf-avancado.html?tool=editor'
    ]);

    document.querySelectorAll('.tools-grid .tool-card-link, .tools-catalog-grid .catalog-card').forEach((link) => {
        if (!betaTools.has(link.getAttribute('href'))) return;
        link.classList.add('is-beta');
        const card = link.querySelector('.tool-card') || link;
        if (card && !card.querySelector('.tool-status')) {
            const status = document.createElement('span');
            status.className = 'tool-status';
            status.textContent = 'Em teste';
            card.appendChild(status);
        }
    });
});
