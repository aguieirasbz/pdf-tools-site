document.addEventListener('DOMContentLoaded', () => {
    // Detecta qual página está ativa para executar o código correto
    const path = window.location.pathname;

    // ===================================================================
    // LÓGICA PARA A PÁGINA JSON PARA CSV
    // ===================================================================
    if (path.includes('json-to-csv.html')) {
        const jsonInput = document.getElementById('json-input');
        const csvOutput = document.getElementById('csv-output');
        const convertBtn = document.getElementById('convert-btn');
        const clearBtn = document.getElementById('clear-input');
        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        const fileInput = document.getElementById('file-input-json');

        // Adiciona os "escutadores" de eventos aos botões
        convertBtn.addEventListener('click', convertJsonToCsv);
        fileInput.addEventListener('change', handleJsonFileUpload);
        clearBtn.addEventListener('click', () => { jsonInput.value = ''; csvOutput.value = ''; });
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(csvOutput.value));
        downloadBtn.addEventListener('click', () => downloadFile(csvOutput.value, 'data.csv', 'text/csv;charset=utf-8;'));

        // Função principal de conversão
        function convertJsonToCsv() {
            try {
                const jsonText = jsonInput.value.trim();
                if (!jsonText) throw new Error("A entrada JSON está vazia.");
                
                const data = JSON.parse(jsonText);
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error("O JSON deve ser um array de objetos não vazio.");
                }

                const headers = Object.keys(data[0]);
                const csvRows = [headers.join(',')];

                data.forEach(row => {
                    const values = headers.map(header => {
                        const val = row[header] === null || row[header] === undefined ? '' : row[header];
                        const escaped = ('' + val).replace(/"/g, '""'); // Escapa aspas duplas
                        return `"${escaped}"`; // Coloca todos os valores entre aspas
                    });
                    csvRows.push(values.join(','));
                });
                
                csvOutput.value = csvRows.join('\n');
            } catch (error) {
                csvOutput.value = `Erro: ${error.message}`;
            }
        }

        // Função para carregar arquivo JSON
        function handleJsonFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    jsonInput.value = e.target.result;
                };
                reader.readAsText(file, 'UTF-8'); // JSON é lido como UTF-8 por padrão
            }
        }
    }

    // ===================================================================
    // LÓGICA PARA A PÁGINA CSV PARA JSON
    // ===================================================================
    if (path.includes('csv-to-json.html')) {
        const csvInput = document.getElementById('csv-input');
        const jsonOutput = document.getElementById('json-output');
        const convertBtn = document.getElementById('convert-btn');
        const clearBtn = document.getElementById('clear-input');
        const copyBtn = document.getElementById('copy-output');
        const downloadBtn = document.getElementById('download-output');
        const fileInput = document.getElementById('file-input-csv');
        const headerCheckbox = document.getElementById('header-checkbox');
        const delimiterInput = document.getElementById('delimiter-input');
        
        // Adiciona os "escutadores" de eventos aos botões
        convertBtn.addEventListener('click', convertCsvToJson);
        fileInput.addEventListener('change', handleCsvFileUpload);
        clearBtn.addEventListener('click', () => { csvInput.value = ''; jsonOutput.value = ''; });
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(jsonOutput.value));
        downloadBtn.addEventListener('click', () => downloadFile(jsonOutput.value, 'data.json', 'application/json;charset=utf-8;'));

        // Função principal de conversão
        function convertCsvToJson() {
            try {
                const csvText = csvInput.value.trim();
                if (!csvText) throw new Error("A entrada CSV está vazia.");

                const delimiter = delimiterInput.value || ',';
                // Remove linhas em branco do final do arquivo
                const lines = csvText.split('\n').filter(line => line.trim() !== '');
                if (lines.length === 0) throw new Error("CSV não contém linhas válidas.");

                const hasHeader = headerCheckbox.checked;
                const headers = hasHeader ? lines.shift().split(delimiter).map(h => h.trim()) : [];
                
                const result = lines.map(line => {
                    const values = line.split(delimiter);
                    if (hasHeader) {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = values[index] ? values[index].trim() : '';
                        });
                        return obj;
                    }
                    return values;
                });
                
                jsonOutput.value = JSON.stringify(result, null, 2); // O '2' formata o JSON
            } catch (error) {
                jsonOutput.value = `Erro: ${error.message}`;
            }
        }
        
        // Função para carregar arquivo CSV com seleção de codificação
        function handleCsvFileUpload(event) {
            const file = event.target.files[0];
            const encodingSelect = document.getElementById('encoding-select');
            
            if (file && encodingSelect) {
                const encoding = encodingSelect.value;
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    csvInput.value = e.target.result;
                };
                
                // Lê o arquivo usando a codificação especificada pelo usuário
                reader.readAsText(file, encoding);
            }
        }
    }

    // ===================================================================
    // FUNÇÃO DE DOWNLOAD GENÉRICA (usada por ambas as páginas)
    // ===================================================================
    function downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
});