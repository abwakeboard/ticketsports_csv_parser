const COLUMN_CONFIG = [
    { key: 'Nome completo', label: 'Nome completo', required: true, aliases: ['nome completo', 'nome', 'participante'] },
    { key: 'Modalidade', label: 'Modalidade', required: true, aliases: ['modalidade', 'tipo de ingresso', 'ingresso'] },
    { key: 'Data de nascimento', label: 'Data de nascimento', aliases: ['data de nascimento', 'nascimento'] },
    { key: 'Celular', label: 'Celular', aliases: ['celular', 'whatsapp', 'telefone'] },
    { key: 'Cidade', label: 'Cidade', aliases: ['cidade'] },
    { key: 'UF', label: 'UF', aliases: ['uf'] },
    { key: 'Instagram', label: 'Instagram', aliases: ['instagram', '@instagram'] },
    { key: 'contato_de_emergencia', label: 'Contato de emergencia', aliases: ['contato de emergencia', 'contato_de_emergencia'] },
    { key: 'stance', label: 'Stance', aliases: ['stance', 'stace', 'base'] },
    { key: 'frequencia', label: 'Frequencia', aliases: ['frequencia', 'com que frequencia voce anda de wake'] },
    { key: 'tempo_que_anda', label: 'Ha quantos anos anda', aliases: ['tempo que anda', 'ha quantos anos voce anda de wake'] },
    { key: 'lugar_que_pratica', label: 'Lugar que anda', aliases: ['lugar que pratica', 'em que lugares voce anda de wake'] },
    { key: 'Manobras_que_acerta', label: 'Manobras que acerta', aliases: ['manobras que acerta', '3 principais manobras que voce acerta'] },
    { key: 'patrocinadores', label: 'Patrocinadores', aliases: ['patrocinadores', 'voce tem patrocinadores quais'] },
    { key: 'prancha', label: 'Prancha', aliases: ['prancha', 'qual a marca da sua prancha'] },
    { key: 'curiosidade', label: 'Curiosidade', aliases: ['curiosidade', 'conte uma curiosidade sobre voce'] },
    { key: 'apelido', label: 'Apelido', aliases: ['apelido', 'escreva o nome e ou apelido como voce quer ser divulgado no evento'] },
    { key: 'Camiseta', label: 'Camiseta', aliases: ['camiseta', 'tamanho da camisa', 'camiseta do kit atleta', 'camiseta wakeboard', 'camiseta wakesurf'] }
];

let currentImportData = null;

// lida com usuario arrastando arquivo pra area
function handleDrop(event) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
}

// lida com usuario clicando em vez de arrastando
document.getElementById('drop-area').addEventListener('click', function () {
    document.getElementById('file-input').click();
});

const inputElement = document.getElementById('file-input');
inputElement.addEventListener('change', handleFileInput, false);

function handleFileInput() {
    handleFiles(this.files);
}

async function handleFiles(files) {
    const file = files[0];

    if (!file) {
        return;
    }

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        const rows = csvToJSON(text);
        prepareImportedData({
            source: 'csv',
            headers: Object.keys(rows[0] || {}),
            rows
        });
        return;
    }

    if (fileName.endsWith('.xlsx')) {
        if (typeof XLSX === 'undefined') {
            alert('Biblioteca de leitura de XLSX nao foi carregada.');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        fixWorksheetRange(worksheet);
        const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        const parsed = parseSymplaWorksheet(matrix);

        prepareImportedData({
            source: 'xlsx',
            headers: parsed.headers,
            rows: parsed.rows
        });
        return;
    }

    alert('Please drop a CSV or XLSX file.');
}

function fixWorksheetRange(worksheet) {
    const cellAddresses = Object.keys(worksheet).filter(key => /^[A-Z]+[0-9]+$/.test(key));

    if (!cellAddresses.length || typeof XLSX === 'undefined' || !XLSX.utils) {
        return;
    }

    const range = cellAddresses.reduce((acc, address) => {
        const cell = XLSX.utils.decode_cell(address);

        acc.s.r = Math.min(acc.s.r, cell.r);
        acc.s.c = Math.min(acc.s.c, cell.c);
        acc.e.r = Math.max(acc.e.r, cell.r);
        acc.e.c = Math.max(acc.e.c, cell.c);

        return acc;
    }, {
        s: { r: Number.MAX_SAFE_INTEGER, c: Number.MAX_SAFE_INTEGER },
        e: { r: 0, c: 0 }
    });

    worksheet['!ref'] = XLSX.utils.encode_range(range);
}

function csvToJSON(inputText) {
    const lines = inputText
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    if (!lines.length) {
        return [];
    }

    const headers = lines[0].split(';').map(header => header.trim());

    return lines.slice(1).map(line => {
        const obj = {};
        const currentLine = line.split(';').map(value => value.trim());

        headers.forEach((header, index) => {
            obj[header] = currentLine[index] || '';
        });

        return obj;
    });
}

