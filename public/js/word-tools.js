(() => {
    const escapeXml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    document.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.querySelector('.tool-container-wrapper');
        if (!wrapper) return;
        const isWordToPdf = window.location.pathname.includes('word-para-pdf');
        const notice = document.createElement('section');
        notice.setAttribute('aria-label', 'Limites importantes da conversão');
        notice.style.cssText = 'max-width:1200px;margin:0 auto 40px;padding:22px;background:#fff8e1;border-left:4px solid #d2333f;border-radius:8px;color:#343a40;';
        notice.innerHTML = isWordToPdf
            ? '<h2 style="font-size:1.25rem;margin-bottom:10px">Limites importantes</h2><ul style="padding-left:20px;line-height:1.8"><li>São aceitos arquivos <strong>.docx</strong>; o formato antigo <strong>.doc</strong> não é suportado.</li><li>A conversão prioriza o conteúdo textual.</li><li>Tabelas, imagens e formatações complexas podem não ficar idênticas ao documento original.</li></ul>'
            : '<h2 style="font-size:1.25rem;margin-bottom:10px">Limites importantes</h2><ul style="padding-left:20px;line-height:1.8"><li>É gerado um arquivo <strong>.docx</strong> editável com o texto extraído.</li><li>Tabelas, imagens e formatações complexas podem não ficar idênticas ao PDF original.</li><li>PDFs escaneados como imagem precisam de OCR para extrair texto.</li></ul>';
        wrapper.after(notice);
    });

    async function wordToPdf(file) {
        if (!window.mammoth || !window.jspdf) throw new Error('As bibliotecas de conversão não foram carregadas.');
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        const text = result.value.trim();
        if (!text) throw new Error('Não foi possível extrair texto deste documento.');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 48;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;
        let y = margin;
        text.split(/\n{2,}/).forEach((paragraph) => {
            const lines = pdf.splitTextToSize(paragraph.replace(/\n/g, ' '), maxWidth);
            lines.forEach((line) => {
                if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
                pdf.text(line, margin, y);
                y += 16;
            });
            y += 10;
        });
        pdf.save(`${file.name.replace(/\.docx$/i, '')}-convertido.pdf`);
    }

    async function pdfToWord(file) {
        if (!window.pdfjsLib || !window.JSZip) throw new Error('As bibliotecas de conversão não foram carregadas.');
        const source = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const paragraphs = [];
        for (let number = 1; number <= source.numPages; number++) {
            const page = await source.getPage(number);
            const content = await page.getTextContent();
            paragraphs.push(`Página ${number}`);
            content.items.map((item) => item.str.trim()).filter(Boolean).forEach((text) => paragraphs.push(text));
        }
        const body = paragraphs.map((text) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`).join('');
        const zip = new JSZip();
        zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
        zip.folder('_rels').file('.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
        zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`);
        zip.folder('docProps').file('core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(file.name)}</dc:title></cp:coreProperties>`);
        zip.folder('docProps').file('app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>PDF TRUE</Application></Properties>');
        saveAs(await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${file.name.replace(/\.pdf$/i, '')}-convertido.docx`);
    }

    window.WordPdfTools = { wordToPdf, pdfToWord };
})();
