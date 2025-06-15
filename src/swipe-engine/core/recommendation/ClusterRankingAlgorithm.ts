/**
 * ClusterRankingAlgorithm
 * 
 * Sistema avançado de ranqueamento de clusters que incorpora múltiplas métricas
 * e fatores para determinar a relevância dos clusters para recomendação.
 * 
 * Este algoritmo implementa o modelo multi-fatorial descrito no documento METRICS_SYSTEM.md,
 * permitindo uma abordagem holística para determinar quais clusters são mais
 * relevantes para cada usuário.
 */

import { ClusterInfo, RecommendationContext, UserEmbedding, UserInteraction, UserProfile } from "../types"
import {
    calculateAffinityScore,
    calculateDiversityScore,
    calculateEngagementScore,
    calculateNoveltyScore,
    calculateQualityScore,
    calculateTemporalScore
} from "./metrics"
import { cosineSimilarity, normalizeVector } from "../utils/vector-operations"

import { clusterRankingConfig } from "../../config/ranking-config"
import { getLogger } from "../utils/logger"

export interface ClusterRankingResult {
    clusterId: string
    score: number
    componentScores: {
        affinity: number
        engagement: number
        novelty: number
        diversity: number
        temporal: number
        quality: number
    }
    confidence: number
    metadata: Record<string, any>
}

export class ClusterRankingAlgorithm {
    private readonly logger = getLogger("ClusterRankingAlgorithm")
    
    // Configurações temporárias para evitar problemas de tipo
    private readonly defaultAffinityFactors = {
        embeddingSimilarityWeight: 0.6,
        sharedInterestsWeight: 0.3,
        networkProximityWeight: 0.1,
        clusterCentralityWeight: 0.0,
        minSimilarityThreshold: 0.2
    }
    
    private readonly defaultEngagementFactors = {
        recency: {
            halfLifeHours: {
                view: 48,
                like: 168,
                comment: 336,
                share: 336,
                save: 720
            }
        },
        interactionWeights: {
            view: 1.0,
            like: 2.0,
            comment: 3.0,
            share: 4.0,
            save: 5.0
        },
        timeDecayFactor: 0.9,
        maxInteractionsPerUser: 100,
        normalizationFactor: 0.1
    }
    
    private readonly defaultNoveltyFactors = {
        viewedContentWeight: 0.7,
        topicNoveltyWeight: 0.3,
        noveltyDecayPeriodDays: 30,
        similarContentDiscount: 0.5
    }
    
    private readonly defaultDiversityFactors = {
        topicDiversityWeight: 0.5,
        creatorDiversityWeight: 0.3,
        formatDiversityWeight: 0.2,
        recentClustersToConsider: 10
    }
    
    private readonly defaultTemporalFactors = {
        hourOfDayWeights: {
            morning: 1.2,
            midday: 1.0,
            afternoon: 0.9,
            evening: 1.3,
            night: 0.8
        },
        dayOfWeekWeights: {
            weekday: 1.0,
            weekend: 1.2
        },
        contentFreshnessWeight: 0.7,
        temporalEventWeight: 0.3,
        temporalHalfLifeHours: 48
    }
    
    private readonly defaultQualityFactors = {
        cohesionWeight: 0.4,
        sizeWeight: 0.2,
        densityWeight: 0.2,
        stabilityWeight: 0.2,
        minOptimalSize: 5,
        maxOptimalSize: 50,
        minClusterSize: 5,
        maxClusterSize: 500
    }
    
