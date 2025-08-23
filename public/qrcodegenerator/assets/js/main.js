document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos das Abas ---
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let activeTab = 'url';

    // --- Elementos dos Inputs ---
    const urlInput = document.getElementById('url-input');
    const textInput = document.getElementById('text-input');
    const wifiSsidInput = document.getElementById('wifi-ssid');
    const wifiPassInput = document.getElementById('wifi-pass');
    const wifiTypeSelect = document.getElementById('wifi-type');

    // --- Elementos das Opções ---
    const qrSizeSelect = document.getElementById('qr-size');
    const qrColorDarkInput = document.getElementById('qr-color-dark');
    const qrColorLightInput = document.getElementById('qr-color-light');
    const qrCorrectionSelect = document.getElementById('qr-correction');

    // --- Elementos da Saída ---
    const qrcodeContainer = document.getElementById('qrcode-container');
    const downloadPngBtn = document.getElementById('download-png');
    const downloadJpgBtn = document.getElementById('download-jpg');

    let qrcodeInstance = null;

    // --- Lógica das Abas ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            activeTab = targetTab;

            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${targetTab}`) {
                    content.classList.add('active');
                }
            });
            generateQRCode(); // Gera o QR Code ao trocar de aba
        });
    });

    // --- Lógica de Geração ---
    const allInputs = [urlInput, textInput, wifiSsidInput, wifiPassInput, wifiTypeSelect, qrSizeSelect, qrColorDarkInput, qrColorLightInput, qrCorrectionSelect];
    allInputs.forEach(input => {
        input.addEventListener('input', generateQRCode);
        input.addEventListener('change', generateQRCode);
    });
    
    function generateQRCode() {
        let textToEncode = '';

        // Pega o texto baseado na aba ativa
        switch (activeTab) {
            case 'url':
                textToEncode = urlInput.value.trim();
                break;
            case 'text':
                textToEncode = textInput.value.trim();
                break;
            case 'wifi':
                const ssid = wifiSsidInput.value;
                const pass = wifiPassInput.value;
                const type = wifiTypeSelect.value;
                if (ssid) {
                    textToEncode = `WIFI:T:${type};S:${ssid};P:${pass};;`;
                }
                break;
        }

        // Limpa o container
        qrcodeContainer.innerHTML = '';

        if (!textToEncode) {
            // Desabilita botões de download se não há texto
            setDownloadButtonsState(false);
            return;
        }

        // Pega as opções de personalização
        const size = parseInt(qrSizeSelect.value, 10);
        const colorDark = qrColorDarkInput.value;
        const colorLight = qrColorLightInput.value;
        const correctLevel = QRCode.CorrectLevel[qrCorrectionSelect.value];
        
        // Cria a instância do QR Code
        qrcodeInstance = new QRCode(qrcodeContainer, {
            text: textToEncode,
            width: size,
            height: size,
            colorDark: colorDark,
            colorLight: colorLight,
            correctLevel: correctLevel
        });

        // Habilita os botões de download
        setDownloadButtonsState(true);
    }
    
    function setDownloadButtonsState(isReady) {
        if (isReady) {
            downloadPngBtn.classList.add('ready');
            downloadJpgBtn.classList.add('ready');
        } else {
            downloadPngBtn.classList.remove('ready');
            downloadJpgBtn.classList.remove('ready');
        }
    }

    // --- Lógica de Download ---
    downloadPngBtn.addEventListener('click', () => downloadQRCode('png'));
    downloadJpgBtn.addEventListener('click', () => downloadQRCode('jpeg'));

    function downloadQRCode(format) {
        if (!qrcodeInstance || !qrcodeInstance._el.querySelector('canvas')) return;

        const canvas = qrcodeInstance._el.querySelector('canvas');
        const link = document.createElement('a');
        link.download = `qrcode.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, 1.0);
        link.click();
    }
    
    // Gera um QR Code inicial ao carregar a página
    generateQRCode();
});