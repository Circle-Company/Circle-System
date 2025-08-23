/**
 * ClusterRankingAlgorithm
 *
 * Sistema avançado de ranqueamento de clusters que incorpora múltiplas métricas
 * e fatores para determinar a relevância dos clusters para recomendação.
 *
 * Este algoritmo implementa o modelo multi-fatorial descrito no documento METRICS_SYSTEM.md,
 * permitindo uma abordagem holística para determinar quais clusters são mais
 * relevantes para cada usuário.
 *
 * FUNCIONAMENTO DETALHADO:
 *
 * 1. AFINIDADE (AffinityMetrics):
 *    - Similaridade semântica entre usuário e cluster
 *    - Alinhamento de interesses e tópicos
 *    - Proximidade na rede de interesses
 *
 * 2. DIVERSIDADE (DiversityMetrics):
 *    - Variedade de tópicos e criadores
 *    - Evita bolhas de filtro
 *    - Promove descoberta de novo conteúdo
 *
 * 3. ENGAJAMENTO (EngagementMetrics):
 *    - Histórico de interações do usuário
 *    - Qualidade e recência das interações
 *    - Padrões de comportamento
 *
 * 4. NOVIDADE (NoveltyMetrics):
 *    - Conteúdo novo para o usuário
 *    - Exploração de novos tópicos
 *    - Evita repetição excessiva
 *
 * 5. TEMPORAL (TemporalMetrics):
 *    - Relevância baseada em hora/dia
 *    - Frescor do conteúdo
 *    - Eventos temporais especiais
 *
 * 6. QUALIDADE (QualityMetrics):
 *    - Coesão e densidade do cluster
 *    - Tamanho e estabilidade
 *    - Propriedades estruturais
 */

