(() => {
    const saveBlob = (blob, name) => {
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    };
    const safeName = (name, suffix) => `${name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '-')}-${suffix}`;
    const loadPdf = async (file) => PDFLib.PDFDocument.load(await file.arrayBuffer());

    async function htmlToPdf(html) {
        if (!window.html2pdf) throw new Error('Biblioteca HTML para PDF indisponível.');
        const element = document.createElement('div'); element.style.cssText = 'padding:32px;background:#fff;color:#111;font-family:Arial;max-width:760px'; element.innerHTML = html;
        document.body.appendChild(element);
        try { await html2pdf().set({ margin: 10, filename: 'pagina-convertida.pdf', image: { type: 'jpeg', quality: .95 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(element).save(); }
        finally { element.remove(); }
    }
    async function cropPdf(file, margin) {
        const pdf = await loadPdf(file); const amount = Math.max(0, Number(margin) || 0);
        pdf.getPages().forEach((page) => { const { width, height } = page.getSize(); if (amount * 2 >= width || amount * 2 >= height) throw new Error('A margem informada é muito grande.'); page.setCropBox(amount, amount, width - amount * 2, height - amount * 2); });
        saveBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), `${safeName(file.name, 'recortado')}.pdf`);
    }
    async function imagesToPdf(images) {
        if (!images.length) throw new Error('Capture ou selecione ao menos uma imagem.');
        const pdf = await PDFLib.PDFDocument.create();
        for (const imageBlob of images) {
            const data = await imageBlob.arrayBuffer(); const image = imageBlob.type === 'image/png' ? await pdf.embedPng(data) : await pdf.embedJpg(data);
            const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        saveBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), 'documento-digitalizado.pdf');
    }
    async function ocr(file, language = 'por') {
        if (!window.Tesseract) throw new Error('Biblioteca OCR indisponível.');
        const targets = [];
        if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
            if (!window.pdfjsLib) throw new Error('Biblioteca de leitura de PDF indisponível.');
            const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
            for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const view = page.getViewport({ scale: 1.5 }); const canvas = document.createElement('canvas'); canvas.width = view.width; canvas.height = view.height; await page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise; targets.push(canvas); }
        } else targets.push(file);
        const results = [];
        for (let index = 0; index < targets.length; index++) { const result = await Tesseract.recognize(targets[index], language); results.push(`--- Página ${index + 1} ---\n${result.data.text.trim()}`); }
        return results.join('\n\n');
    }
    async function formFields(file, container) {
        const pdf = await loadPdf(file); const form = pdf.getForm(); const fields = form.getFields(); container.innerHTML = '';
        if (!fields.length) throw new Error('Este PDF não possui campos de formulário editáveis.');
        fields.forEach((field, index) => {
            const name = field.getName(); const row = document.createElement('label'); row.style.cssText = 'display:grid;gap:6px;margin:12px 0'; row.textContent = name;
            let input;
            if (typeof field.check === 'function' && typeof field.isChecked === 'function') { input = document.createElement('input'); input.type = 'checkbox'; input.checked = field.isChecked(); }
            else if (typeof field.getOptions === 'function') { input = document.createElement('select'); field.getOptions().forEach((option) => { const node = new Option(option, option); input.add(node); }); }
            else { input = document.createElement('input'); input.type = 'text'; try { input.value = field.getText() || ''; } catch (_) {} }
            input.dataset.fieldIndex = index; row.appendChild(input); container.appendChild(row);
        });
        return { pdf, fields };
    }
    async function saveForm(state, container, originalName) {
        container.querySelectorAll('[data-field-index]').forEach((input) => { const field = state.fields[Number(input.dataset.fieldIndex)]; if (input.type === 'checkbox' && typeof field.check === 'function') input.checked ? field.check() : field.uncheck(); else if (input.tagName === 'SELECT' && typeof field.select === 'function') field.select(input.value); else if (typeof field.setText === 'function') field.setText(input.value); });
        saveBlob(new Blob([await state.pdf.save()], { type: 'application/pdf' }), `${safeName(originalName, 'preenchido')}.pdf`);
    }
    async function extractPdfText(file) {
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); pages.push(content.items.map((item) => item.str).join(' ')); }
        return pages;
    }
    async function comparePdfs(first, second) {
        const [a, b] = await Promise.all([extractPdfText(first), extractPdfText(second)]); const total = Math.max(a.length, b.length); const rows = [];
        for (let i = 0; i < total; i++) rows.push({ page: i + 1, first: a[i] || '', second: b[i] || '', equal: (a[i] || '').replace(/\s+/g, ' ').trim() === (b[i] || '').replace(/\s+/g, ' ').trim() });
        return rows;
    }
    async function pdfToExcel(file) {
        if (!window.XLSX) throw new Error('Biblioteca Excel indisponível.'); const pages = await extractPdfText(file); const book = XLSX.utils.book_new();
        pages.forEach((text, index) => { const rows = text.split(/\s{2,}|\n/).filter(Boolean).map((line) => [line]); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), `Página ${index + 1}`); });
        XLSX.writeFile(book, `${safeName(file.name, 'texto')}.xlsx`);
    }
    async function powerpointToPdf(file) {
        if (!window.JSZip || !window.jspdf) throw new Error('Bibliotecas de conversão indisponíveis.'); const zip = await JSZip.loadAsync(await file.arrayBuffer()); const slides = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])); if (!slides.length) throw new Error('Não foi possível localizar slides no PPTX.'); const { jsPDF } = jspdf; const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        for (let i = 0; i < slides.length; i++) { if (i) pdf.addPage(); const xml = await zip.file(slides[i]).async('text'); const values = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1].replace(/&amp;/g, '&')); const lines = pdf.splitTextToSize(values.join('\n'), 480); pdf.setFontSize(18); pdf.text(lines, 56, 70); }
        pdf.save(`${safeName(file.name, 'convertido')}.pdf`);
    }
    async function excelToPdf(file) {
        if (!window.XLSX || !window.jspdf) throw new Error('Bibliotecas de conversão indisponíveis.'); const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' }); const { jsPDF } = jspdf; const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        workbook.SheetNames.forEach((name, index) => { if (index) pdf.addPage(); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' }); pdf.setFontSize(14); pdf.text(name, 40, 36); if (typeof pdf.autoTable === 'function') pdf.autoTable({ startY: 52, head: rows.slice(0, 1), body: rows.slice(1) }); else pdf.text(rows.map((row) => row.join(' | ')).join('\n'), 40, 60); });
        pdf.save(`${safeName(file.name, 'convertido')}.pdf`);
    }
    window.DocumentTools = { htmlToPdf, cropPdf, imagesToPdf, ocr, formFields, saveForm, comparePdfs, pdfToExcel, powerpointToPdf, excelToPdf };
})();
