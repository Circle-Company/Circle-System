/**
 * Utilitários para operações com vetores de embedding
 */

import { EmbeddingVector } from "../types"

/**
 * Calcula a similaridade de cosseno entre dois vetores
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Similaridade de cosseno (entre -1 e 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Dimensões incompatíveis: ${a.length} e ${b.length}`)
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) {
        return 0 // Evitar divisão por zero
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Calcula a distância euclidiana entre dois vetores
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Distância euclidiana
 */
export function euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Dimensões incompatíveis: ${a.length} e ${b.length}`)
    }

    let sumSquaredDiff = 0
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i]
        sumSquaredDiff += diff * diff
    }

    return Math.sqrt(sumSquaredDiff)
}

/**
 * Calcula a distância de Manhattan entre dois vetores
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Distância de Manhattan
 */
export function manhattanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Dimensões incompatíveis: ${a.length} e ${b.length}`)
    }

    let sum = 0
    for (let i = 0; i < a.length; i++) {
        sum += Math.abs(a[i] - b[i])
    }

    return sum
}

/**
 * Calcula a distância entre dois vetores usando a função especificada
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @param distanceFunction Nome da função de distância
 * @returns Valor da distância calculada
 */
export function calculateDistance(
    a: number[],
    b: number[],
    distanceFunction: string = "euclidean"
): number {
    switch (distanceFunction) {
        case "cosine":
            // Convertemos similaridade para distância: d = 1 - s
            return 1 - cosineSimilarity(a, b)
        case "manhattan":
            return manhattanDistance(a, b)
        case "euclidean":
        default:
            return euclideanDistance(a, b)
    }
}

/**
 * Combina vários vetores usando pesos
 * @param vectors Lista de vetores a combinar
 * @param weights Pesos para cada vetor (opcional)
 * @returns Vetor combinado
 */
export function combineVectors(vectors: number[][], weights?: number[]): number[] {
    if (vectors.length === 0) {
        return []
    }

    // Verificar se todos os vetores têm a mesma dimensão
    const dimension = vectors[0].length
    vectors.forEach((vec, i) => {
        if (vec.length !== dimension) {
            throw new Error(`O vetor ${i} tem dimensão incompatível: ${vec.length} != ${dimension}`)
        }
    })

    // Se não fornecidos, usar pesos iguais
    const finalWeights = weights || vectors.map(() => 1 / vectors.length)

    // Verificar se temos o número correto de pesos
    if (finalWeights.length !== vectors.length) {
        throw new Error(
            `Número de pesos (${finalWeights.length}) não corresponde ao número de vetores (${vectors.length})`
        )
    }

    // Normalizar pesos para somar 1
    const weightSum = finalWeights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights =
        weightSum === 0
            ? finalWeights.map(() => 1 / vectors.length)
            : finalWeights.map((w) => w / weightSum)

    // Combinar vetores
    const result = new Array(dimension).fill(0)
    for (let i = 0; i < vectors.length; i++) {
        for (let j = 0; j < dimension; j++) {
            result[j] += vectors[i][j] * normalizedWeights[i]
        }
    }

    return result
}

/**
 * Redimensiona um vetor para uma nova dimensão
 * @param vector Vetor de entrada
 * @param newDimension Nova dimensão desejada
 * @returns Vetor redimensionado
 */
export function resizeVector(vector: number[], newDimension: number): number[] {
    if (vector.length === newDimension) {
        return [...vector] // Cópia para evitar alterações no original
    }

    if (vector.length === 0) {
        return new Array(newDimension).fill(0)
    }

    if (newDimension < vector.length) {
        // Caso 1: Reduzir dimensão (truncar)
        return vector.slice(0, newDimension)
    } else {
        // Caso 2: Aumentar dimensão (preencher com zeros ou repetir)
        const result = new Array(newDimension).fill(0)

        // Copiar valores existentes
        for (let i = 0; i < vector.length; i++) {
            result[i] = vector[i]
        }

        return result
    }
}

/**
 * Cria um objeto EmbeddingVector a partir de um array de números
 * @param values Array de valores numéricos
 * @returns Objeto EmbeddingVector formatado
 */
export function createEmbeddingVector(values: number[]): EmbeddingVector {
    return {
        dimension: values.length,
        values: [...values], // Cópia para evitar referências compartilhadas
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}

/**
 * Normaliza um vetor para ter norma unitária
 * @param vector Vetor a ser normalizado
 * @returns Vetor normalizado
 */
export function normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

    if (norm === 0) {
        return [...vector] // Se norma é zero, retornar cópia do vetor
    }

    return vector.map((val) => val / norm)
}
