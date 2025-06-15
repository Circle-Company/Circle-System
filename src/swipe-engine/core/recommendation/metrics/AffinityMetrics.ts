/**
 * AffinityMetrics
 * 
 * Módulo responsável por calcular métricas de afinidade entre um usuário e um cluster.
 * Mede o alinhamento semântico entre os interesses do usuário e o conteúdo do cluster.
 */

import { ClusterInfo, UserEmbedding } from "../../types"

import { cosineSimilarity } from "../../utils/vector-operations"
import { getLogger } from "../../utils/logger"

const logger = getLogger("AffinityMetrics")

export interface AffinityFactors {
    /**
     * Peso para similaridade vetorial direta entre embeddings
     */
    embeddingSimilarityWeight: number
    
    /**
     * Peso para interesses explícitos compartilhados
     */
    sharedInterestsWeight: number
    
    /**
     * Peso para proximidade na rede de interesses
     */
    networkProximityWeight: number
    
    /**
     * Peso para centralidade do cluster
     */
    clusterCentralityWeight?: number
    
    /**
     * Limiar mínimo de similaridade
     */
    minSimilarityThreshold?: number
}

/**
 * Calcula um score de afinidade entre um usuário e um cluster
 * com base em similaridade semântica e alinhamento de interesses.
 * 
 * @param userEmbedding Embedding do usuário
 * @param cluster Informações do cluster
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de afinidade (0-1)
 */
export function calculateAffinityScore(
    userEmbedding: UserEmbedding,
    cluster: ClusterInfo,
    factors: AffinityFactors
): number {
    try {
        // 1. Calcular similaridade de cosseno entre embeddings
        const embeddingSimilarity = calculateEmbeddingSimilarity(userEmbedding, cluster)
        
        // 2. Aplicar fatores de ajuste
        let affinityScore = embeddingSimilarity * factors.embeddingSimilarityWeight
        
        // 3. Aplicar limiar mínimo de similaridade
        if (factors.minSimilarityThreshold !== undefined && 
            embeddingSimilarity < factors.minSimilarityThreshold) {
            affinityScore *= 0.5 // Penalizar clusters com baixa similaridade
        }
        
        // 4. Normalizar para 0-1
        return Math.max(0, Math.min(1, affinityScore))
    } catch (error) {
        logger.error(`Erro ao calcular score de afinidade: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula a similaridade de cosseno entre o embedding do usuário e o centroide do cluster
 */
function calculateEmbeddingSimilarity(
    userEmbedding: UserEmbedding,
    cluster: ClusterInfo
): number {
    try {
        // Extrair vetores de embedding
        // Tratar como arrays de números diretamente
        const userVector = userEmbedding.vector
        const clusterVector = cluster.centroid
        
        // Verificar se os vetores são arrays válidos
        if (!Array.isArray(userVector) || !Array.isArray(clusterVector)) {
            return 0.5 // Valor neutro se os vetores não forem arrays
        }
        
        // Verificar dimensionalidade
        if (userVector.length !== clusterVector.length) {
            logger.warn(
                `Dimensões incompatíveis: usuário (${userVector.length}) vs. cluster (${clusterVector.length})`
            )
            return 0.5 // Valor neutro para dimensões incompatíveis
        }
        
        // Calcular similaridade de cosseno
        return cosineSimilarity(userVector, clusterVector)
    } catch (error) {
        logger.error(`Erro ao calcular similaridade de embeddings: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula a similaridade de tópicos entre os interesses do usuário e os tópicos do cluster
 */
export function calculateTopicSimilarity(
    userInterests: string[],
    clusterTopics: string[]
): number {
    try {
        if (!userInterests.length || !clusterTopics.length) {
            return 0.5 // Valor neutro quando não há dados suficientes
        }
        
        // Converter para sets para operações eficientes
        const userInterestsSet = new Set(userInterests.map(s => s.toLowerCase()))
        const clusterTopicsSet = new Set(clusterTopics.map(s => s.toLowerCase()))
        
        // Calcular interseção
        let intersection = 0
        for (const topic of clusterTopicsSet) {
            if (userInterestsSet.has(topic)) {
                intersection++
            }
        }
        
        // Calcular similaridade de Jaccard
        const union = userInterestsSet.size + clusterTopicsSet.size - intersection
        
        return union > 0 ? intersection / union : 0
    } catch (error) {
        logger.error(`Erro ao calcular similaridade de tópicos: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

function calculateVectorSimilarity(userEmbedding: UserEmbedding, cluster: ClusterInfo): number {
    try {
        // Converter para arrays numéricos se necessário
        const userVector = Array.isArray(userEmbedding.vector) ? 
            userEmbedding.vector : 
            [0, 0] // Vector padrão como fallback
        
        const clusterVector = Array.isArray(cluster.centroid) ?
            cluster.centroid :
            [0, 0] // Vector padrão como fallback
        
        // Calcular similaridade de cosseno entre os vetores
        const similarity = cosineSimilarity(userVector, clusterVector)
        
        return similarity
    } catch (error) {
        logger.error(`Erro ao calcular similaridade vetorial: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
} 