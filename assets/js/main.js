document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
    const { jsPDF } = window.jspdf;

    // A LABEL agora tem o ID 'file-drop-zone'
    const fileDropZone = document.getElementById('file-drop-zone'); 
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const actionButton = document.getElementById('action-button');
    const statusDiv = document.getElementById('status');
    
    let selectedFiles = [];

    if (!fileDropZone) return; 

    // --- Lógica de Interação com Arquivos ---
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Eventos de Drag & Drop continuam na mesma área (que agora é a label)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, () => fileDropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, () => fileDropZone.classList.remove('dragover'), false);
    });
    
    fileDropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    }, false);

    // ==================================================================
    // == CORREÇÃO APLICADA AQUI ========================================
    // A linha que detectava o clique na drop-zone foi REMOVIDA,
    // pois o HTML (a tag <label>) já cuida disso nativamente, eliminando o conflito.
    // ==================================================================

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        // Resetamos o valor para garantir consistência e permitir re-seleção do mesmo arquivo
        e.target.value = null;
    }, false);
    
    // O resto do código permanece o mesmo...

    function handleFiles(files) {
        if (!files || files.length === 0) {
            selectedFiles = [];
            fileList.innerHTML = '';
            actionButton.disabled = true;
            return;
        }

        selectedFiles = [...files];
        fileList.innerHTML = '';
        if (selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-list-item';
                fileItem.textContent = file.name;
                fileList.appendChild(fileItem);
            });
            actionButton.disabled = false;
        } else {
            actionButton.disabled = true;
        }
    }

    function setStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'status error' : 'status';
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    actionButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        setStatus('Processando, por favor aguarde...');
        actionButton.disabled = true;

        try {
            const path = window.location.pathname;

            if (path.includes('merge.html')) {
                await mergePdfs();
            } else if (path.includes('split.html')) {
                await splitPdf();
            } else if (path.includes('rotate.html')) {
                await rotatePdf();
            } else if (path.includes('image-to-pdf.html')) {
                await imagesToPdf();
            } else if (path.includes('watermark.html')) {
                await addWatermark();
            }

        } catch (error) {
            console.error(error);
            setStatus(`Ocorreu um erro: ${error.message}`, true);
        } finally {
            actionButton.disabled = false;
        }
    });

    async function mergePdfs() {
        const mergedPdf = await PDFDocument.create();
        for (const file of selectedFiles) {
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        downloadBlob(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'pdf-power-tools-merged.pdf');
        setStatus('PDFs juntados com sucesso!');
    }

    async function splitPdf() {
        const file = selectedFiles[0];
        const rangesText = document.getElementById('split-ranges').value;
        if (!rangesText) throw new Error("Por favor, insira as páginas ou os intervalos a extrair.");
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const newPdfDoc = await PDFDocument.create();
        const pagesToExtract = new Set();
        rangesText.split(',').forEach(range => {
            range = range.trim();
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(num => parseInt(num.trim(), 10));
                for (let i = start; i <= end; i++) pagesToExtract.add(i - 1);
            } else {
                pagesToExtract.add(parseInt(range, 10) - 1);
            }
        });
        const pageIndices = Array.from(pagesToExtract).filter(p => p >= 0 && p < pdfDoc.getPageCount());
        if (pageIndices.length === 0) throw new Error("Nenhuma página válida foi selecionada.");
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => newPdfDoc.addPage(page));
        const newPdfBytes = await newPdfDoc.save();
        downloadBlob(new Blob([newPdfBytes], { type: 'application/pdf' }), 'pdf-power-tools-split.pdf');
        setStatus('PDF dividido com sucesso!');
    }

    async function rotatePdf() {
        const file = selectedFiles[0];
        const angle = parseInt(document.getElementById('rotate-angle').value, 10);
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        pdfDoc.getPages().forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation({ angle: (currentRotation + angle) % 360 });
        });
        const newPdfBytes = await pdfDoc.save();
        downloadBlob(new Blob([newPdfBytes], { type: 'application/pdf' }), 'pdf-power-tools-rotated.pdf');
        setStatus('PDF girado com sucesso!');
    }

    async function imagesToPdf() {
        const doc = new jsPDF();
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const imgData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            const img = new Image();
            await new Promise(resolve => { img.onload = resolve; img.src = imgData; });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
            const imgWidth = img.width * ratio;
            const imgHeight = img.height * ratio;
            if (i > 0) doc.addPage();
            doc.addImage(imgData, file.type.split('/')[1].toUpperCase(), (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
        }
        doc.save('pdf-power-tools-converted.pdf');
        setStatus('Imagens convertidas para PDF com sucesso!');
    }

    async function addWatermark() {
        const file = selectedFiles[0];
        const text = document.getElementById('watermark-text').value;
        const opacity = parseFloat(document.getElementById('watermark-opacity').value);
        const size = parseInt(document.getElementById('watermark-size').value, 10);
        const colorHex = document.getElementById('watermark-color').value;
        if (!text) throw new Error("Por favor, insira o texto da marca d'água.");
        const r = parseInt(colorHex.slice(1, 3), 16) / 255;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255;
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const textWidth = helveticaFont.widthOfTextAtSize(text, size);
        const textHeight = helveticaFont.heightAtSize(size);
        for (const page of pdfDoc.getPages()) {
            const { width, height } = page.getSize();
            page.drawText(text, {
                x: (width / 2) - (textWidth / 2),
                y: (height / 2) - (textHeight / 2),
                font: helveticaFont,
                size: size,
                color: rgb(r, g, b),
                opacity: opacity,
                rotate: degrees(45),
            });
        }
        const newPdfBytes = await newPdfDoc.save();
        downloadBlob(new Blob([newPdfBytes], { type: 'application/pdf' }), 'pdf-power-tools-watermarked.pdf');
        setStatus('Marca d\'água adicionada com sucesso!');
    }
});