    /**
     * Ranqueia clusters para um usuário específico com base em múltiplos fatores
     * 
     * @param clusters Lista de clusters a serem ranqueados
     * @param userEmbedding Embedding do usuário (se disponível)
     * @param userProfile Perfil do usuário (se disponível)
     * @param context Contexto atual da recomendação
     * @returns Lista de clusters ranqueados com seus respectivos scores
     */
    public rankClusters(
        clusters: ClusterInfo[],
        userEmbedding?: UserEmbedding | null,
        userProfile?: UserProfile | null,
        context?: RecommendationContext
    ): ClusterRankingResult[] {
        try {
            this.logger.info(`Ranqueando ${clusters.length} clusters para usuário`)
            
            // Coletar interações do usuário para análise (se disponível)
            const rawInteractions = userProfile?.interactions || []
            
            // Adaptar as interações para o formato esperado
            const userInteractions = this.adaptInteractions(rawInteractions, userProfile?.userId || 'unknown')
            
            // Array para armazenar resultados de ranqueamento
            const rankingResults: ClusterRankingResult[] = []
            
            // Para cada cluster, calcular scores multi-fatoriais
            for (const cluster of clusters) {
                try {
                    // 1. Calcular score de afinidade semântica
                    const affinityScore = userEmbedding 
                        ? calculateAffinityScore(userEmbedding, cluster, this.defaultAffinityFactors)
                        : this.calculateDefaultAffinityScore(userProfile, cluster)
                    
                    // 2. Calcular score de engajamento
                    const engagementScore = calculateEngagementScore(
                        cluster, 
                        userInteractions,
                        this.defaultEngagementFactors
                    )
                    
                    // 3. Calcular score de novidade
                    const noveltyScore = calculateNoveltyScore(
                        cluster,
                        userInteractions,
                        this.defaultNoveltyFactors
                    )
                    
                    // 4. Calcular score de diversidade
                    const diversityScore = calculateDiversityScore(
                        cluster,
                        userProfile,
                        this.defaultDiversityFactors
                    )
                    
                    // 5. Calcular score de relevância temporal
                    const temporalScore = calculateTemporalScore(
                        cluster,
                        context,
                        this.defaultTemporalFactors
                    )
                    
                    // 6. Calcular score de qualidade do cluster
                    const qualityScore = calculateQualityScore(
                        cluster,
                        this.defaultQualityFactors
                    )
                    
                    // 7. Calcular score final usando pesos configuráveis
                    const weights = this.getAdjustedWeights(userProfile, context)
                    
                    const finalScore = 
                        (affinityScore * weights.affinity) +
                        (engagementScore * weights.engagement) +
                        (noveltyScore * weights.novelty) +
                        (diversityScore * weights.diversity) +
                        (temporalScore * weights.temporal) +
                        (qualityScore * weights.quality)
                    
                    // 8. Calcular nível de confiança do score
                    const confidence = this.calculateConfidenceScore({
                        affinity: affinityScore,
                        engagement: engagementScore,
                        novelty: noveltyScore, 
                        diversity: diversityScore,
                        temporal: temporalScore,
                        quality: qualityScore
                    }, weights)
                    
                    // Adicionar resultado ao array de rankings
                    rankingResults.push({
                        clusterId: cluster.id,
                        score: finalScore,
                        componentScores: {
                            affinity: affinityScore,
                            engagement: engagementScore,
                            novelty: noveltyScore,
                            diversity: diversityScore,
                            temporal: temporalScore,
                            quality: qualityScore
                        },
                        confidence,
                        metadata: {
                            clusterName: cluster.name,
                            clusterSize: cluster.size,
                            weights
                        }
                    })
                    
                } catch (error) {
                    this.logger.error(`Erro ao ranquear cluster ${cluster.id}: ${error}`)
                }
            }
            
            // Ordenar por score final (decrescente)
            return rankingResults.sort((a, b) => b.score - a.score)
            
        } catch (error) {
            this.logger.error(`Erro geral no algoritmo de ranqueamento: ${error}`)
            return []
        }
    }
    
    /**
     * Adapta as interações do formato existente para o formato esperado pelas funções de métricas
     */
    private adaptInteractions(
        rawInteractions: any[],
        userId: string
    ): UserInteraction[] {
        return rawInteractions.map((interaction, index) => {
            // Criar objeto compatível com UserInteraction
            return {
                id: `interaction-${index}`, // ID temporário
                userId: userId,
                entityId: interaction.postIds?.[0] || `entity-${index}`, // Usar primeiro postId como entityId
                entityType: 'post',
                contentId: interaction.postIds?.[0],
                type: interaction.type || 'view',
                timestamp: interaction.timestamp,
                postIds: interaction.postIds,
                // Outras propriedades podem ser adicionadas conforme necessário
                ...interaction // Preservar propriedades originais
            } as UserInteraction;
        });
    }
    
