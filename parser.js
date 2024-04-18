// lida com usuario arrastando arquivo pra area
function handleDrop(event) {
    event.preventDefault();
    var files = event.dataTransfer.files;
    handleFiles(files);
}

// lida com usuario clicando em vez de arrastando
document.getElementById('drop-area').addEventListener('click', function() {
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
        reader.onload = function(event) {
            parseCSV(event.target.result);
        };
        reader.readAsText(file);
    } else {
        alert('Please drop a CSV file.');
    }
}

// formata o CSV do ticketsports em um JSON, agrupado por categorias, ja na ordem certa pra criar a lista na UI
function parseCSV(inputText) {

    const lines = inputText.trim().split('\n');
    const listaRaw = {};

    // a partir da primeira linha, vamos pegar os índices dos campos "Nome completo" e "Modalidade".
    // Isso porque o CSV exportado do TicketSports pode ter mais campos, ou mudar a ordem dos campos.
    const header = lines[0].split(`;`);
    const iNome = header.indexOf(`Nome completo`);
    const iMod = header.indexOf(`Modalidade`);
    lines.shift(); // remove cabeçalho do CSV

    // pega ordem das categorias e gera um array. Esse array vai ser utilizado pra ordenar as categorias na hora de gerar a lista
    const ordemCatsInput = document.getElementById('ordemCatsInput').value.split('\n');
    const ordemCats = ordemCatsInput.filter(line => line.trim() !== '');

    // cria um JSON na mesma ordem do CSV, agrupado por modalidade
    lines.forEach(function (line) {
        const fields = line.split(`;`);
        const modalidade = fields[iMod].trim();
        const nome = fields[iNome].trim();

        if (listaRaw[modalidade] === undefined) {
            listaRaw[modalidade] = [];
        }
        listaRaw[modalidade].push(nome);
    });

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
        element.sort();
    });

    // return listaNaOrdem;
    printData(listaNaOrdem);

}

// função pra mostrar a lista pro usuário
function printData(sortedData) {

    let outputHTML = ``;
    for (const modalidade in sortedData) {
        outputHTML +=
            `<b><font size="5">${modalidade}</font></b><p><br>`;
        sortedData[modalidade].forEach(function (nome) {
            outputHTML += `${nome}<br>`;
        });
        outputHTML += `<br></p>`;
    }

    document.getElementById(`output`).innerHTML = outputHTML;
}