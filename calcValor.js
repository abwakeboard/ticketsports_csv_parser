valorFinal.onkeyup = function(){
    calcValores();
};

valorFiliadosFinal.onkeyup = function(){
    calcValores();
};

function arredondar(value) {
    return Math.round(value * 100)/100;
}

function calcValores() {
    console.log(valorFinal.value);

    // ticketsports fica com 10% do valor
    // vamos supor:
    const valorDescontado = valorFinal.value / 1.1;
    const valorDescontadoFiliados = valorFiliadosFinal.value / 1.1;

    const valorDescontoFiliados = valorDescontado - valorDescontadoFiliados;

    valorTS.innerHTML = arredondar(valorDescontado);
    valorFiliadosTS.innerHTML = arredondar(valorDescontoFiliados);


}