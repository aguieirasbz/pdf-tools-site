(() => {
    const { PDFDocument } = window.PDFLib || {};

    if (typeof window.saveAs !== 'function') {
        window.saveAs = (blob, name) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        };
    }

    const fileName = (file, suffix) => `${file.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '-')}-${suffix}.pdf`;
    const savePdf = (bytes, name) => saveAs(new Blob([bytes], { type: 'application/pdf' }), name);

    function parsePages(value, total, defaultAll = true) {
        const text = String(value || '').trim();
        if (!text && defaultAll) return Array.from({ length: total }, (_, index) => index);
        if (!text) throw new Error('Informe ao menos uma página.');
        const pages = [];
        for (const part of text.split(',')) {
            const range = part.trim();
            if (!range) continue;
            const match = range.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
            if (!match) throw new Error(`Intervalo inválido: ${range}`);
            const start = Number(match[1]);
            const end = Number(match[2] || start);
            if (start < 1 || end < start || end > total) throw new Error(`Página fora do intervalo: ${range}. Este PDF possui ${total} páginas.`);
            for (let page = start; page <= end; page++) pages.push(page - 1);
        }
        if (!pages.length) throw new Error('Nenhuma página válida foi informada.');
        return pages;
    }

    async function loadPdf(file) {
        if (!PDFDocument) throw new Error('A biblioteca de PDF não foi carregada.');
        return PDFDocument.load(await file.arrayBuffer());
    }

    async function extractPages(file, range) {
        const source = await loadPdf(file);
        const selected = parsePages(range, source.getPageCount());
        const result = await PDFDocument.create();
        const pages = await result.copyPages(source, selected);
        pages.forEach((page) => result.addPage(page));
        savePdf(await result.save(), fileName(file, 'paginas-extraidas'));
    }

    async function organizePdf(file, order, remove) {
        const source = await loadPdf(file);
        const total = source.getPageCount();
        const removed = new Set(remove.trim() ? parsePages(remove, total, false) : []);
        const selected = order.trim() ? parsePages(order, total, false) : Array.from({ length: total }, (_, index) => index).filter((index) => !removed.has(index));
        const finalPages = selected.filter((index) => !removed.has(index));
        if (!finalPages.length) throw new Error('Não é possível criar um PDF sem páginas.');
        const result = await PDFDocument.create();
        const pages = await result.copyPages(source, finalPages);
        pages.forEach((page) => result.addPage(page));
        savePdf(await result.save(), fileName(file, 'organizado'));
    }

    async function extractText(file) {
        if (!window.pdfjsLib) throw new Error('A biblioteca de leitura de PDF não foi carregada.');
        const documentPdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const output = [];
        for (let number = 1; number <= documentPdf.numPages; number++) {
            const page = await documentPdf.getPage(number);
            const text = await page.getTextContent();
            output.push(`--- Página ${number} ---\n${text.items.map((item) => item.str).join(' ')}`);
        }
        return output.join('\n\n');
    }

    async function addImage(file, imageFile, ranges, position, percent) {
        const pdf = await loadPdf(file);
        const imageBytes = await imageFile.arrayBuffer();
        let image;
        if (imageFile.type === 'image/png') image = await pdf.embedPng(imageBytes);
        else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') image = await pdf.embedJpg(imageBytes);
        else throw new Error('Use uma imagem PNG ou JPG.');
        const pages = parsePages(ranges, pdf.getPageCount());
        const factor = Math.max(5, Math.min(Number(percent) || 25, 90)) / 100;
        pages.forEach((index) => {
            const page = pdf.getPages()[index];
            const { width, height } = page.getSize();
            const imageWidth = width * factor;
            const imageHeight = imageWidth * image.height / image.width;
            const margin = 28;
            const coordinates = {
                'top-left': { x: margin, y: height - imageHeight - margin },
                'top-right': { x: width - imageWidth - margin, y: height - imageHeight - margin },
                'bottom-left': { x: margin, y: margin },
                'bottom-right': { x: width - imageWidth - margin, y: margin },
                center: { x: (width - imageWidth) / 2, y: (height - imageHeight) / 2 }
            };
            page.drawImage(image, { ...coordinates[position], width: imageWidth, height: imageHeight });
        });
        savePdf(await pdf.save(), fileName(file, 'com-imagem'));
    }

    async function compressPdf(file, quality) {
        if (!window.pdfjsLib) throw new Error('A biblioteca de leitura de PDF não foi carregada.');
        const settings = { baixa: { scale: 0.9, quality: 0.55 }, media: { scale: 1.2, quality: 0.7 }, alta: { scale: 1.6, quality: 0.82 } }[quality] || { scale: 1.2, quality: 0.7 };
        const source = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const result = await PDFDocument.create();
        for (let number = 1; number <= source.numPages; number++) {
            const page = await source.getPage(number);
            const display = page.getViewport({ scale: settings.scale });
            const original = page.getViewport({ scale: 1 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(display.width);
            canvas.height = Math.ceil(display.height);
            const context = canvas.getContext('2d', { alpha: false });
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport: display, background: '#fff' }).promise;
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', settings.quality));
            if (!blob) throw new Error(`Não foi possível processar a página ${number}.`);
            const image = await result.embedJpg(await blob.arrayBuffer());
            const newPage = result.addPage([original.width, original.height]);
            newPage.drawImage(image, { x: 0, y: 0, width: original.width, height: original.height });
        }
        savePdf(await result.save(), fileName(file, 'comprimido'));
    }

    function setupUpload(fileInput, info) {
        fileInput.addEventListener('change', () => { info.textContent = fileInput.files[0] ? `Arquivo selecionado: ${fileInput.files[0].name}` : ''; });
    }

    window.AdvancedPdfTools = { extractPages, organizePdf, extractText, addImage, compressPdf, setupUpload };
})();
