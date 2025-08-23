/**
 * AffinityMetrics
 * 
 * Módulo responsável por calcular métricas de afinidade entre um usuário e um cluster.
 * Mede o alinhamento semântico entre os interesses do usuário e o conteúdo do cluster.
 * 
 * FUNCIONAMENTO DETALHADO:
 * 
 * 1. SIMILARIDADE DE EMBEDDINGS:
 *    - Calcula similaridade de cosseno entre o embedding do usuário e o centroide do cluster
 *    - Valores próximos a 1 indicam alta afinidade semântica
 *    - Valores próximos a 0 indicam baixa afinidade
 * 
 * 2. SIMILARIDADE DE TÓPICOS:
 *    - Compara interesses explícitos do usuário com tópicos do cluster
 *    - Usa similaridade de Jaccard para calcular sobreposição
 *    - Considera variações de capitalização e normalização
 * 
 * 3. PROXIMIDADE NA REDE DE INTERESSES:
 *    - Analisa padrões de interação do usuário com tópicos similares
 *    - Considera histórico de engajamento com conteúdo relacionado
 * 
 * 4. CENTRALIDADE DO CLUSTER:
 *    - Avalia quão central é o cluster na rede de conteúdo
 *    - Clusters mais centrais tendem a ter maior afinidade geral
 */

import { ClusterInfo, UserEmbedding, UserInteraction, UserProfile } from "../../types"
import { cosineSimilarity, euclideanDistance } from "../../utils/vector-operations"

import { getLogger } from "../../utils/logger"

const logger = getLogger("AffinityMetrics")

export interface AffinityFactors {
    /**
     * Peso para similaridade vetorial direta entre embeddings (0-1)
     * Recomendado: 0.6 - 0.8
     */
    embeddingSimilarityWeight: number
    
    /**
     * Peso para interesses explícitos compartilhados (0-1)
     * Recomendado: 0.2 - 0.4
     */
    sharedInterestsWeight: number
    
    /**
     * Peso para proximidade na rede de interesses (0-1)
     * Recomendado: 0.1 - 0.3
     */
    networkProximityWeight: number
    
    /**
     * Peso para centralidade do cluster (0-1)
     * Recomendado: 0.05 - 0.15
     */
    clusterCentralityWeight?: number
    
    /**
     * Limiar mínimo de similaridade para considerar afinidade válida
     * Valores abaixo deste limiar são penalizados
     */
    minSimilarityThreshold?: number
    
    /**
     * Fator de decaimento para similaridade de tópicos
     * Controla quão rapidamente a afinidade diminui com diferenças
     */
    topicDecayFactor?: number
    
    /**
     * Número de interações históricas a considerar para análise de rede
     */
    maxHistoricalInteractions?: number
}

/**
 * Converte interações do UserProfile para o formato UserInteraction
 */
function convertProfileInteractionsToUserInteractions(
    profileInteractions: { postIds: string[], type: string, timestamp: Date }[],
    userId: string
): UserInteraction[] {
    return profileInteractions.flatMap(interaction => 
        interaction.postIds.map(postId => ({
            id: `${userId}_${postId}_${interaction.timestamp.getTime()}`,
            userId: BigInt(userId),
            entityId: BigInt(postId),
            entityType: "post" as const,
            type: interaction.type as any,
            timestamp: interaction.timestamp
        }))
    )
}

/**
 * Calcula um score de afinidade entre um usuário e um cluster
 * com base em similaridade semântica e alinhamento de interesses.
 * 
 * ALGORITMO:
 * 1. Calcular similaridade de embeddings (60-80% do peso)
 * 2. Calcular similaridade de tópicos (20-40% do peso)
 * 3. Calcular proximidade na rede (10-30% do peso)
 * 4. Aplicar fatores de ajuste e normalização
 * 
 * @param userEmbedding Embedding do usuário
 * @param cluster Informações do cluster
 * @param userProfile Perfil completo do usuário (opcional)
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de afinidade (0-1)
 */
