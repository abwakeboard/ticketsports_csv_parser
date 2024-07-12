// lida com usuario arrastando arquivo pra area
function handleDrop(event) {
    event.preventDefault();
    var files = event.dataTransfer.files;
    handleFiles(files);
}

// lida com usuario clicando em vez de arrastando
document.getElementById('drop-area').addEventListener('click', function () {
    document.getElementById('file-input').click();
});
const inputElement = document.getElementById("file-input");
inputElement.addEventListener("change", handleFileInput, false);
function handleFileInput() {
    handleFiles(this.files)
}

// lida com arquivo CSV
function handleFiles(files) {
    var file = files[0];
    if (file.type === 'text/csv') {
        var reader = new FileReader();
        reader.onload = function (event) {
            parseCSV(event.target.result);
            csvToJSON(event.target.result);
        };
        reader.readAsText(file);
    } else {
        alert('Please drop a CSV file.');
    }
}

// converte CSV pra um JSON estruturado com arrays e keys para cada cabeçalho do CSV
function csvToJSON(inputText) {

    // console.log(inputText);

    const lines = inputText.split('\n');
    const result = [];
    const headers = lines[0].split(';').map(header => header.trim());
  
    for (let i = 1; i < lines.length; i++) {
      const obj = {};
      const currentLine = lines[i].split(';').map(value => value.trim());
  
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
      }
  
      result.push(obj);
    }

    return result;
}

// agrupa um array por uma determinada key
function groupBy(arr, key) {
    return arr.reduce((result, item) => {
        // Get the value of the specified key
        const groupKey = item[key];
        
        // If the group does not exist, create it
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        
        // Push the item to the group
        result[groupKey].push(item);
        
        return result;
    }, {});
}

// formata o CSV do ticketsports em um JSON, agrupado por categorias, ja na ordem certa pra criar a lista na UI
function parseCSV(inputText) {

    const listaRaw = groupBy(csvToJSON(inputText), "Modalidade");

    // pega ordem das categorias e gera um array. Esse array vai ser utilizado pra ordenar as categorias na hora de gerar a lista
    const ordemCatsInput = document.getElementById('ordemCatsInput').value.split('\n');
    const ordemCats = ordemCatsInput.filter(line => line.trim() !== '');

    console.log(`listaRaw:`, listaRaw);

    // agora vamos ordenar a lista
    let listaNaOrdem = {};

    ordemCats.forEach(key => {
        if (listaRaw[key]) {
            listaNaOrdem[key] = listaRaw[key];
            // se a gente inseriu uma categoria da listaRaw na lista ordenada, a gente remove ela da lista Raw.
            // Isso é porque depois a gente vai juntar o que sobrar da listaRaw na lista ordenada, pra incluir as categorias
            // que não foram listadas lá no começo, em ordemCats
            delete listaRaw[key];
        }
    });

    // junta a lista ordenada com o que sobrou da lista original
    listaNaOrdem = {
        ...listaNaOrdem,
        ...listaRaw
    }

    // alfabetiza ordem de atletas dentro de cada categoria
    Object.values(listaNaOrdem).forEach(element => {
        console.log(`element: `, element);
        // element.sort();
        element.sort((a, b) => {
            const nameA = a["Nome completo"].toUpperCase(); // Convert to uppercase to ensure case-insensitive comparison
            const nameB = b["Nome completo"].toUpperCase(); // Convert to uppercase to ensure case-insensitive comparison
        
            if (nameA < nameB) {
                return -1; // nameA comes before nameB in alphabetical order
            }
            if (nameA > nameB) {
                return 1; // nameA comes after nameB in alphabetical order
            }
            return 0; // names are equal
        });
    });

    console.log(`Lista na Ordem:`, listaNaOrdem);
    printData(listaNaOrdem);
    return listaNaOrdem;
}

// função pra mostrar a lista pro usuário
function printData(sortedData) {

    printListaSimples(sortedData);
    printListaImpressao(sortedData);

}

function printListaSimples(sortedData) {
    let outputHTML = ``;
    for (const modalidade in sortedData) {
        outputHTML +=
            `<b><font size="5">${modalidade}</font></b><p><br>`;
        sortedData[modalidade].forEach(function (atleta) {
            outputHTML += `${atleta['Nome completo']}<br>`;
        });
        outputHTML += `<br></p>`;
    }

    document.getElementById(`output`).innerHTML = outputHTML;
}

function printListaImpressao(sortedData) {
    let outputHTML = ``;
    for (const modalidade in sortedData) {
        outputHTML += `<div class='modalidade'><h2>${modalidade}</h2>`;



        // Celular
        // Cidade
        // Instagram
        // Manobras_que_acerta
        // Modalidade
        // Nome completo
        // Sexo
        // UF
        // contato_de_emergencia
        // frequencia
        // lugar_que_pratica
        // patrocinadores
        // prancha
        // stance
        // whatsapp
        
        sortedData[modalidade].forEach(function (atleta) {
            outputHTML += `<div class='atleta'>
                                <div class='col nome'>${atleta['Nome completo']}</div>
                                <div class='col sexo'>${atleta['Sexo']}</div>
                                <div class='col idade'>${atleta['Data de nascimento']}</div>
                                <div class='col stance'>${atleta['stance']}</div>
                                <div class='col instagram'>${atleta['Instagram']}</div>
                                <div class='col cidade'>${atleta['Cidade']}</div>
                                <div class='col uf'>${atleta['UF']}</div>
                                <div class='col contato_de_emergencia'>${atleta['contato_de_emergencia']}</div>
                                <div class='col frequencia'>Frequência:<br>${atleta['frequencia']}</div>
                                <div class='col lugar_que_pratica'>Lugar que pratica:<br>${atleta['lugar_que_pratica']}</div>
                                <div class='col patrocinadores'>Patrocinadores:<br>${atleta['patrocinadores']}</div>
                                <div class='col prancha'>Marca da prancha:<br>${atleta['prancha']}</div>
                                <div class='col whatsapp'>${atleta['whatsapp']}</div>
                            </div>`;
        });

        outputHTML += `</div>`;
    }

    document.getElementById(`outputImpressao`).innerHTML = outputHTML;
}

// selecionar output
function selectText() {
    let output = document.getElementById(`output`);
    window.getSelection().selectAllChildren(output);
}