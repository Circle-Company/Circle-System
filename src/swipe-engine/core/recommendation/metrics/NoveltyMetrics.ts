/**
 * NoveltyMetrics
 * 
 * Módulo responsável por calcular métricas de novidade para clusters.
 * Avalia quão novo ou interessante um cluster pode ser para um usuário
 * com base em seu histórico de interações.
 */

import { ClusterInfo, UserInteraction } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("NoveltyMetrics")

export interface NoveltyFactors {
    /**
     * Peso para novidade baseada em conteúdo já visto
     */
    viewedContentWeight: number
    
    /**
     * Peso para novidade baseada em tópicos de interesse
     */
    topicNoveltyWeight: number
    
    /**
     * Período de tempo (em dias) a considerar para decaimento de novidade
     */
    noveltyDecayPeriodDays: number
    
    /**
     * Fator de desconto para conteúdos similares
     */
    similarContentDiscount: number
}

/**
 * Calcula um score de novidade para um cluster em relação ao histórico do usuário
 * 
 * @param cluster Informações do cluster
 * @param userInteractions Histórico de interações do usuário
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de novidade (0-1)
 */
export function calculateNoveltyScore(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[] | undefined | null,
    factors: NoveltyFactors
): number {
    try {
        // Se não há interações, o cluster é completamente novo
        if (!userInteractions || userInteractions.length === 0) {
            return 1.0
        }
        
        // Calcular novidade baseada em conteúdo já visto
        const contentNovelty = calculateContentNovelty(cluster, userInteractions, factors)
        
        // Calcular novidade baseada em tópicos
        const topicNovelty = calculateTopicNovelty(cluster, userInteractions)
        
        // Combinar scores usando pesos configuráveis
        const noveltyScore = 
            (contentNovelty * factors.viewedContentWeight) +
            (topicNovelty * factors.topicNoveltyWeight)
        
        // Normalizar para [0, 1]
        const totalWeight = factors.viewedContentWeight + factors.topicNoveltyWeight
        
        return Math.max(0, Math.min(1, noveltyScore / totalWeight))
    } catch (error) {
        logger.error(`Erro ao calcular score de novidade: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula novidade baseada em conteúdos já visualizados
 */
function calculateContentNovelty(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[],
    factors: NoveltyFactors
): number {
    try {
        // Simplificando: usar um valor simulado baseado na quantidade de interações
        // Em uma implementação real, calcularíamos com base em interações específicas
        
        // Contagem total de interações
        const interactionCount = userInteractions.length
        
        // Quanto mais interações, menor a novidade (presumindo que algumas interações
        // provavelmente são com este conteúdo)
        if (interactionCount === 0) {
            return 1.0 // Se não há interações, é completamente novo
        } else if (interactionCount > 100) {
            return 0.3 // Muitas interações = baixa novidade
        } else {
            // Decaimento linear baseado no número de interações
            return Math.max(0.3, 1.0 - interactionCount / 100)
        }
    } catch (error) {
        logger.error(`Erro ao calcular novidade de conteúdo: ${error}`)
        return 0.5
    }
}

/**
 * Calcula novidade baseada em tópicos
 */
function calculateTopicNovelty(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[]
): number {
    try {
        if (!cluster.topics || cluster.topics.length === 0) {
            return 0.5 // Valor neutro se não houver tópicos
        }
        
        // Simplificando: usar um valor de novidade proporcional ao número de tópicos
        // Em uma implementação real, compararíamos os tópicos com interesses do usuário
        const topicCount = cluster.topics.length
        
        // Clusters com mais tópicos têm maior chance de trazer novidade
        if (topicCount <= 2) {
            return 0.4 // Poucos tópicos = baixa novidade
        } else if (topicCount >= 10) {
            return 0.9 // Muitos tópicos = alta novidade
        } else {
            // Escala linear entre 0.4 e 0.9 baseado no número de tópicos
            return 0.4 + (topicCount - 2) * 0.5 / 8
        }
    } catch (error) {
        logger.error(`Erro ao calcular novidade de tópicos: ${error}`)
        return 0.5
    }
}

/**
 * Calcula métricas de novidade mais detalhadas
 */
export function calculateDetailedNoveltyMetrics(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[]
): {
    contentNovelty: number
    topicNovelty: number
    overallNovelty: number
} {
    try {
        const defaultFactors: NoveltyFactors = {
            viewedContentWeight: 0.7,
            topicNoveltyWeight: 0.3,
            noveltyDecayPeriodDays: 30,
            similarContentDiscount: 0.5
        }
        
        const contentNovelty = calculateContentNovelty(cluster, userInteractions, defaultFactors)
        const topicNovelty = calculateTopicNovelty(cluster, userInteractions)
        
        // Combinação ponderada
        const overallNovelty = 
            contentNovelty * defaultFactors.viewedContentWeight + 
            topicNovelty * defaultFactors.topicNoveltyWeight
        
        return {
            contentNovelty,
            topicNovelty,
            overallNovelty
        }
    } catch (error) {
        logger.error(`Erro ao calcular métricas detalhadas de novidade: ${error}`)
        return {
            contentNovelty: 0.5,
            topicNovelty: 0.5,
            overallNovelty: 0.5
        }
    }
} 