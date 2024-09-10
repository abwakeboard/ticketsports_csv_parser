valorFinal.onkeyup = function(){
    console.log(valorFinal.value);


    // ticketsports fica com 10% do valor
    const valorDescontado = valorFinal.value / 1.1;
    const valorDescontadoFiliados = (valorFinal.value - 100) / 1.1;

    const valorDescontoFiliados = valorFinal.value - valorDescontadoFiliados;

    valorTS.innerHTML = valorDescontado;
    valorFiliadosTS.innerHTML = valorDescontoFiliados;


};