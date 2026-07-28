document.addEventListener('DOMContentLoaded', () => {
    const icons = {
        'juntar-pdf.html': ['fa-object-group', 'red'],
        'dividir-pdf.html': ['fa-cut', 'orange'],
        'comprimir-pdf.html': ['fa-compress-arrows-alt', 'green'],
        'pdf-para-word.html': ['fa-file-word', 'blue'],
        'word-para-pdf.html': ['fa-file-word', 'blue'],
        'pdf-para-excel.html': ['fa-file-excel', 'green'],
        'excel-para-pdf.html': ['fa-file-excel', 'green'],
        'powerpoint-para-pdf.html': ['fa-file-powerpoint', 'orange'],
        'pdf-para-jpg.html': ['fa-file-image', 'yellow'],
        'jpg-para-pdf.html': ['fa-image', 'yellow'],
        'pdf-avancado.html?tool=editor': ['fa-edit', 'purple'],
        'adicionar-imagem-pdf.html': ['fa-image', 'purple'],
        'assinar-pdf.html': ['fa-signature', 'blue'],
        'pdf-avancado.html?tool=marca': ['fa-stamp', 'purple'],
        'girar-pdf.html': ['fa-redo', 'purple'],
        'pdf-avancado.html?tool=organizar': ['fa-sort', 'red'],
        'extrair-paginas-pdf.html': ['fa-file-export', 'orange'],
        'pdf-avancado.html?tool=numerar': ['fa-list-ol', 'purple'],
        'html-para-pdf.html': ['fa-code', 'yellow'],
        'cortar-pdf.html': ['fa-crop-alt', 'purple'],
        'pdf-avancado.html?tool=scan': ['fa-camera', 'orange'],
        'pdf-avancado.html?tool=ocr': ['fa-eye', 'green'],
        'formularios-pdf.html': ['fa-wpforms', 'purple'],
        'pdf-avancado.html?tool=comparar': ['fa-columns', 'blue'],
        'pdf-para-texto.html': ['fa-file-alt', 'blue']
    };

    document.querySelectorAll('#ferramentas .tool-card-link').forEach((link) => {
        const setting = icons[link.getAttribute('href')];
        const iconBox = link.querySelector('.tool-icon');
        if (!setting || !iconBox) return;
        const [icon, tone] = setting;
        iconBox.className = `tool-icon tone-${tone}`;
        iconBox.innerHTML = `<i class="fas ${icon}"></i>`;
    });
});