function parseSymplaWorksheet(matrix) {
    const headerRowIndex = findHeaderRowIndex(matrix, 'Tipo de ingresso', 7);
    const headers = (matrix[headerRowIndex] || []).map(value => String(value || '').trim());

    const rows = matrix
        .slice(headerRowIndex + 1)
        .filter(row => row.some(cell => String(cell || '').trim() !== ''))
        .map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = String(row[index] || '').trim();
            });
            return obj;
        });

    return { headers, rows };
}

function findHeaderRowIndex(matrix, expectedHeader, fallbackIndex) {
    const normalizedExpected = normalizeHeader(expectedHeader);
    const foundIndex = matrix.findIndex(row =>
        row.some(cell => normalizeHeader(cell) === normalizedExpected)
    );

    return foundIndex >= 0 ? foundIndex : fallbackIndex;
}

function prepareImportedData(importData) {
    currentImportData = {
        ...importData,
        mapping: buildInitialMapping(importData.headers, importData.source)
    };

    renderColumnMapper();
    processImportedData();
}

function buildInitialMapping(headers, source) {
    const normalizedHeaders = headers.map(header => ({
        original: header,
        normalized: normalizeHeader(header)
    }));

    return COLUMN_CONFIG.reduce((mapping, config) => {
        if (source === 'xlsx' && config.key === 'Modalidade') {
            const tipoDeIngresso = normalizedHeaders.find(header => header.normalized === normalizeHeader('Tipo de ingresso'));
            mapping[config.key] = tipoDeIngresso ? tipoDeIngresso.original : '';
            return mapping;
        }

        if (source === 'xlsx' && config.key === 'Nome completo') {
            mapping[config.key] = '';
            return mapping;
        }

        if (config.key === 'Celular') {
            const exactCelular = normalizedHeaders.find(header => header.normalized === normalizeHeader('Celular'));
            if (exactCelular) {
                mapping[config.key] = exactCelular.original;
                return mapping;
            }
        }

        const matched = normalizedHeaders.find(header =>
            headerMatchesConfig(header.normalized, config)
        );

        mapping[config.key] = matched ? matched.original : '';
        return mapping;
    }, {});
}

function headerMatchesConfig(normalizedHeader, config) {
    if (normalizedHeader === normalizeHeader(config.key)) {
        return true;
    }

    return config.aliases.some(alias => headerMatchesAlias(normalizedHeader, alias));
}

function headerMatchesAlias(normalizedHeader, alias) {
    const aliasTokens = normalizeHeader(alias).split(' ').filter(Boolean);
    const headerTokens = normalizedHeader.split(' ').filter(Boolean);

    return aliasTokens.length > 0 && aliasTokens.every(token => headerTokens.includes(token));
}

function renderColumnMapper() {
    const container = document.getElementById('column-mapper');
    const fieldsContainer = document.getElementById('column-mapper-fields');

    if (!currentImportData || !currentImportData.headers.length) {
        container.style.display = 'none';
        fieldsContainer.innerHTML = '';
        return;
    }

    const missingRequiredField = COLUMN_CONFIG.some(config =>
        config.required && !currentImportData.mapping[config.key]
    );

    container.style.display = currentImportData.source === 'xlsx' || missingRequiredField ? 'block' : 'none';

    fieldsContainer.innerHTML = '';

    COLUMN_CONFIG.forEach(config => {
        const label = document.createElement('label');
        label.className = 'mapper-field';

        const span = document.createElement('span');
        span.textContent = config.label;

        const select = document.createElement('select');
        select.dataset.targetField = config.key;

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Nao encontrado automaticamente';
        select.appendChild(emptyOption);

        currentImportData.headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;

            if (currentImportData.mapping[config.key] === header) {
                option.selected = true;
            }

            select.appendChild(option);
        });

        select.addEventListener('change', event => {
            currentImportData.mapping[event.target.dataset.targetField] = event.target.value;
            processImportedData();
        });

        label.appendChild(span);
        label.appendChild(select);
        fieldsContainer.appendChild(label);
    });
}

function processImportedData() {
    if (!currentImportData) {
        return;
    }

    const normalizedRows = currentImportData.rows
        .filter(row => shouldIncludeRow(row, currentImportData.source))
        .map(row => normalizeRow(row, currentImportData.mapping))
        .filter(row => row['Nome completo'] && row['Modalidade']);

    parseRows(normalizedRows);
}

function shouldIncludeRow(row, source) {
    if (source !== 'xlsx') {
        return true;
    }

    return getMappedValueIgnoreCase(row, 'Estado de pagamento') === 'Aprovado';
}

