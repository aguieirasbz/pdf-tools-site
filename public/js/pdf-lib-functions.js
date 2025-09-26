// =================================================================
// BIBLIOTECA DE FUNÇÕES DE MANIPULAÇÃO DE PDF
// =================================================================
const { PDFDocument, rgb, degrees, StandardFonts, PermissionFlag } = window.PDFLib;

// Função para exibir mensagens ao usuário
function showUserMessage(message, type = 'info') {
    // Para simplificar, usamos alert(). Você pode substituir por uma UI mais elegante.
    alert(message);
}

// Função para salvar o arquivo gerado
function saveFile(bytes, fileName) {
    saveAs(new Blob([bytes], { type: 'application/pdf' }), fileName);
}

async function handleMerge(files) {
    showUserMessage('Juntando arquivos... Por favor, aguarde.');
    const newPdfDoc = await PDFDocument.create();
    for (const file of files) {
        const fileBytes = await file.arrayBuffer();
        const pdfToMerge = await PDFDocument.load(fileBytes);
        const copiedPages = await newPdfDoc.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        copiedPages.forEach((page) => newPdfDoc.addPage(page));
    }
    const mergedPdfBytes = await newPdfDoc.save();
    saveFile(mergedPdfBytes, 'pdf-juntado.pdf');
    showUserMessage('PDFs juntados com sucesso!');
}

async function handleSplit(file, pageRangesStr) {
    showUserMessage('Dividindo o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(fileBytes);
    let pagesToKeep = originalPdf.getPageIndices();
    if (pageRangesStr.trim() !== '') {
        pagesToKeep = [];
        pageRangesStr.split(',').forEach(range => {
            range = range.trim();
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(num => parseInt(num.trim(), 10));
                for (let i = start; i <= end; i++) {
                    pagesToKeep.push(i - 1);
                }
            } else {
                pagesToKeep.push(parseInt(range, 10) - 1);
            }
        });
    }
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(originalPdf, pagesToKeep);
    copiedPages.forEach((page) => newPdfDoc.addPage(page));
    const splitPdfBytes = await newPdfDoc.save();
    saveFile(splitPdfBytes, 'pdf-dividido.pdf');
    showUserMessage('PDF dividido com sucesso!');
}

async function handleProtect(file, password) {
    showUserMessage('Protegendo o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const options = {
        userPassword: password,
        ownerPassword: password,
        permissions: { printing: PermissionFlag.Deny, modifying: PermissionFlag.Deny, copying: PermissionFlag.Deny },
    };
    const protectedPdfBytes = await pdfDoc.save({ ...options, useObjectStreams: false });
    saveFile(protectedPdfBytes, 'pdf-protegido.pdf');
    showUserMessage('PDF protegido com sucesso!');
}

async function handleUnlock(file, password) {
    showUserMessage('Desbloqueando o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes, { ownerPassword: password, password: password });
    const unlockedPdfBytes = await pdfDoc.save();
    saveFile(unlockedPdfBytes, 'pdf-desbloqueado.pdf');
    showUserMessage('PDF desbloqueado com sucesso!');
}

async function handleRotate(file) {
    showUserMessage('Rodando o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + 90));
    });
    const rotatedPdfBytes = await pdfDoc.save();
    saveFile(rotatedPdfBytes, 'pdf-rodado.pdf');
    showUserMessage('PDF rotacionado com sucesso!');
}

async function handleWatermark(file, text) {
    showUserMessage('Adicionando marca d\'água... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(text, { x: width / 2 - 150, y: height / 2, size: 50, font, color: rgb(0.95, 0.1, 0.1), opacity: 0.2, rotate: degrees(-45) });
    });
    const watermarkedPdfBytes = await pdfDoc.save();
    saveFile(watermarkedPdfBytes, 'pdf-com-marca-dagua.pdf');
    showUserMessage('Marca d\'água adicionada com sucesso!');
}