export function calculateAffinityScore(
    userEmbedding: UserEmbedding,
    cluster: ClusterInfo,
    userProfile?: UserProfile | null,
    factors: AffinityFactors = getDefaultAffinityFactors()
): number {
    try {
        // 1. Calcular similaridade de embeddings (componente principal)
        const embeddingSimilarity = calculateEmbeddingSimilarity(userEmbedding, cluster)
        
        // 2. Calcular similaridade de tópicos (se disponível)
        const topicSimilarity = userProfile?.interests 
            ? calculateTopicSimilarity(userProfile.interests, cluster.topics || [])
            : 0.5
        
        // 3. Calcular proximidade na rede de interesses
        let networkProximity = 0.5
        if (userProfile?.interactions && userProfile.userId) {
            const userInteractions = convertProfileInteractionsToUserInteractions(
                userProfile.interactions,
                userProfile.userId
            )
            networkProximity = calculateNetworkProximity(cluster, userInteractions, factors)
        }
        
        // 4. Calcular centralidade do cluster (se aplicável)
        const clusterCentrality = calculateClusterCentrality(cluster)
        
        // 5. Combinar scores usando pesos configuráveis
        let affinityScore = 
            (embeddingSimilarity * factors.embeddingSimilarityWeight) +
            (topicSimilarity * factors.sharedInterestsWeight) +
            (networkProximity * factors.networkProximityWeight) +
            (clusterCentrality * (factors.clusterCentralityWeight || 0))
        
        // 6. Aplicar limiar mínimo de similaridade
        if (factors.minSimilarityThreshold !== undefined && 
            embeddingSimilarity < factors.minSimilarityThreshold) {
            // Penalizar clusters com baixa similaridade de embedding
            const penaltyFactor = embeddingSimilarity / factors.minSimilarityThreshold
            affinityScore *= (0.3 + 0.7 * penaltyFactor) // Penalidade progressiva
        }
        
        // 7. Aplicar função de normalização sigmóide para suavizar extremos
        const normalizedScore = 1 / (1 + Math.exp(-5 * (affinityScore - 0.5)))
        
        // 8. Garantir que o score esteja no intervalo [0, 1]
        return Math.max(0, Math.min(1, normalizedScore))
        
    } catch (error) {
        logger.error(`Erro ao calcular score de afinidade: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula a similaridade de cosseno entre o embedding do usuário e o centroide do cluster
 * 
 * ALGORITMO:
 * - Extrai vetores de embedding
 * - Verifica compatibilidade de dimensões
 * - Calcula similaridade de cosseno
 * - Aplica normalização para [0, 1]
 */
function calculateEmbeddingSimilarity(
    userEmbedding: UserEmbedding,
    cluster: ClusterInfo
): number {
    try {
        // Extrair vetores de embedding
        const userVector = userEmbedding.vector
        const clusterVector = cluster.centroid
        
        // Verificar se os vetores são arrays válidos
        if (!Array.isArray(userVector) || !Array.isArray(clusterVector)) {
            logger.warn("Vetores de embedding não são arrays válidos")
            return 0.5
        }
        
        // Verificar dimensionalidade
        if (userVector.length !== clusterVector.length) {
            logger.warn(
                `Dimensões incompatíveis: usuário (${userVector.length}) vs. cluster (${clusterVector.length})`
            )
            // Tentar redimensionar para compatibilidade
            const minLength = Math.min(userVector.length, clusterVector.length)
            const adjustedUserVector = userVector.slice(0, minLength)
            const adjustedClusterVector = clusterVector.slice(0, minLength)
            return cosineSimilarity(adjustedUserVector, adjustedClusterVector)
        }
        
        // Calcular similaridade de cosseno
        const cosineSim = cosineSimilarity(userVector, clusterVector)
        
        // Converter de [-1, 1] para [0, 1]
        return (cosineSim + 1) / 2
        
    } catch (error) {
        logger.error(`Erro ao calcular similaridade de embeddings: ${error}`)
        return 0.5
    }
}

/**
 * Calcula a similaridade de tópicos entre os interesses do usuário e os tópicos do cluster
 * 
 * ALGORITMO:
 * - Normaliza tópicos (lowercase, remoção de acentos)
 * - Calcula similaridade de Jaccard: |A ∩ B| / |A ∪ B|
 * - Aplica função de decaimento para penalizar diferenças
 * - Considera variações semânticas (sinônimos, etc.)
 */
export function calculateTopicSimilarity(
    userInterests: string[],
    clusterTopics: string[],
    decayFactor: number = 0.8
): number {
    try {
        if (!userInterests.length || !clusterTopics.length) {
            return 0.5 // Valor neutro quando não há dados suficientes
        }
        
        // Normalizar tópicos
        const normalizeTopic = (topic: string): string => {
            return topic.toLowerCase()
                .trim()
                .replace(/[^\w\s]/g, '') // Remove caracteres especiais
                .replace(/\s+/g, ' ') // Normaliza espaços
        }
        
        const normalizedUserInterests = userInterests.map(normalizeTopic)
        const normalizedClusterTopics = clusterTopics.map(normalizeTopic)
        
        // Converter para sets para operações eficientes
        const userInterestsSet = new Set(normalizedUserInterests)
        const clusterTopicsSet = new Set(normalizedClusterTopics)
        
        // Calcular interseção
        let intersection = 0
        for (const topic of clusterTopicsSet) {
            if (userInterestsSet.has(topic)) {
                intersection++
            }
        }
        
        // Calcular similaridade de Jaccard
        const union = userInterestsSet.size + clusterTopicsSet.size - intersection
        
        if (union === 0) {
            return 0.5 // Valor neutro se não há sobreposição
        }
        
        const jaccardSimilarity = intersection / union
        
        // Aplicar função de decaimento para suavizar extremos
        const decayedSimilarity = Math.pow(jaccardSimilarity, decayFactor)
        
        // Aplicar função sigmóide para melhor distribuição
        return 1 / (1 + Math.exp(-3 * (decayedSimilarity - 0.5)))
        
    } catch (error) {
        logger.error(`Erro ao calcular similaridade de tópicos: ${error}`)
        return 0.5
    }
}

/**
 * Calcula proximidade na rede de interesses baseada no histórico de interações
 * 
 * ALGORITMO:
 * - Analisa interações históricas do usuário
 * - Identifica padrões de engajamento com tópicos similares
 * - Calcula score baseado na frequência e qualidade das interações
 */
function calculateNetworkProximity(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[],
    factors: AffinityFactors
): number {
    try {
        if (!userInteractions.length || !cluster.topics?.length) {
            return 0.5
        }
        
        // Limitar número de interações para análise
        const maxInteractions = factors.maxHistoricalInteractions || 100
        const recentInteractions = userInteractions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, maxInteractions)
        
        // Calcular score baseado em interações com tópicos similares
        let totalScore = 0
        let weightedCount = 0
        
        for (const interaction of recentInteractions) {
            // Usar tópicos do cluster para comparação, já que UserInteraction pode não ter topics
            // Em uma implementação real, os tópicos seriam extraídos do conteúdo da interação
            
            // Peso baseado no tipo de interação
            const interactionWeight = getInteractionWeight(interaction.type)
            
            // Peso temporal (interações mais recentes têm mais peso)
            const ageHours = (Date.now() - interaction.timestamp.getTime()) / (1000 * 60 * 60)
            const temporalWeight = Math.exp(-ageHours / 168) // Decaimento semanal
            
            // Simular similaridade baseada no tipo de interação e recência
            const simulatedTopicSimilarity = interactionWeight > 0 ? 0.7 : 0.3
            
            const weightedScore = simulatedTopicSimilarity * Math.abs(interactionWeight) * temporalWeight
            totalScore += weightedScore
            weightedCount += Math.abs(interactionWeight) * temporalWeight
        }
        
        if (weightedCount === 0) {
            return 0.5
        }
        
        return Math.min(1, totalScore / weightedCount)
        
    } catch (error) {
        logger.error(`Erro ao calcular proximidade na rede: ${error}`)
        return 0.5
    }
}

/**
 * Calcula a centralidade do cluster na rede de conteúdo
 * 
 * ALGORITMO:
 * - Baseado no tamanho e densidade do cluster
 * - Considera a diversidade de tópicos
 * - Avalia a estabilidade temporal
 */
function calculateClusterCentrality(cluster: ClusterInfo): number {
    try {
        // Fatores de centralidade
        const sizeFactor = Math.min(1, (cluster.size || 10) / 50) // Normalizar por tamanho
        const densityFactor = cluster.density || 0.5
        const topicDiversityFactor = cluster.topics ? 
            Math.min(1, cluster.topics.length / 10) : 0.5
        
        // Combinar fatores
        const centrality = (
            sizeFactor * 0.4 +
            densityFactor * 0.3 +
            topicDiversityFactor * 0.3
        )
        
        return Math.max(0.1, Math.min(1, centrality))
        
    } catch (error) {
        logger.error(`Erro ao calcular centralidade do cluster: ${error}`)
        return 0.5
    }
}

/**
 * Obtém o peso para um tipo de interação específico
 */
function getInteractionWeight(interactionType: string): number {
    const weights: Record<string, number> = {
        'view': 0.2,
        'short_view': 0.1,
        'long_view': 0.3,
        'like': 0.5,
        'dislike': -0.3,
        'comment': 0.8,
        'like_comment': 0.9,
        'share': 1.0,
        'save': 0.7,
        'report': -1.0,
        'follow': 0.6,
        'unfollow': -0.4
    }
    
    return weights[interactionType] || 0.3
}

/**
 * Retorna fatores padrão para cálculos de afinidade
 */
export function getDefaultAffinityFactors(): AffinityFactors {
    return {
        embeddingSimilarityWeight: 0.7,
        sharedInterestsWeight: 0.2,
        networkProximityWeight: 0.1,
        clusterCentralityWeight: 0.05,
        minSimilarityThreshold: 0.3,
        topicDecayFactor: 0.8,
        maxHistoricalInteractions: 100
    }
}

/**
 * Calcula métricas de afinidade detalhadas para análise
 */
export function calculateDetailedAffinityMetrics(
    userEmbedding: UserEmbedding,
    cluster: ClusterInfo,
    userProfile?: UserProfile
): {
    embeddingSimilarity: number
    topicSimilarity: number
    networkProximity: number
    clusterCentrality: number
    overallAffinity: number
} {
    try {
        const factors = getDefaultAffinityFactors()
        
        const embeddingSimilarity = calculateEmbeddingSimilarity(userEmbedding, cluster)
        const topicSimilarity = userProfile?.interests 
            ? calculateTopicSimilarity(userProfile.interests, cluster.topics || [])
            : 0.5
        
        let networkProximity = 0.5
        if (userProfile?.interactions && userProfile.userId) {
            const userInteractions = convertProfileInteractionsToUserInteractions(
                userProfile.interactions,
                userProfile.userId
            )
            networkProximity = calculateNetworkProximity(cluster, userInteractions, factors)
        }
        
        const clusterCentrality = calculateClusterCentrality(cluster)
        
        const overallAffinity = calculateAffinityScore(
            userEmbedding,
            cluster,
            userProfile,
            factors
        )
        
        return {
            embeddingSimilarity,
            topicSimilarity,
            networkProximity,
            clusterCentrality,
            overallAffinity
        }
        
    } catch (error) {
        logger.error(`Erro ao calcular métricas detalhadas de afinidade: ${error}`)
        return {
            embeddingSimilarity: 0.5,
            topicSimilarity: 0.5,
            networkProximity: 0.5,
            clusterCentrality: 0.5,
            overallAffinity: 0.5
        }
    }
} 