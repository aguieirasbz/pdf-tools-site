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
    const a4Portrait = { width: 595.28, height: 841.89 };
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
        const isLandscape = image.width > image.height;
        const pageWidth = isLandscape ? a4Portrait.height : a4Portrait.width;
        const pageHeight = isLandscape ? a4Portrait.width : a4Portrait.height;
        const page = newPdfDoc.addPage([pageWidth, pageHeight]);
        const margin = 24;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        const imageWidth = image.width * ratio;
        const imageHeight = image.height * ratio;

        page.drawImage(image, {
            x: (pageWidth - imageWidth) / 2,
            y: (pageHeight - imageHeight) / 2,
            width: imageWidth,
            height: imageHeight
        });
    }
    if (newPdfDoc.getPageCount() === 0) {
        return showUserMessage('Nenhuma imagem compatível (JPG/PNG) foi encontrada para converter.', 'error');
    }
    const pdfBytes = await newPdfDoc.save();
    saveFile(pdfBytes, 'imagens-convertidas.pdf');
    showUserMessage('Imagens convertidas para PDF com sucesso!');
}

async function handlePdfToJpg(file) {
    showUserMessage('Convertendo PDF para JPG em alta qualidade... Por favor, aguarde.');
    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: fileBytes }).promise;
    if (pdfDoc.numPages === 0) {
        return showUserMessage('Este PDF não tem páginas para converter.', 'error');
    }
    const baseName = file.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '-');
    const scale = 3.0;
    const jpegQuality = 0.95;
    const zip = pdfDoc.numPages > 1 && typeof JSZip !== 'undefined' ? new JSZip() : null;

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
            canvasContext: context,
            viewport,
            background: 'white'
        }).promise;

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', jpegQuality);
        });

        if (!blob) {
            throw new Error(`Nao foi possivel gerar a imagem da pagina ${pageNumber}.`);
        }

        const fileName = `${baseName}-pagina-${String(pageNumber).padStart(3, '0')}.jpg`;
        if (zip) {
            zip.file(fileName, blob);
        } else {
            saveAs(blob, fileName);
        }
    }

    if (zip) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${baseName}-jpg.zip`);
    }

    showUserMessage('PDF convertido para JPG com sucesso!');
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
