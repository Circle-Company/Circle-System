/**
 * Funções de normalização para vetores de embeddings
 */

/**
 * Utilitários para normalização de vetores e dados
 */

import { EmbeddingVector } from "../types"
import { extractVectorValues } from "./vectorUtils"

/**
 * Utilitários para normalização de vetores de embedding
 */

/**
 * Normaliza um vetor usando a norma L2 (normalização euclidiana)
 * @param vector Vetor a ser normalizado
 * @returns Vetor normalizado
 */
export function normalizeL2(vector: number[]): number[] {
    // Calcular a magnitude (norma L2)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

    // Evitar divisão por zero
    if (magnitude === 0) {
        return new Array(vector.length).fill(0)
    }

    // Normalizar cada componente
    return vector.map((val) => val / magnitude)
}

/**
 * Normaliza um vetor para ter valores entre 0 e 1
 * @param vector Vetor a ser normalizado
 * @returns Vetor normalizado no intervalo [0,1]
 */
export function normalizeMinMax(vector: number[]): number[] {
    if (vector.length === 0) {
        return []
    }

    // Encontrar mínimo e máximo
    let min = vector[0]
    let max = vector[0]

    for (let i = 1; i < vector.length; i++) {
        if (vector[i] < min) min = vector[i]
        if (vector[i] > max) max = vector[i]
    }

    // Se mínimo e máximo são iguais, retornar vetor de valores médios
    if (min === max) {
        return new Array(vector.length).fill(0.5)
    }

    // Normalizar para [0,1]
    return vector.map((val) => (val - min) / (max - min))
}

/**
 * Normaliza um vetor usando Z-score (média 0, desvio padrão 1)
 * @param vector Vetor a ser normalizado
 * @returns Vetor normalizado com Z-score
 */
export function normalizeZScore(vector: number[]): number[] {
    if (vector.length === 0) {
        return []
    }

    // Calcular média
    const sum = vector.reduce((acc, val) => acc + val, 0)
    const mean = sum / vector.length

    // Calcular desvio padrão
    const squaredDiffs = vector.map((val) => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / vector.length
    const stdDev = Math.sqrt(variance)

    // Evitar divisão por zero
    if (stdDev === 0) {
        return new Array(vector.length).fill(0)
    }

    // Normalizar usando Z-score
    return vector.map((val) => (val - mean) / stdDev)
}

/**
 * Normaliza um vetor para ter soma 1 (normalização por soma)
 * @param vector Vetor a ser normalizado
 * @returns Vetor normalizado com soma 1
 */
export function normalizeSumToOne(vector: number[]): number[] {
    if (vector.length === 0) {
        return []
    }

    // Calcular soma total
    const sum = vector.reduce((acc, val) => acc + Math.abs(val), 0)

    // Evitar divisão por zero
    if (sum === 0) {
        return new Array(vector.length).fill(1 / vector.length)
    }

    // Normalizar para soma 1
    return vector.map((val) => val / sum)
}

/**
 * Normaliza vetores em lote usando L2
 * @param vectors Array de vetores a serem normalizados
 * @returns Array de vetores normalizados
 */
export function batchNormalizeL2(vectors: number[][]): number[][] {
    return vectors.map(normalizeL2)
}

/**
 * Normaliza a magnitude de um vetor para um valor específico
 * @param vector Vetor de entrada para normalizar
 * @param targetMagnitude Magnitude desejada (padrão: 1.0)
 * @returns Vetor normalizado
 */
export function normalizeToMagnitude(
    vector: number[] | EmbeddingVector,
    targetMagnitude: number = 1.0
): number[] {
    const values = extractVectorValues(vector)

    if (values.length === 0) {
        return []
    }

    // Calcular magnitude atual
    let sumSquared = 0
    for (const value of values) {
        sumSquared += value * value
    }
    const currentMagnitude = Math.sqrt(sumSquared)

    // Se magnitude atual é zero, não podemos normalizar
    if (currentMagnitude === 0) {
        return new Array(values.length).fill(0)
    }

    // Aplicar escala para atingir a magnitude desejada
    const scale = targetMagnitude / currentMagnitude
    return values.map((value) => value * scale)
}

/**
 * Normaliza valores de engagement metrics para um range específico
 *
 * @param metrics Objeto com métricas de engajamento
 * @param minOutput Valor mínimo de saída (padrão: 0)
 * @param maxOutput Valor máximo de saída (padrão: 1)
 * @returns Objeto com métricas normalizadas
 */
export function normalizeEngagementMetrics<T extends Record<string, number>>(
    metrics: T,
    minOutput: number = 0,
    maxOutput: number = 1
): T {
    // Encontrar valores min e max nas métricas
    const values = Object.values(metrics)

    if (values.length === 0) {
        return { ...metrics }
    }

    let minVal = values[0]
    let maxVal = values[0]

    for (let i = 1; i < values.length; i++) {
        if (values[i] < minVal) minVal = values[i]
        if (values[i] > maxVal) maxVal = values[i]
    }

    // Se min e max são iguais, retornar valores médios
    if (minVal === maxVal) {
        const normalizedMetrics: Record<string, number> = {}
        const medianValue = (minOutput + maxOutput) / 2

        for (const key in metrics) {
            normalizedMetrics[key] = medianValue
        }

        return normalizedMetrics as T
    }

    // Aplicar normalização min-max
    const range = maxVal - minVal
    const scale = (maxOutput - minOutput) / range

    const normalizedMetrics: Record<string, number> = {}

    for (const key in metrics) {
        normalizedMetrics[key] = minOutput + (metrics[key] - minVal) * scale
    }

    return normalizedMetrics as T
}

/**
 * Normaliza pesos para que somem 1
 *
 * @param weights Objeto com pesos
 * @returns Objeto com pesos normalizados
 */
export function normalizeWeights<T extends Record<string, number>>(weights: T): T {
    const values = Object.values(weights)
    const sum = values.reduce((acc, val) => acc + val, 0)

    if (sum === 0) {
        // Se soma é zero, distribuir uniformemente
        const uniformWeight = 1 / values.length
        const normalizedWeights: Record<string, number> = {}

        for (const key in weights) {
            normalizedWeights[key] = uniformWeight
        }

        return normalizedWeights as T
    }

    // Normalizar para soma 1
    const normalizedWeights: Record<string, number> = {}

    for (const key in weights) {
        normalizedWeights[key] = weights[key] / sum
    }

    return normalizedWeights as T
}

/**
 * Converte um EmbeddingVector para um array numérico
 *
 * @param vector Vetor de embedding
 * @returns Array numérico
 */
export function embeddingVectorToArray(vector: EmbeddingVector): number[] {
    return [...vector.values]
}

/**
 * Cria um EmbeddingVector a partir de um array numérico
 *
 * @param array Array numérico
 * @returns Objeto EmbeddingVector
 */
export function arrayToEmbeddingVector(array: number[]): EmbeddingVector {
    return {
        dimension: array.length,
        values: [...array],
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}
