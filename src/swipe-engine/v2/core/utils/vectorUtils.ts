/**
 * Utilidades para operações com vetores de embeddings
 */

import { EmbeddingVector } from "../types"

/**
 * Extrai o array numérico de um EmbeddingVector ou retorna o próprio array se já for um
 * @param vec Vetor de embedding ou array numérico
 * @returns Array numérico do vetor
 */
export function extractVectorValues(vec: number[] | EmbeddingVector): number[] {
    if (Array.isArray(vec)) {
        return vec
    }
    return vec.values
}

/**
 * Calcula a similaridade de cosseno entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Valor de similaridade entre 0 e 1
 */
export function cosineSimilarity(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector
): number {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < valuesA.length; i++) {
        dotProduct += valuesA[i] * valuesB[i]
        normA += valuesA[i] * valuesA[i]
        normB += valuesB[i] * valuesB[i]
    }

    if (normA === 0 || normB === 0) {
        return 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Calcula a distância euclidiana entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Valor da distância euclidiana
 */
export function euclideanDistance(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector
): number {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    let sum = 0
    for (let i = 0; i < valuesA.length; i++) {
        const diff = valuesA[i] - valuesB[i]
        sum += diff * diff
    }

    return Math.sqrt(sum)
}

/**
 * Normaliza um vetor (escala para norma unitária)
 * @param vec Vetor a ser normalizado
 * @returns Vetor normalizado com a mesma direção mas magnitude 1
 */
export function normalizeVector(vec: number[] | EmbeddingVector): number[] {
    const values = extractVectorValues(vec)
    const norm = euclideanNorm(values)

    if (norm === 0) {
        return Array(values.length).fill(0)
    }

    return values.map((val) => val / norm)
}

/**
 * Calcula a norma euclidiana (magnitude) de um vetor
 * @param vec Vetor para calcular a norma
 * @returns Valor da norma
 */
export function euclideanNorm(vec: number[] | EmbeddingVector): number {
    const values = extractVectorValues(vec)

    let sumSquared = 0
    for (let i = 0; i < values.length; i++) {
        sumSquared += values[i] * values[i]
    }

    return Math.sqrt(sumSquared)
}

/**
 * Combina dois vetores com pesos específicos
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @param weightA Peso do primeiro vetor (padrão: 0.5)
 * @param weightB Peso do segundo vetor (padrão: 0.5)
 * @returns Vetor combinado
 */
export function weightedVectorCombination(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector,
    weightA: number = 0.5,
    weightB: number = 0.5
): number[] {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    const result = new Array(valuesA.length)
    for (let i = 0; i < valuesA.length; i++) {
        result[i] = valuesA[i] * weightA + valuesB[i] * weightB
    }

    return result
}

/**
 * Calcula a média de um conjunto de vetores
 * @param vectors Lista de vetores
 * @returns Vetor médio
 */
export function averageVectors(vectors: (number[] | EmbeddingVector)[]): number[] {
    if (vectors.length === 0) {
        return []
    }

    const extractedVectors = vectors.map((vec) => extractVectorValues(vec))
    const dimension = extractedVectors[0].length

    // Verificar se todos os vetores têm a mesma dimensão
    for (let i = 1; i < extractedVectors.length; i++) {
        if (extractedVectors[i].length !== dimension) {
            throw new Error(
                `Todos os vetores devem ter a mesma dimensão. Encontrado: ${extractedVectors[i].length} vs ${dimension}`
            )
        }
    }

    // Inicializar o vetor de resultado com zeros
    const result = new Array(dimension).fill(0)

    // Somar todos os vetores
    for (const vec of extractedVectors) {
        for (let i = 0; i < dimension; i++) {
            result[i] += vec[i]
        }
    }

    // Dividir pela quantidade para obter a média
    for (let i = 0; i < dimension; i++) {
        result[i] /= extractedVectors.length
    }

    return result
}

/**
 * Calcula a similaridade de Jaccard entre dois conjuntos
 * @param setA Primeiro conjunto
 * @param setB Segundo conjunto
 * @returns Valor de similaridade entre 0 e 1
 */
export function jaccardSimilarity(setA: string[], setB: string[]): number {
    if (setA.length === 0 && setB.length === 0) {
        return 1 // Dois conjuntos vazios são considerados idênticos
    }

    const unionSet = new Set([...setA, ...setB])
    const intersectionSize = setA.filter((item) => setB.includes(item)).length
    const unionSize = unionSet.size

    return intersectionSize / unionSize
}

/**
 * Valida se todos os vetores têm a mesma dimensão
 * @param vectors Lista de vetores para validar
 * @returns true se todos os vetores têm a mesma dimensão
 */
export function validateVectorDimensions(vectors: (number[] | EmbeddingVector)[]): boolean {
    if (vectors.length <= 1) {
        return true
    }

    const extractedVectors = vectors.map((vec) => extractVectorValues(vec))
    const dimension = extractedVectors[0].length

    return extractedVectors.every((vec) => vec.length === dimension)
}

/**
 * Subtrai o segundo vetor do primeiro (vecA - vecB)
 * @param vecA Primeiro vetor (minuendo)
 * @param vecB Segundo vetor (subtraendo)
 * @returns Vetor resultante da subtração
 */
export function subtractVectors(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector
): number[] {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    return valuesA.map((val, i) => val - valuesB[i])
}

/**
 * Soma dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Vetor resultante da soma
 */
export function addVectors(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector
): number[] {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    return valuesA.map((val, i) => val + valuesB[i])
}

/**
 * Multiplica um vetor por um escalar
 * @param vec Vetor a ser escalado
 * @param scalar Valor escalar
 * @returns Vetor escalado
 */
export function scaleVector(vec: number[] | EmbeddingVector, scalar: number): number[] {
    const values = extractVectorValues(vec)
    return values.map((val) => val * scalar)
}

/**
 * Calcula a distância entre dois vetores com base na função de distância especificada
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @param distanceFunction Nome da função de distância a ser usada
 * @returns Valor da distância
 */
export function calculateDistance(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector,
    distanceFunction: string = "euclidean"
): number {
    switch (distanceFunction.toLowerCase()) {
        case "euclidean":
            return euclideanDistance(vecA, vecB)
        case "cosine":
            return 1 - cosineSimilarity(vecA, vecB)
        case "manhattan":
            return manhattanDistance(vecA, vecB)
        default:
            throw new Error(`Função de distância desconhecida: ${distanceFunction}`)
    }
}

/**
 * Calcula a distância de Manhattan entre dois vetores
 * @param vecA Primeiro vetor
 * @param vecB Segundo vetor
 * @returns Valor da distância de Manhattan
 */
export function manhattanDistance(
    vecA: number[] | EmbeddingVector,
    vecB: number[] | EmbeddingVector
): number {
    const valuesA = extractVectorValues(vecA)
    const valuesB = extractVectorValues(vecB)

    if (valuesA.length !== valuesB.length) {
        throw new Error(
            `Dimensões dos vetores incompatíveis: ${valuesA.length} vs ${valuesB.length}`
        )
    }

    let sum = 0
    for (let i = 0; i < valuesA.length; i++) {
        sum += Math.abs(valuesA[i] - valuesB[i])
    }

    return sum
}

/**
 * Cria um EmbeddingVector a partir de um array numérico
 * @param values Valores do vetor
 * @returns Objeto EmbeddingVector
 */
export function createEmbeddingVector(values: number[]): EmbeddingVector {
    return {
        dimension: values.length,
        values: [...values],
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}
