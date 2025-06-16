/**
 * EngagementMetrics
 * 
 * Módulo responsável por calcular métricas de engajamento para clusters.
 * Avalia o nível de interação dos usuários com o conteúdo do cluster.
 */

import { ClusterInfo, InteractionType, UserInteraction } from "../../types"

import { getLogger } from "../../utils/logger"

const logger = getLogger("EngagementMetrics")

export interface EngagementFactors {
    /**
     * Configurações de recência para diferentes tipos de interação
     */
    recency: {
        halfLifeHours: {
            view_parcial: number
            view_completa: number
            like: number
            like_comment: number
            comment: number
            share: number
            save: number
        }
    }
    
    /**
     * Pesos para diferentes tipos de interação
     */
    interactionWeights: {
        view_parcial: number
        view_completa: number
        like: number
        like_comment: number
        comment: number
        share: number
        save: number
    }
    
    /**
     * Fator de decaimento temporal para engajamento
     */
    timeDecayFactor: number
    
    /**
     * Número máximo de interações a considerar por usuário
     */
    maxInteractionsPerUser?: number
    
    /**
     * Fator para normalizar scores de engajamento
     */
    normalizationFactor?: number
}

/**
 * Calcula um score de engajamento para um cluster com base nas interações dos usuários
 * 
 * @param cluster Informações do cluster
 * @param userInteractions Interações do usuário com conteúdo
 * @param factors Fatores de configuração para o cálculo
 * @returns Score de engajamento (0-1)
 */
export function calculateEngagementScore(
    cluster: ClusterInfo,
    userInteractions: UserInteraction[],
    factors: EngagementFactors
): number {
    try {
        if (!userInteractions.length || !cluster.memberIds || !cluster.memberIds.length) {
            return 0.5 // Score neutro quando não há dados suficientes
        }
        
        // Extrair IDs dos conteúdos no cluster
        const clusterContentIds = new Set(cluster.memberIds.map(id => id.toString()))
        
        // Filtrar interações relevantes para este cluster
        const relevantInteractions = userInteractions.filter(interaction => 
            clusterContentIds.has(interaction.entityId.toString())
        )
        
        if (relevantInteractions.length === 0) {
            return 0.4 // Score um pouco abaixo do neutro quando não há interações específicas
        }
        
        // Calcular score baseado em interações, aplicando decaimento temporal
        let totalScore = 0
        const now = new Date()
        
        // Limitar número de interações para evitar viés
        const limitedInteractions = relevantInteractions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, factors.maxInteractionsPerUser || relevantInteractions.length)
        
        for (const interaction of limitedInteractions) {
            // 1. Obter peso base para o tipo de interação
            const interactionType = interaction.type
            const baseWeight = getInteractionWeight(interactionType, factors.interactionWeights)
            
            // 2. Aplicar decaimento temporal
            const ageHours = (now.getTime() - interaction.timestamp.getTime()) / (1000 * 60 * 60)
            const decayFactor = calculateTemporalDecay(ageHours, interactionType, factors.recency.halfLifeHours)
            
            // 3. Calcular score para esta interação
            const interactionScore = baseWeight * decayFactor
            
            // 4. Adicionar ao score total
            totalScore += interactionScore
        }
        
        // Normalizar score
        const normalizedScore = 1 - Math.exp(-totalScore * (factors.normalizationFactor || 1))
        
        // Garantir que o score esteja no intervalo [0, 1]
        return Math.max(0, Math.min(1, normalizedScore))
    } catch (error) {
        logger.error(`Erro ao calcular score de engajamento: ${error}`)
        return 0.5 // Valor neutro em caso de erro
    }
}

/**
 * Calcula o fator de decaimento temporal para uma interação
 */
function calculateTemporalDecay(
    ageHours: number,
    interactionType: string,
    halfLifeHours: { [key: string]: number }
): number {
    // Obter meia-vida apropriada para o tipo de interação
    const halfLife = halfLifeHours[interactionType] || halfLifeHours.view_completa
    
    // Aplicar função de decaimento exponencial
    return Math.exp(-Math.log(2) * ageHours / halfLife)
}

/**
 * Obtém o peso base para um tipo de interação
 */
function getInteractionWeight(
    interactionType: string,
    weights: { [key: string]: number }
): number {
    // Verificar se o tipo existe nas configurações
    if (interactionType in weights) {
        return weights[interactionType]
    }
    
    // Valores padrão para tipos não configurados
    switch (interactionType) {
        // Visualizações
        case 'view_parcial':
        case 'short_view':
            return 0.5
        case 'view_completa':
        case 'long_view':
        case 'view':
            return 1.0
            
        // Likes
        case 'like':
            return 2.0
        case 'like_comment':
            return 2.5
            
        // Comentários
        case 'comment':
            return 3.0
            
        // Compartilhamentos
        case 'share':
            return 4.0
            
        // Salvamentos
        case 'save':
            return 3.5
            
        // Ações negativas
        case 'dislike':
            return -0.5
        case 'report':
            return -1.0
            
        // Ações de feedback
        case 'show_less_often':
            return -0.6
            
        // Tipo padrão para ações não reconhecidas
        default:
            return 0.3
    }
}

