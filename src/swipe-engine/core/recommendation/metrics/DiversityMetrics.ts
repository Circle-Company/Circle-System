/**
 * DiversityMetrics
 * 
 * Módulo responsável por calcular métricas de diversidade para clusters.
 * Avalia quão diverso é um cluster em relação ao perfil e histórico do usuário.
 */

import { ClusterInfo, UserProfile } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("DiversityMetrics")

export interface DiversityFactors {
    // Peso para diversidade temática
    topicDiversityWeight: number
    
    // Peso para diversidade de criadores de conteúdo
    creatorDiversityWeight: number
    
    // Peso para diversidade de formatos de conteúdo
    formatDiversityWeight: number
    
    // Número de clusters recentes a considerar para diversidade
    recentClustersToConsider: number
}

/**
 * Calcula um score de diversidade para um cluster em relação ao perfil do usuário
 * 
 * @param cluster Informações do cluster
 * @param userProfile Perfil do usuário (se disponível)
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de diversidade (0-1)
 */
export function calculateDiversityScore(
    cluster: ClusterInfo,
    userProfile: UserProfile | null | undefined,
    factors: DiversityFactors
): number {
    try {
        // Se não temos perfil do usuário, usar valor neutro
        if (!userProfile) {
            return 0.5
        }
        
        // Calcular componentes de diversidade
        const topicDiversity = calculateTopicDiversity(cluster, userProfile)
        const creatorDiversity = calculateCreatorDiversity(cluster, userProfile)
        const formatDiversity = 0.5 // Valor neutro para exemplo
        
        // Combinar scores usando pesos configuráveis
        const diversityScore = 
            (topicDiversity * factors.topicDiversityWeight) +
            (creatorDiversity * factors.creatorDiversityWeight) +
            (formatDiversity * factors.formatDiversityWeight)
        
        // Normalizar para [0, 1]
        const totalWeight = 
            factors.topicDiversityWeight + 
            factors.creatorDiversityWeight + 
            factors.formatDiversityWeight
        
        return Math.max(0, Math.min(1, diversityScore / totalWeight))
    } catch (error) {
        logger.error(`Erro ao calcular score de diversidade: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula diversidade de tópicos entre o cluster e o perfil do usuário
 */
function calculateTopicDiversity(
    cluster: ClusterInfo,
    userProfile: UserProfile
): number {
    try {
        if (!cluster.topics || !userProfile.interests) {
            return 0.5 // Valor neutro se não houver tópicos ou interesses
        }
        
        // Contar tópicos do cluster que não estão nos interesses do usuário
        const userInterests = new Set(userProfile.interests.map(i => i.toLowerCase()))
        const clusterTopics = cluster.topics.map(t => t.toLowerCase())
        
        let newTopicsCount = 0
        for (const topic of clusterTopics) {
            if (!userInterests.has(topic)) {
                newTopicsCount++
            }
        }
        
        // Calcular taxa de novos tópicos
        const topicDiversity = clusterTopics.length > 0 
            ? newTopicsCount / clusterTopics.length 
            : 0.5
        
        // Aplicar função de utilidade (muito pouca ou muita diversidade não é ideal)
        // Usando uma curva em forma de sino centrada em 0.7
        const utility = 1 - Math.abs(topicDiversity - 0.7) / 0.7
        
        return Math.max(0.3, utility)
    } catch (error) {
        logger.error(`Erro ao calcular diversidade de tópicos: ${error}`)
        return 0.5
    }
}

/**
 * Calcula diversidade de criadores de conteúdo
 */
function calculateCreatorDiversity(
    cluster: ClusterInfo,
    userProfile: UserProfile
): number {
    // Simulação simples - na implementação real, analisaríamos
    // os criadores dos conteúdos no cluster vs. os criadores
    // com quem o usuário costuma interagir
    return 0.6
}

/**
 * Calcula métricas de diversidade mais detalhadas
 */
export function calculateDetailedDiversityMetrics(
    cluster: ClusterInfo,
    userProfile: UserProfile
): {
    topicDiversity: number
    creatorDiversity: number
    formatDiversity: number
    overallDiversity: number
} {
    try {
        const topicDiversity = calculateTopicDiversity(cluster, userProfile)
        const creatorDiversity = calculateCreatorDiversity(cluster, userProfile)
        const formatDiversity = 0.5 // Placeholder
        
        // Combinação ponderada
        const overallDiversity = 
            topicDiversity * 0.5 + 
            creatorDiversity * 0.3 + 
            formatDiversity * 0.2
        
        return {
            topicDiversity,
            creatorDiversity,
            formatDiversity,
            overallDiversity
        }
    } catch (error) {
        logger.error(`Erro ao calcular métricas detalhadas de diversidade: ${error}`)
        return {
            topicDiversity: 0.5,
            creatorDiversity: 0.5,
            formatDiversity: 0.5,
            overallDiversity: 0.5
        }
    }
} 