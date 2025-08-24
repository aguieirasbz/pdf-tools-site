document.addEventListener('DOMContentLoaded', function() {

    // ================================================================= hbh
    // 1. INICIALIZAÇÃO E LÓGICA DAS ABAS
    // =================================================================
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolPages = document.querySelectorAll('.tool-page');
    const { PDFDocument, rgb, degrees, StandardFonts, PermissionFlag } = window.PDFLib;

    function switchTab(toolId) {
        toolTabs.forEach(t => t.classList.remove('active'));
        toolPages.forEach(p => p.classList.remove('active'));
        const newActiveTab = document.querySelector(`.tool-tab[data-tool="${toolId}"]`);
        const newActivePage = document.getElementById(`${toolId}-page`);
        if (newActiveTab && newActivePage) {
            newActiveTab.classList.add('active');
            newActivePage.classList.add('active');
            history.pushState(null, '', `#${toolId}`);
        }
    }

    if (toolTabs.length > 0) {
        toolTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.getAttribute('data-tool'));
            });
        });
        const currentHash = window.location.hash.substring(1);
        if (currentHash && document.getElementById(`${currentHash}-page`)) {
            switchTab(currentHash);
        } else {
            switchTab(toolTabs[0].getAttribute('data-tool'));
        }
    }

    // =================================================================
    // 2. FUNÇÕES DE LÓGICA PARA AS FERRAMENTAS
    // =================================================================
    async function handleMerge(files) { const newPdfDoc=await PDFDocument.create();for(const file of files){const fileBytes=await file.arrayBuffer();const pdfToMerge=await PDFDocument.load(fileBytes);const copiedPages=await newPdfDoc.copyPages(pdfToMerge,pdfToMerge.getPageIndices());copiedPages.forEach((page)=>newPdfDoc.addPage(page))}const mergedPdfBytes=await newPdfDoc.save();saveAs(new Blob([mergedPdfBytes],{type:'application/pdf'}),'pdf-juntado.pdf')}
    async function handleSplit(file,pageRangesStr){const fileBytes=await file.arrayBuffer();const originalPdf=await PDFDocument.load(fileBytes);let pagesToKeep=originalPdf.getPageIndices();if(pageRangesStr.trim()!==''){pagesToKeep=[];pageRangesStr.split(',').forEach(range=>{if(range.includes('-')){const[start,end]=range.split('-').map(num=>parseInt(num.trim(),10));for(let i=start;i<=end;i++){pagesToKeep.push(i-1)}}else{pagesToKeep.push(parseInt(range.trim(),10)-1)}})}const newPdfDoc=await PDFDocument.create();const copiedPages=await newPdfDoc.copyPages(originalPdf,pagesToKeep);copiedPages.forEach((page)=>newPdfDoc.addPage(page));const splitPdfBytes=await newPdfDoc.save();saveAs(new Blob([splitPdfBytes],{type:'application/pdf'}),'pdf-dividido.pdf')}
    async function handleProtect(file,password){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes);const options={userPassword:password,ownerPassword:password,permissions:{printing:PermissionFlag.Deny,modifying:PermissionFlag.Deny,copying:PermissionFlag.Deny,}};const protectedPdfBytes=await pdfDoc.save({...options,useObjectStreams:false});saveAs(new Blob([protectedPdfBytes],{type:'application/pdf'}),'pdf-protegido.pdf')}
    async function handleUnlock(file,password){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes,{ownerPassword:password,password:password});const unlockedPdfBytes=await pdfDoc.save();saveAs(new Blob([unlockedPdfBytes],{type:'application/pdf'}),'pdf-desbloqueado.pdf')}
    async function handleRotate(file){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes);const pages=pdfDoc.getPages();pages.forEach(page=>{const currentRotation=page.getRotation().angle;page.setRotation(degrees(currentRotation+90))});const rotatedPdfBytes=await pdfDoc.save();saveAs(new Blob([rotatedPdfBytes],{type:'application/pdf'}),'pdf-rodado.pdf')}
    async function handleWatermark(file,text){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes);const font=await pdfDoc.embedFont(StandardFonts.Helvetica);const pages=pdfDoc.getPages();pages.forEach(page=>{const{width,height}=page.getSize();page.drawText(text,{x:width/2-150,y:height/2,size:50,font,color:rgb(0.95,0.1,0.1),opacity:0.2,rotate:degrees(-45)})});const watermarkedPdfBytes=await pdfDoc.save();saveAs(new Blob([watermarkedPdfBytes],{type:'application/pdf'}),'pdf-com-marca-dagua.pdf')}
    async function handleJpgToPdf(files){const newPdfDoc=await PDFDocument.create();for(const file of files){const fileBytes=await file.arrayBuffer();let image;if(file.type==='image/jpeg'){image=await newPdfDoc.embedJpg(fileBytes)}else if(file.type==='image/png'){image=await newPdfDoc.embedPng(fileBytes)}else{console.warn(`Formato de arquivo não suportado: ${file.type}. Pulando.`);continue}const page=newPdfDoc.addPage([image.width,image.height]);page.drawImage(image,{x:0,y:0,width:image.width,height:image.height})}if(newPdfDoc.getPageCount()===0){return alert('Nenhuma imagem compatível (JPG/PNG) foi encontrada para converter.')}const pdfBytes=await newPdfDoc.save();saveAs(new Blob([pdfBytes],{type:'application/pdf'}),'imagens-convertidas.pdf')}
    async function handlePdfToJpg(file){const fileBytes=await file.arrayBuffer();const pdfDoc=await pdfjsLib.getDocument({data:fileBytes}).promise;if(pdfDoc.numPages===0){return alert('Este PDF não tem páginas para converter.')}const pageNumber=1;const page=await pdfDoc.getPage(pageNumber);const scale=2.0;const viewport=page.getViewport({scale:scale});const canvas=document.createElement('canvas');const context=canvas.getContext('2d');canvas.height=viewport.height;canvas.width=viewport.width;const renderContext={canvasContext:context,viewport:viewport};await page.render(renderContext).promise;canvas.toBlob(function(blob){saveAs(blob,`pagina_${pageNumber}_de_${file.name}.jpg`)},'image/jpeg',0.9)}
    async function handleSign(pdfFile,signatureFile){const pdfBytes=await pdfFile.arrayBuffer();const signatureBytes=await signatureFile.arrayBuffer();const pdfDoc=await PDFDocument.load(pdfBytes);const signatureImage=await pdfDoc.embedPng(signatureBytes);const firstPage=pdfDoc.getPages()[0];const{width,height}=firstPage.getSize();const signatureWidth=150;const signatureHeight=(signatureWidth/signatureImage.width)*signatureImage.height;firstPage.drawImage(signatureImage,{x:width-signatureWidth-50,y:50,width:signatureWidth,height:signatureHeight});const signedPdfBytes=await pdfDoc.save();saveAs(new Blob([signedPdfBytes],{type:'application/pdf'}),'documento-assinado.pdf')}
    async function handleEdit_addText(file){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes);const font=await pdfDoc.embedFont(StandardFonts.Helvetica);const firstPage=pdfDoc.getPages()[0];firstPage.drawText('Texto Adicionado com a Ferramenta Editar!',{x:60,y:firstPage.getHeight()-60,size:24,font,color:rgb(1,0,0)});const editedPdfBytes=await pdfDoc.save();saveAs(new Blob([editedPdfBytes],{type:'application/pdf'}),'pdf-editado.pdf')}
    async function handleOrganize_deleteLastPage(file){const fileBytes=await file.arrayBuffer();const pdfDoc=await PDFDocument.load(fileBytes);if(pdfDoc.getPageCount()>1){pdfDoc.removePage(pdfDoc.getPageCount()-1);const newPdfBytes=await pdfDoc.save();saveAs(new Blob([newPdfBytes],{type:'application/pdf'}),'pdf-organizado.pdf')}else{alert('O PDF precisa ter mais de uma página para que a última seja removida.')}}

    // =================================================================
    // 3. CONECTANDO BOTÕES À LÓGICA (EVENT LISTENERS)
    // =================================================================
    const setupToolListener = (toolName, handler) => {
        const btn = document.getElementById(`${toolName}-btn`);
        if (!btn) return;
        const input = document.getElementById(`${toolName}-input`);
        
        btn.addEventListener('click', async () => {
            if (input && input.files.length === 0) {
                return alert('Por favor, selecione um arquivo.');
            }
            
            const originalText = btn.textContent;
            btn.textContent = 'Processando...';
            btn.disabled = true;

            try {
                if (toolName === 'juntar' || toolName === 'jpg-pdf') {
                    if (input.files.length < 2 && toolName === 'juntar') return alert('Por favor, selecione pelo menos 2 arquivos PDF.');
                    await handler(input.files);
                } else if (toolName === 'dividir') {
                    const ranges = document.getElementById('dividir-ranges').value;
                    await handler(input.files[0], ranges);
                } else if (toolName === 'marca-dagua') {
                    const text = document.getElementById('marca-dagua-text').value;
                    if (text.trim() === '') return alert('Por favor, digite o texto da marca d\'água.');
                    await handler(input.files[0], text);
                } else if (toolName === 'proteger' || toolName === 'desbloquear') {
                    const password = document.getElementById(`${toolName}-password`).value;
                    if (password.trim() === '') return alert('Por favor, digite a senha.');
                    await handler(input.files[0], password);
                } else {
                    await handler(input.files[0]);
                }
            } catch (e) {
                alert('Ocorreu um erro: ' + e.message);
                console.error(e);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    };
    
    setupToolListener('juntar', handleMerge);
    setupToolListener('dividir', handleSplit);
    setupToolListener('proteger', handleProtect);
    setupToolListener('desbloquear', handleUnlock);
    setupToolListener('rodar', handleRotate);
    setupToolListener('marca-dagua', handleWatermark);
    setupToolListener('jpg-pdf', handleJpgToPdf);
    setupToolListener('pdf-jpg', handlePdfToJpg);
    setupToolListener('editar', handleEdit_addText);
    setupToolListener('organizar', handleOrganize_deleteLastPage);

    // Listener customizado para a ferramenta de assinatura
    const assinarBtn = document.getElementById('assinar-btn');
    if (assinarBtn) {
        assinarBtn.addEventListener('click', async () => {
            const pdfInput = document.getElementById('assinar-pdf-input');
            const signatureInput = document.getElementById('assinar-signature-input');

            if (pdfInput.files.length === 0) return alert('Por favor, selecione o arquivo PDF.');
            if (signatureInput.files.length === 0) return alert('Por favor, selecione a imagem da assinatura.');
            
            const originalText = assinarBtn.textContent;
            assinarBtn.textContent = 'Processando...';
            assinarBtn.disabled = true;
            try {
                await handleSign(pdfInput.files[0], signatureInput.files[0]);
            } catch (e) {
                alert('Ocorreu um erro: ' + e.message);
                console.error(e);
            } finally {
                assinarBtn.textContent = originalText;
                assinarBtn.disabled = false;
            }
        });
    }
});