async function handleJpgToPdf(files) {
    showUserMessage('Convertendo imagens para PDF... Por favor, aguarde.');
    const newPdfDoc = await PDFDocument.create();
    for (const file of files) {
        const fileBytes = await file.arrayBuffer();
        let image;
        if (file.type === 'image/jpeg') {
            image = await newPdfDoc.embedJpg(fileBytes);
        } else if (file.type === 'image/png') {
            image = await newPdfDoc.embedPng(fileBytes);
        } else {
            showUserMessage(`Formato de arquivo não suportado: ${file.type}. Pulando.`, 'warn');
            continue;
        }
        const page = newPdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    if (newPdfDoc.getPageCount() === 0) {
        return showUserMessage('Nenhuma imagem compatível (JPG/PNG) foi encontrada para converter.', 'error');
    }
    const pdfBytes = await newPdfDoc.save();
    saveFile(pdfBytes, 'imagens-convertidas.pdf');
    showUserMessage('Imagens convertidas para PDF com sucesso!');
}

async function handlePdfToJpg(file) {
    showUserMessage('Convertendo PDF para JPG... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: fileBytes }).promise;
    if (pdfDoc.numPages === 0) {
        return showUserMessage('Este PDF não tem páginas para converter.', 'error');
    }
    const pageNumber = 1;
    const page = await pdfDoc.getPage(pageNumber);
    const scale = 2.0;
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = { canvasContext: context, viewport: viewport };
    await page.render(renderContext).promise;
    canvas.toBlob(function(blob) {
        saveAs(blob, `pagina_${pageNumber}_de_${file.name.replace('.pdf', '.jpg')}`);
        showUserMessage('PDF convertido para JPG com sucesso!');
    }, 'image/jpeg', 0.9);
}

async function handleSign(pdfFile, signatureFile) {
    showUserMessage('Assinando o documento... Por favor, aguarde.');
    const pdfBytes = await pdfFile.arrayBuffer();
    const signatureBytes = await signatureFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const firstPage = pdfDoc.getPages()[0];
    const { width } = firstPage.getSize();
    const signatureWidth = 150;
    const signatureHeight = (signatureWidth / signatureImage.width) * signatureImage.height;
    firstPage.drawImage(signatureImage, { x: width - signatureWidth - 50, y: 50, width: signatureWidth, height: signatureHeight });
    const signedPdfBytes = await pdfDoc.save();
    saveFile(signedPdfBytes, 'documento-assinado.pdf');
    showUserMessage('Documento assinado com sucesso!');
}

async function handleEdit_addText(file) {
    showUserMessage('Editando o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const firstPage = pdfDoc.getPages()[0];
    firstPage.drawText('Texto Adicionado com a Ferramenta Editar!', { x: 60, y: firstPage.getHeight() - 60, size: 24, font, color: rgb(1, 0, 0) });
    const editedPdfBytes = await pdfDoc.save();
    saveFile(editedPdfBytes, 'pdf-editado.pdf');
    showUserMessage('PDF editado com sucesso!');
}

async function handleOrganize_deleteLastPage(file) {
    showUserMessage('Organizando o PDF... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    if (pdfDoc.getPageCount() > 1) {
        pdfDoc.removePage(pdfDoc.getPageCount() - 1);
        const newPdfBytes = await pdfDoc.save();
        saveFile(newPdfBytes, 'pdf-organizado.pdf');
        showUserMessage('Última página removida com sucesso!');
    } else {
        showUserMessage('O PDF precisa ter mais de uma página para que a última seja removida.', 'error');
    }
}

async function handlePageNumbering(file) {
    showUserMessage('Adicionando números de página... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes);
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    
    for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNumberText = `Página ${i + 1} de ${totalPages}`;
        const textSize = 12;
        const textWidth = font.widthOfTextAtSize(pageNumberText, textSize);

        page.drawText(pageNumberText, {
            x: width - textWidth - 50, // Posição à direita
            y: 30, // Posição na base
            size: textSize,
            font: font,
            color: rgb(0.5, 0.5, 0.5), // Cor cinza
        });
    }

    const numberedPdfBytes = await pdfDoc.save();
    saveFile(numberedPdfBytes, 'pdf-numerado.pdf');
    showUserMessage('Páginas numeradas com sucesso!');
}