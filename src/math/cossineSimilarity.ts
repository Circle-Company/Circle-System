export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    // Verificar se os vetores têm o mesmo comprimento
    if (vectorA.length !== vectorB.length || vectorA.length === 0) {
        throw new Error('Os vetores devem ter o mesmo comprimento e não podem ser vazios');
    }

    const dotProduct = vectorA.reduce((acc, value, index) => acc + value * vectorB[index], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((acc, value) => acc + value ** 2, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((acc, value) => acc + value ** 2, 0));

    // Verificar se a magnitude de algum vetor é zero para evitar divisão por zero
    if (magnitudeA === 0 || magnitudeB === 0) {
        throw new Error('A magnitude de um dos vetores é zero');
    }

    return dotProduct / (magnitudeA * magnitudeB);
}
