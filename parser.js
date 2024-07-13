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
        outputHTML += `<div class='modalidade'>`;

        outputHTML += `
                                <div class='row header'>
                                    <div class='col-4 titulo'>${modalidade}</div>
                                    <div class='col'>Freqência que anda</div>
                                    <div class='col'>Lugar que anda</div>
                                    <div class='col'>Manobras que acerta</div>
                                    <div class='col'>Patrô</div>
                                    <div class='col'>Prancha</div>
                                    <div class='col'>Contato de emergencia</div>
                                    <div class='col'>Whatsapp</div>

                                </div>
                                <div class='separador'></div>
`;

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
            console.log(`atleta`, atleta);
            outputHTML += `<div class='atleta row'>

                                <div class='col-4 dados_principais'>
                                    <div class='nome'>${atleta['Nome completo']}</div>
                                    <div class='idade'>${calculateAge(atleta['Data de nascimento'])} anos</div>
                                    <div class='separador'></div>
                                    <div class='stance'><img class='icone' src='img/stance.svg'>${atleta['stance']}</div>
                                    <div class='instagram'><img class='icone' src='img/instagram.svg'>${atleta['Instagram']}</div>
                                    <div class='camiseta'><img class='icone' src='img/camiseta.svg'>${atleta['Camiseta do Kit Atleta']}</div>
                                    <div class='col cidade'><img class='icone' src='img/cidade.svg'>${atleta['Cidade']} - ${atleta['UF']}</div>
                                </div>

                                <div class='col frequencia'>${atleta['frequencia']}</div>
                                <div class='col lugar_que_pratica'>${atleta['lugar_que_pratica']}</div>
                                <div class='col Manobras_que_acerta'>${atleta['Manobras_que_acerta']}</div>
                                <div class='col patrocinadores'>${atleta['patrocinadores']}</div>
                                <div class='col prancha'>${atleta['prancha']}</div>
                                <div class='col contato_de_emergencia'>${atleta['contato_de_emergencia']}</div>
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

function calculateAge(birthDateString) {
    // Split the input string into day, month, and year
    const [day, month, year] = birthDateString.split('/').map(Number);

    // Create a Date object from the birth date
    const birthDate = new Date(year, month - 1, day);

    // Get the current date
    const today = new Date();

    // Calculate the age
    let age = today.getFullYear() - birthDate.getFullYear();

    // Adjust the age if the current date is before the birth date in the current year
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    return age;
}