function normalizeRow(row, mapping) {
    const normalized = { ...row };

    COLUMN_CONFIG.forEach(config => {
        normalized[config.key] = getMappedValue(row, mapping[config.key]);
    });

    const firstName = getMappedValueIgnoreCase(row, 'Nome') || getMappedValueIgnoreCase(row, 'Primeiro nome');
    const lastName = getMappedValueIgnoreCase(row, 'Sobrenome');

    normalized['Nome completo'] = normalizeName(
        [firstName, lastName].filter(Boolean).join(' ') ||
        normalized['Nome completo']
    );

    normalized['Modalidade'] = normalizeModalidade(normalized['Modalidade']);
    normalized['Instagram'] = normalizeInstagram(normalized['Instagram']);
    normalized['Data de nascimento'] = normalized['Data de nascimento'] || getMappedValue(row, 'NASCIMENTO');
    normalized['Celular'] = normalized['Celular'] || getMappedValue(row, 'whatsapp');
    normalized['contato_de_emergencia'] = normalized['contato_de_emergencia'] || getMappedValue(row, 'CONTATO DE EMERGÊNCIA (NOME + CELULAR) ');
    normalized['stance'] = normalized['stance'] || getMappedValue(row, 'QUAL SUA BASE / STACE?');
    normalized['frequencia'] = normalized['frequencia'] || getMappedValue(row, 'COM QUE FREQUÊNCIA VOCÊ ANDA DE WAKE? ');
    normalized['tempo_que_anda'] = normalized['tempo_que_anda'] || getMappedValue(row, 'HÁ QUANTOS ANOS VOCÊ ANDA DE WAKE? ');
    normalized['prancha'] = normalized['prancha'] || getMappedValue(row, 'QUAL A MARCA DA SUA PRANCHA?');
    normalized['lugar_que_pratica'] = normalized['lugar_que_pratica'] || getMappedValue(row, 'EM QUE LUGARES VOCÊ ANDA DE WAKE?');
    normalized['patrocinadores'] = normalized['patrocinadores'] || getMappedValue(row, 'VOCÊ TEM PATROCINADORES? QUAIS?');
    normalized['curiosidade'] = normalized['curiosidade'] || getMappedValue(row, 'CONTE UMA CURIOSIDADE SOBRE VOCÊ');
    normalized['Manobras_que_acerta'] = normalized['Manobras_que_acerta'] || getMappedValue(row, '3 PRINCIPAIS MANOBRAS QUE VOCÊ ACERTA');
    normalized['apelido'] = normalized['apelido'] || getMappedValue(row, 'ESCREVA O NOME E/OU APELIDO COMO VOCÊ QUER SER DIVULGADO NO EVENTO.');
    normalized['Camiseta'] = normalized['Camiseta'] || getMappedValue(row, 'TAMANHO DA CAMISA');

    if (!normalized['Cidade'] || !normalized['UF']) {
        const addressInfo = extractCityAndUF(getMappedValue(row, 'Endereço'));
        normalized['Cidade'] = normalized['Cidade'] || addressInfo.city;
        normalized['UF'] = normalized['UF'] || addressInfo.uf;
    }

    return normalized;
}

function getMappedValue(row, key) {
    if (!key) {
        return '';
    }

    return String(row[key] || '').trim();
}

function getMappedValueIgnoreCase(row, key) {
    const normalizedKey = normalizeHeader(key);
    const matchedKey = Object.keys(row).find(rowKey => normalizeHeader(rowKey) === normalizedKey);

    if (!matchedKey) {
        return '';
    }

    return String(row[matchedKey] || '').trim();
}