import { ClusterRankingParams, clusterRankingConfig } from "../../params"
import {
    ClusterInfo,
    RecommendationContext,
    UserEmbedding,
    UserInteraction,
    UserProfile,
} from "../types"
import { getLogger } from "../utils/logger"
import {
    calculateAffinityScore,
    calculateDiversityScore,
    calculateEngagementScore,
    calculateNoveltyScore,
    calculateQualityScore,
    calculateTemporalScore,
} from "./metrics"
import { AffinityFactors, getDefaultAffinityFactors } from "./metrics/AffinityMetrics"
import { DiversityFactors } from "./metrics/DiversityMetrics"
import { EngagementFactors } from "./metrics/EngagementMetrics"
import { NoveltyFactors } from "./metrics/NoveltyMetrics"
import { QualityFactors } from "./metrics/QualityMetrics"
import { TemporalFactors, getDefaultTemporalFactors } from "./metrics/TemporalMetrics"

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

    // Fatores de configuração para cada métrica
    private readonly defaultAffinityFactors: AffinityFactors = getDefaultAffinityFactors()

    private readonly defaultEngagementFactors: EngagementFactors = {
        recency: {
            halfLifeHours: ClusterRankingParams.engagementFactors.recency.halfLifeHours,
        },
        interactionWeights: ClusterRankingParams.engagementFactors.interactionWeights,
        defaultInteractionWeights: ClusterRankingParams.engagementFactors.defaultInteractionWeights,
        timeDecayFactor: ClusterRankingParams.engagementFactors.timeDecayFactor,
        maxInteractionsPerUser: ClusterRankingParams.engagementFactors.maxInteractionsPerUser,
        normalizationFactor: ClusterRankingParams.engagementFactors.normalizationFactor,
    }

    private readonly defaultNoveltyFactors: NoveltyFactors = {
        viewedContentWeight: ClusterRankingParams.noveltyFactors.viewedContentWeight,
        topicNoveltyWeight: ClusterRankingParams.noveltyFactors.topicNoveltyWeight,
        noveltyDecayPeriodDays: ClusterRankingParams.noveltyFactors.noveltyDecayPeriodDays,
        similarContentDiscount: ClusterRankingParams.noveltyFactors.similarContentDiscount,
    }

    private readonly defaultDiversityFactors: DiversityFactors = {
        topicDiversityWeight: ClusterRankingParams.diversityFactors.topicDiversityWeight,
        creatorDiversityWeight: ClusterRankingParams.diversityFactors.creatorDiversityWeight,
        formatDiversityWeight: ClusterRankingParams.diversityFactors.formatDiversityWeight,
        recentClustersToConsider: ClusterRankingParams.diversityFactors.recentClustersToConsider,
    }

    private readonly defaultTemporalFactors: TemporalFactors = getDefaultTemporalFactors()

    private readonly defaultQualityFactors: QualityFactors = {
        cohesionWeight: ClusterRankingParams.qualityFactors.cohesionWeight,
        sizeWeight: ClusterRankingParams.qualityFactors.sizeWeight,
        densityWeight: ClusterRankingParams.qualityFactors.densityWeight,
        stabilityWeight: ClusterRankingParams.qualityFactors.stabilityWeight,
        minOptimalSize: ClusterRankingParams.qualityFactors.minOptimalSize,
        maxOptimalSize: ClusterRankingParams.qualityFactors.maxOptimalSize,
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
            const userInteractions = this.adaptInteractions(
                rawInteractions,
                userProfile?.userId || "unknown"
            )

            // Array para armazenar resultados de ranqueamento
            const rankingResults: ClusterRankingResult[] = []

            // Para cada cluster, calcular scores multi-fatoriais
            for (const cluster of clusters) {
                try {
                    // 1. Calcular score de afinidade semântica
                    const affinityScore = userEmbedding
                        ? calculateAffinityScore(
                              userEmbedding,
                              cluster,
                              userProfile,
                              this.defaultAffinityFactors
                          )
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
                    const qualityScore = calculateQualityScore(cluster, this.defaultQualityFactors)

                    // 7. Calcular score final usando pesos configuráveis
                    const weights = this.getAdjustedWeights(userProfile, context)

                    const finalScore =
                        affinityScore * weights.affinity +
                        engagementScore * weights.engagement +
                        noveltyScore * weights.novelty +
                        diversityScore * weights.diversity +
                        temporalScore * weights.temporal +
                        qualityScore * weights.quality

                    // 8. Calcular nível de confiança do score
                    const confidence = this.calculateConfidenceScore(
                        {
                            affinity: affinityScore,
                            engagement: engagementScore,
                            novelty: noveltyScore,
                            diversity: diversityScore,
                            temporal: temporalScore,
                            quality: qualityScore,
                        },
                        weights
                    )

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
                            quality: qualityScore,
                        },
                        confidence,
                        metadata: {
                            clusterName: cluster.name,
                            clusterSize: cluster.size,
                            weights,
                            clusterTopics: cluster.topics?.slice(
                                0,
                                ClusterRankingParams.fallback.maxTopicsInMetadata
                            ), // Primeiros N tópicos
                        },
                    })
                } catch (error) {
                    this.logger.error(`Erro ao ranquear cluster ${cluster.id}: ${error}`)

                    // Adicionar resultado com scores neutros em caso de erro
                    rankingResults.push({
                        clusterId: cluster.id,
                        score: ClusterRankingParams.fallback.neutralScore,
                        componentScores: {
                            affinity: ClusterRankingParams.fallback.neutralScore,
                            engagement: ClusterRankingParams.fallback.neutralScore,
                            novelty: ClusterRankingParams.fallback.neutralScore,
                            diversity: ClusterRankingParams.fallback.neutralScore,
                            temporal: ClusterRankingParams.fallback.neutralScore,
                            quality: ClusterRankingParams.fallback.neutralScore,
                        },
                        confidence: ClusterRankingParams.fallback.errorConfidence,
                        metadata: {
                            error: error instanceof Error ? error.message : "Erro desconhecido",
                            clusterName: cluster.name,
                            clusterSize: cluster.size,
                        },
                    })
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
    private adaptInteractions(rawInteractions: any[], userId: string): UserInteraction[] {
        return rawInteractions.map((interaction, index) => {
            // Criar objeto compatível com UserInteraction
            return {
                id: `interaction-${index}`, // ID temporário
                userId: userId,
                entityId: interaction.postIds?.[0] || `entity-${index}`, // Usar primeiro postId como entityId
                entityType: "post",
                contentId: interaction.postIds?.[0],
                type: interaction.type || "view",
                timestamp: interaction.timestamp,
                postIds: interaction.postIds,
                // Outras propriedades podem ser adicionadas conforme necessário
                ...interaction, // Preservar propriedades originais
            } as UserInteraction
        })
    }

    /**
     * Calcula um score de afinidade padrão quando não há embedding do usuário
     */
    private calculateDefaultAffinityScore(
        userProfile: UserProfile | null | undefined,
        cluster: ClusterInfo
    ): number {
        if (!userProfile || !userProfile.interests || !cluster.topics) {
            return ClusterRankingParams.fallback.neutralScore // Score neutro quando não há dados suficientes
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
            : ClusterRankingParams.fallback.neutralScore // Score neutro quando não há interesses/tópicos
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

            if (
                interactionCount >
                ClusterRankingParams.userProfileAdjustments.highInteractionThreshold
            ) {
                baseWeights.diversity +=
                    ClusterRankingParams.userProfileAdjustments.diversityIncrease
                baseWeights.affinity -= ClusterRankingParams.userProfileAdjustments.affinityDecrease
                baseWeights.novelty += ClusterRankingParams.userProfileAdjustments.noveltyIncrease
            }
        }

        // Ajustes baseados no contexto (se disponível)
        if (context) {
            // Exemplo: durante a noite, priorizar qualidade sobre engajamento
            if (context.timeOfDay !== undefined) {
                const hour = context.timeOfDay

                if (
                    hour >= ClusterRankingParams.temporalAdjustments.nightTime.startHour ||
                    hour <= ClusterRankingParams.temporalAdjustments.nightTime.endHour
                ) {
                    // Noite/madrugada
                    baseWeights.quality +=
                        ClusterRankingParams.temporalAdjustments.nightTime.qualityIncrease
                    baseWeights.engagement -=
                        ClusterRankingParams.temporalAdjustments.nightTime.engagementDecrease
                } else if (
                    hour >= ClusterRankingParams.temporalAdjustments.lunchTime.startHour &&
                    hour <= ClusterRankingParams.temporalAdjustments.lunchTime.endHour
                ) {
                    // Horário de almoço
                    baseWeights.temporal +=
                        ClusterRankingParams.temporalAdjustments.lunchTime.temporalIncrease
                    baseWeights.engagement -=
                        ClusterRankingParams.temporalAdjustments.lunchTime.engagementDecrease
                }
            }

            // Exemplo: fins de semana, priorizar novidade
            if (context.dayOfWeek !== undefined) {
                const day = context.dayOfWeek

                if (ClusterRankingParams.temporalAdjustments.weekend.days.includes(day)) {
                    // Fim de semana
                    baseWeights.novelty +=
                        ClusterRankingParams.temporalAdjustments.weekend.noveltyIncrease
                    baseWeights.quality -=
                        ClusterRankingParams.temporalAdjustments.weekend.qualityDecrease
                }
            }
        }

        // Normalizar pesos para somar 1.0
        const sum: any = Object.values(baseWeights).reduce((acc: any, val: any) => acc + val, 0)

        return {
            affinity: baseWeights.affinity / sum,
            engagement: baseWeights.engagement / sum,
            novelty: baseWeights.novelty / sum,
            diversity: baseWeights.diversity / sum,
            temporal: baseWeights.temporal / sum,
            quality: baseWeights.quality / sum,
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
            scores.quality * weights.quality,
        ]

        // Calcular média
        const mean = weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length

        // Calcular variância
        const variance =
            weightedScores.reduce((sum, score) => {
                const diff = score - mean
                return sum + diff * diff
            }, 0) / weightedScores.length

        // Normalizar variância para um score de confiança (menor variância = maior confiança)
        const confidence =
            1 -
            Math.min(1, Math.sqrt(variance) * ClusterRankingParams.confidence.varianceMultiplier)

        return confidence
    }

    /**
     * Obtém estatísticas detalhadas sobre o ranqueamento
     */
    public getRankingStats(results: ClusterRankingResult[]): {
        totalClusters: number
        averageScore: number
        scoreDistribution: Record<string, number>
        topClusters: string[]
        confidenceStats: {
            average: number
            min: number
            max: number
        }
    } {
        if (results.length === 0) {
            return {
                totalClusters: 0,
                averageScore: 0,
                scoreDistribution: {},
                topClusters: [],
                confidenceStats: { average: 0, min: 0, max: 0 },
            }
        }

        const scores = results.map((r) => r.score)
        const confidences = results.map((r) => r.confidence)

        // Calcular distribuição de scores
        const scoreDistribution: Record<string, number> = {
            "0.0-0.2": 0,
            "0.2-0.4": 0,
            "0.4-0.6": 0,
            "0.6-0.8": 0,
            "0.8-1.0": 0,
        }

        const limits = ClusterRankingParams.statistics.scoreDistributionLimits

        scores.forEach((score) => {
            if (score < limits.low) scoreDistribution["0.0-0.2"]++
            else if (score < limits.medium) scoreDistribution["0.2-0.4"]++
            else if (score < limits.high) scoreDistribution["0.4-0.6"]++
            else if (score < limits.veryHigh) scoreDistribution["0.6-0.8"]++
            else scoreDistribution["0.8-1.0"]++
        })

        return {
            totalClusters: results.length,
            averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
            scoreDistribution,
            topClusters: results
                .slice(0, ClusterRankingParams.statistics.topClustersCount)
                .map((r) => r.clusterId),
            confidenceStats: {
                average: confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length,
                min: Math.min(...confidences),
                max: Math.max(...confidences),
            },
        }
    }
}
