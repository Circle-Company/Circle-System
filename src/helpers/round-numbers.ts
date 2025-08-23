export function RoundNumber(number: number, decimal: number) {
    decimal = typeof decimal !== 'undefined' ?  decimal : 2;
    return +(Math.floor(Number(number + ('e+' + decimal))) + ('e-' + decimal));
}