/**
 * Calcula métricas de engajamento mais detalhadas para um cluster
 */
export function calculateDetailedEngagementMetrics(
    cluster: ClusterInfo,
    allInteractions: UserInteraction[]
): {
    totalInteractions: number
    interactionsByType: { [key: string]: number }
    engagementRate: number
    retentionRate: number
    uniqueUsers: number
} {
    try {
        if (!cluster.memberIds || !cluster.memberIds.length) {
            return {
                totalInteractions: 0,
                interactionsByType: {},
                engagementRate: 0,
                retentionRate: 0,
                uniqueUsers: 0
            }
        }
        
        // Extrair IDs dos conteúdos no cluster
        const clusterContentIds = new Set(cluster.memberIds.map(id => id.toString()))
        
        // Filtrar interações relevantes para este cluster
        const relevantInteractions = allInteractions.filter(interaction => 
            clusterContentIds.has(interaction.entityId.toString())
        )
        
        // Contar interações por tipo
        const interactionsByType: { [key: string]: number } = {}
        for (const interaction of relevantInteractions) {
            const type = interaction.type
            interactionsByType[type] = (interactionsByType[type] || 0) + 1
        }
        
        // Contar usuários únicos
        const uniqueUsers = new Set(relevantInteractions.map(i => i.userId.toString())).size
        
        // Calcular taxas
        const totalInteractions = relevantInteractions.length
        const clusterSize = cluster.memberIds.length
        
        // Taxa de engajamento (interações por item)
        const engagementRate = clusterSize > 0 ? totalInteractions / clusterSize : 0
        
        // Taxa de retenção (proporção de usuários que retornam ao cluster)
        // Simplificação: contar usuários com mais de uma interação
        const userInteractionCounts = new Map<string, number>()
        for (const interaction of relevantInteractions) {
            const userId = interaction.userId.toString()
            userInteractionCounts.set(userId, (userInteractionCounts.get(userId) || 0) + 1)
        }
        
        const returningUsers = Array.from(userInteractionCounts.values()).filter(count => count > 1).length
        const retentionRate = uniqueUsers > 0 ? returningUsers / uniqueUsers : 0
        
        return {
            totalInteractions,
            interactionsByType,
            engagementRate,
            retentionRate,
            uniqueUsers
        }
    } catch (error) {
        logger.error(`Erro ao calcular métricas detalhadas de engajamento: ${error}`)
        return {
            totalInteractions: 0,
            interactionsByType: {},
            engagementRate: 0,
            retentionRate: 0,
            uniqueUsers: 0
        }
    }
}

/**
 * Determina o tipo de visualização baseado na duração e percentual de visualização
 * 
 * @param durationSeconds Duração da visualização em segundos
 * @param watchPercentage Percentual do conteúdo visualizado (0-1)
 * @returns Tipo de visualização ('view_parcial' ou 'view_completa')
 */
export function determineViewType(
    durationSeconds: number,
    watchPercentage: number
): 'view_parcial' | 'view_completa' {
    // Critérios para visualização completa:
    // 1. Duração mínima de 30 segundos OU
    // 2. Percentual de visualização acima de 80%
    const isComplete = durationSeconds >= 30 || watchPercentage >= 0.8
    
    return isComplete ? 'view_completa' : 'view_parcial'
}

/**
 * Processa uma interação de visualização com metadados adicionais
 * 
 * @param interaction Interação base
 * @param durationSeconds Duração da visualização em segundos
 * @param watchPercentage Percentual do conteúdo visualizado (0-1)
 * @returns Interação processada com tipo correto
 */
export function processViewInteraction(
    interaction: UserInteraction,
    durationSeconds: number,
    watchPercentage: number
): UserInteraction {
    const viewType = determineViewType(durationSeconds, watchPercentage)
    
    return {
        ...interaction,
        type: viewType as InteractionType,
        metadata: {
            ...interaction.metadata,
            durationSeconds,
            watchPercentage,
            viewType
        }
    }
}

/**
 * Processa uma interação de like em comentário
 * 
 * @param interaction Interação base
 * @param commentId ID do comentário que recebeu o like
 * @returns Interação processada como like_comment
 */
export function processCommentLikeInteraction(
    interaction: UserInteraction,
    commentId: string
): UserInteraction {
    return {
        ...interaction,
        type: 'like_comment' as InteractionType,
        metadata: {
            ...interaction.metadata,
            commentId,
            targetType: 'comment'
        }
    }
}

/**
 * Processa uma interação de salvamento
 * 
 * @param interaction Interação base
 * @param saveReason Motivo do salvamento (opcional)
 * @returns Interação processada como save
 */
export function processSaveInteraction(
    interaction: UserInteraction,
    saveReason?: string
): UserInteraction {
    return {
        ...interaction,
        type: 'save' as InteractionType,
        metadata: {
            ...interaction.metadata,
            saveReason,
            targetType: 'content'
        }
    }
} 