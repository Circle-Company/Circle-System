type NormalizeProps = {
    value: number,
    min?: number,
    max?: number
}

export default function normalize({
    value,
    min = 0,
    max = 1
}: NormalizeProps): number {
    // Garante que o valor esteja dentro do intervalo [min, max]
    const clampedValue = Math.max(min, Math.min(value, max));
  
    // Normaliza o valor para o intervalo [0, 1]
    return (clampedValue - min) / (max - min);
}