function normalizeName(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeModalidade(value) {
    return String(value || '')
        .split('|')[0]
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeInstagram(value) {
    const normalized = String(value || '').trim();
    return normalized.startsWith('@') ? normalized : normalized;
}

function normalizeHeader(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

function extractCityAndUF(address) {
    const parts = String(address || '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);

    if (parts.length < 2) {
        return { city: '', uf: '' };
    }

    const uf = parts[parts.length - 1];
    const city = parts[parts.length - 2];

    return {
        city: uf.length === 2 ? city : '',
        uf: uf.length === 2 ? uf : ''
    };
}

// agrupa um array por uma determinada key
function groupBy(arr, key) {
    return arr.reduce((result, item) => {
        const groupKey = item[key];

        if (!result[groupKey]) {
            result[groupKey] = [];
        }

        result[groupKey].push(item);
        return result;
    }, {});
}

function parseRows(rows) {
    const listaRaw = groupBy(rows, 'Modalidade');
    const ordemCatsInput = document.getElementById('ordemCatsInput').value.split('\n');
    const ordemCats = ordemCatsInput.filter(line => line.trim() !== '');

    let listaNaOrdem = {};

    ordemCats.forEach(key => {
        if (listaRaw[key]) {
            listaNaOrdem[key] = listaRaw[key];
            delete listaRaw[key];
        }
    });

    listaNaOrdem = {
        ...listaNaOrdem,
        ...listaRaw
    };

    Object.values(listaNaOrdem).forEach(element => {
        element.sort((a, b) => {
            const nameA = (a['Nome completo'] || '').toUpperCase();
            const nameB = (b['Nome completo'] || '').toUpperCase();

            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    });

    printData(listaNaOrdem);
    return listaNaOrdem;
}

function printData(sortedData) {
    printListaSimples(sortedData);
    printListaImpressao(sortedData);
}

function printListaSimples(sortedData) {
    let outputHTML = '';

    for (const modalidade in sortedData) {
        outputHTML += `<b><font size="5">${modalidade}</font></b><p><br>`;
        sortedData[modalidade].forEach(function (atleta) {
            outputHTML += `${atleta['Nome completo']}<br>`;
        });
        outputHTML += `<br></p>`;
    }

    document.getElementById('output').innerHTML = outputHTML;
}

function printListaImpressao(sortedData) {
    let outputHTML = '';

    for (const modalidade in sortedData) {
        outputHTML += `<div class='modalidade'>`;
        outputHTML += `
            <div class='row header'>
                <div class='col-4 titulo'>${modalidade}</div>
                <div class='col'>Há quantos anos anda</div>
                <div class='col'>Freqüência que anda</div>
                <div class='col'>Lugar que anda</div>
                <div class='col'>Manobras que acerta</div>
                <div class='col'>Patrô</div>
                <div class='col'>Prancha</div>
                <div class='col'>Curiosidade</div>
                <div class='col'>Contato de emergencia</div>
                <div class='col'>Celular</div>
            </div>
            <div class='separador'></div>
        `;

        sortedData[modalidade].forEach(function (atleta) {
            const camiseta = [atleta['Camiseta do Kit Atleta'], atleta['Camiseta'], atleta['Camiseta Wakeboard'], atleta['Camiseta Wakesurf']]
                .find(value => typeof value === 'string' && value.trim() !== '');

            outputHTML += `<div class='atleta row'>
                <div class='col-4 dados_principais'>
                    <div class='nome'>${atleta['Nome completo'] || ''}</div>
                    <div class='apelido'>${atleta['apelido'] || ''}</div>
                    <div class='idade'>${calculateAge(atleta['Data de nascimento'])}</div>
                    <div class='separador'></div>
                    <div class='stance'><img class='icone' src='img/stance.svg'>${atleta['stance'] || ''}</div>
                    <div class='instagram'><img class='icone' src='img/instagram.svg'>${atleta['Instagram'] || ''}</div>
                    <div class='camiseta'><img class='icone' src='img/camiseta.svg'>${camiseta || ''}</div>
                    <div class='col cidade'><img class='icone' src='img/cidade.svg'>${formatCityUF(atleta['Cidade'], atleta['UF'])}</div>
                </div>

                <div class='col tempo_que_anda'>${atleta['tempo_que_anda'] || ''}</div>
                <div class='col frequencia'>${atleta['frequencia'] || ''}</div>
                <div class='col lugar_que_pratica'>${atleta['lugar_que_pratica'] || ''}</div>
                <div class='col Manobras_que_acerta'>${atleta['Manobras_que_acerta'] || ''}</div>
                <div class='col patrocinadores'>${atleta['patrocinadores'] || ''}</div>
                <div class='col prancha'>${atleta['prancha'] || ''}</div>
                <div class='col curiosidade'>${atleta['curiosidade'] || ''}</div>
                <div class='col contato_de_emergencia'>${atleta['contato_de_emergencia'] || ''}</div>
                <div class='col celular'>${phoneMask(atleta['Celular'])}</div>
            </div>`;
        });

        outputHTML += `</div>`;
    }

    document.getElementById('outputImpressao').innerHTML = outputHTML;
}

function formatCityUF(city, uf) {
    const cityValue = city || '';
    const ufValue = uf || '';

    if (cityValue && ufValue) {
        return `${cityValue} - ${ufValue}`;
    }

    return cityValue || ufValue;
}

// selecionar output
function selectText() {
    const output = document.getElementById('output');
    window.getSelection().selectAllChildren(output);
}

function calculateAge(birthDateString) {
    if (!birthDateString) {
        return '';
    }

    const [day, month, year] = birthDateString.split('/').map(Number);

    if (!day || !month || !year) {
        return '';
    }

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    return `${age} anos`;
}

// formata numero de celular
function phoneMask(value) {
    if (!value) return '';

    value = value.replace(/\D/g, '');

    if (value.startsWith('55')) {
        value = value.replace(/(\d{2})(\d{2})(\d)/, '($2) $3');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    } else {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }

    return value;
}