    /**
     * Calcula um score de afinidade padrão quando não há embedding do usuário
     */
    private calculateDefaultAffinityScore(
        userProfile: UserProfile | null | undefined,
        cluster: ClusterInfo
    ): number {
        if (!userProfile || !userProfile.interests || !cluster.topics) {
            return 0.5 // Score neutro quando não há dados suficientes
        }
        
        // Contar interesses compartilhados
        const userInterests = new Set(userProfile.interests)
        const clusterTopics = new Set(cluster.topics)
        
        let sharedCount = 0
        for (const topic of clusterTopics) {
            if (userInterests.has(topic)) {
                sharedCount++
            }
        }
        
        // Calcular score baseado em interesses compartilhados
        const maxPossibleShared = Math.min(userInterests.size, clusterTopics.size)
        
        return maxPossibleShared > 0
            ? sharedCount / maxPossibleShared
            : 0.5 // Score neutro quando não há interesses/tópicos
    }
    
    /**
     * Obtém pesos ajustados com base no perfil do usuário e contexto
     */
    private getAdjustedWeights(
        userProfile: UserProfile | null | undefined,
        context?: RecommendationContext
    ): {
        affinity: number
        engagement: number
        novelty: number
        diversity: number
        temporal: number
        quality: number
    } {
        // Começar com pesos base da configuração
        const baseWeights = clusterRankingConfig.baseWeights
        
        // Ajustes baseados no perfil do usuário (se disponível)
        if (userProfile) {
            // Exemplo: usuários com mais interações podem ter peso maior para diversidade
            // e menor para afinidade (para evitar bolhas de filtro)
            const interactionCount = userProfile.interactions?.length || 0
            
            if (interactionCount > 100) {
                baseWeights.diversity += 0.1
                baseWeights.affinity -= 0.05
                baseWeights.novelty += 0.05
            }
        }
        
        // Ajustes baseados no contexto (se disponível)
        if (context) {
            // Exemplo: durante a noite, priorizar qualidade sobre engajamento
            if (context.timeOfDay !== undefined) {
                const hour = context.timeOfDay
                
                if (hour >= 20 || hour <= 5) { // Noite/madrugada
                    baseWeights.quality += 0.1
                    baseWeights.engagement -= 0.05
                } else if (hour >= 11 && hour <= 14) { // Horário de almoço
                    baseWeights.temporal += 0.1
                    baseWeights.engagement -= 0.05
                }
            }
            
            // Exemplo: fins de semana, priorizar novidade
            if (context.dayOfWeek !== undefined) {
                const day = context.dayOfWeek
                
                if (day === 0 || day === 6) { // Fim de semana
                    baseWeights.novelty += 0.1
                    baseWeights.quality -= 0.05
                }
            }
        }
        
        // Normalizar pesos para somar 1.0
        const sum = Object.values(baseWeights).reduce((acc, val) => acc + val, 0)
        
        return {
            affinity: baseWeights.affinity / sum,
            engagement: baseWeights.engagement / sum,
            novelty: baseWeights.novelty / sum,
            diversity: baseWeights.diversity / sum,
            temporal: baseWeights.temporal / sum,
            quality: baseWeights.quality / sum
        }
    }
    
    /**
     * Calcula um score de confiança baseado nos componentes e seus pesos
     */
    private calculateConfidenceScore(
        scores: {
            affinity: number
            engagement: number
            novelty: number
            diversity: number
            temporal: number
            quality: number
        },
        weights: {
            affinity: number
            engagement: number
            novelty: number
            diversity: number
            temporal: number
            quality: number
        }
    ): number {
        // Calcular variância dos scores ponderados
        const weightedScores = [
            scores.affinity * weights.affinity,
            scores.engagement * weights.engagement,
            scores.novelty * weights.novelty,
            scores.diversity * weights.diversity,
            scores.temporal * weights.temporal,
            scores.quality * weights.quality
        ]
        
        // Calcular média
        const mean = weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length
        
        // Calcular variância
        const variance = weightedScores.reduce((sum, score) => {
            const diff = score - mean
            return sum + (diff * diff)
        }, 0) / weightedScores.length
        
        // Normalizar variância para um score de confiança (menor variância = maior confiança)
        const confidence = 1 - Math.min(1, Math.sqrt(variance) * 2)
        
        return confidence
    }
} 