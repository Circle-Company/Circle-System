import {
    ClusterInfo,
    MatchResult,
    RecommendationContext,
    UserEmbedding,
    UserProfile,
} from "../types"
import { getLogger } from "../utils/logger"
import { cosineSimilarity, normalizeVector } from "../utils/vectorUtils"

/**
 * ClusterMatcher é responsável por encontrar clusters relevantes para um usuário
 * com base em seu embedding e outros fatores contextuais
 */
export class ClusterMatcher {
    private _clusters: ClusterInfo[] = []
    private _minMatchThreshold: number
    private _contextWeight: number
    private _interestWeight: number
    private _embeddingWeight: number
    private _maxClusters: number
    private readonly logger = getLogger("ClusterMatcher")

    /**
     * Constrói uma nova instância de ClusterMatcher
     *
     * @param clusters Informações sobre os clusters disponíveis
     * @param options Opções de configuração para o matcher
     */
    constructor(
        clusters: ClusterInfo[],
        options: {
            minMatchThreshold?: number
            contextWeight?: number
            interestWeight?: number
            embeddingWeight?: number
            maxClusters?: number
        } = {}
    ) {
        this._clusters = clusters
        this._minMatchThreshold = options.minMatchThreshold ?? 0.2
        this._contextWeight = options.contextWeight ?? 0.2
        this._interestWeight = options.interestWeight ?? 0.3
        this._embeddingWeight = options.embeddingWeight ?? 0.5
        this._maxClusters = options.maxClusters ?? 3

        // Validar pesos (devem somar 1.0)
        const sumWeights = this._contextWeight + this._interestWeight + this._embeddingWeight
        if (Math.abs(sumWeights - 1.0) > 0.001) {
            this.logger.warn(`Os pesos devem somar 1.0, mas somam ${sumWeights}. Ajustando...`)

            // Normalizar pesos
            this._contextWeight /= sumWeights
            this._interestWeight /= sumWeights
            this._embeddingWeight /= sumWeights
        }
    }

    /**
     * Encontra clusters relevantes para um usuário com base em sua embedding
     * @param userEmbedding Embedding do usuário
     * @param userProfile Perfil do usuário com informações adicionais
     * @param context Contexto da recomendação (hora do dia, localização, etc.)
     * @returns Lista de resultados de correspondência ordenados por relevância
     */
    public findRelevantClusters(
        userEmbedding: UserEmbedding,
        userProfile?: UserProfile,
        context?: RecommendationContext
    ): MatchResult[] {
        const normalizedUserEmbedding = normalizeVector(userEmbedding.vector)

        // Calcular similaridade com cada cluster
        const matches = this._clusters.map((cluster) => {
            const normalizedClusterVector = normalizeVector(cluster.centroid)

            // Similaridade de cosseno entre o usuário e o centroide do cluster
            let similarity = cosineSimilarity(normalizedUserEmbedding, normalizedClusterVector)

            // Ajustar similaridade com base no perfil do usuário e contexto, se disponíveis
            if (userProfile && context) {
                const contextualBoost = this.calculateContextualBoost(userProfile, context, cluster)
                similarity =
                    similarity * (1 - this._contextWeight) + contextualBoost * this._contextWeight
            }

            return {
                clusterId: cluster.id,
                clusterName: cluster.name,
                similarity,
                cluster,
            } as MatchResult
        })

        // Filtrar matches que estão acima do limiar e ordenar por similaridade
        return matches
            .filter((match) => match.similarity >= this._minMatchThreshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, this._maxClusters)
    }

    /**
     * Calcula um bônus de relevância baseado em fatores contextuais
     * @param userProfile Perfil do usuário
     * @param context Contexto da recomendação
     * @param cluster Informações do cluster
     * @returns Valor de boost contextual (0-1)
     */
    private calculateContextualBoost(
        userProfile: UserProfile,
        context: RecommendationContext,
        cluster: ClusterInfo
    ): number {
        let boost = 0

        // Boost baseado na hora do dia
        if (context.timeOfDay && cluster.activeTimeOfDay) {
            const timeMatch = this.isTimeInRange(context.timeOfDay, cluster.activeTimeOfDay)
            boost += timeMatch ? 0.2 : 0
        }

        // Boost baseado em interesses compartilhados
        if (userProfile.interests && cluster.topics) {
            const sharedInterests = userProfile.interests.filter((interest) =>
                cluster.topics?.includes(interest)
            )

            boost += Math.min(0.3, sharedInterests.length * 0.1)
        }

        // Boost baseado em localização
        if (context.location && this.getPreferredLocations(cluster)?.includes(context.location)) {
            boost += 0.15
        }

        // Boost baseado em idioma
        if (
            userProfile.demographics?.language &&
            this.getClusterLanguages(cluster)?.includes(userProfile.demographics.language)
        ) {
            boost += 0.15
        }

        return Math.min(1, boost)
    }

    /**
     * Retorna as localizações preferidas pelo cluster de forma segura
     * @param cluster Informações do cluster
     * @returns Array de localizações ou undefined
     */
    private getPreferredLocations(cluster: ClusterInfo): string[] | undefined {
        // Verificar as diferentes possíveis propriedades para localizações
        return cluster.preferredLocations || (cluster as any).geographicFocus
            ? [(cluster as any).geographicFocus]
            : undefined
    }

    /**
     * Retorna os idiomas dominantes do cluster de forma segura
     * @param cluster Informações do cluster
     * @returns Array de idiomas ou undefined
     */
    private getClusterLanguages(cluster: ClusterInfo): string[] | undefined {
        // Verificar as diferentes possíveis propriedades para idiomas
        return cluster.languages || (cluster as any).dominantLanguages
    }

    /**
     * Verifica se uma hora do dia está dentro do intervalo ativo do cluster
     * @param timeOfDay Hora do dia (0-23) ou string ("morning", "afternoon", etc.)
     * @param activeTimeRange Intervalo de tempo ativo do cluster
     * @returns true se a hora está no intervalo ativo
     */
    private isTimeInRange(timeOfDay: string | number, activeTimeRange: any): boolean {
        // Se timeOfDay for uma string como "morning", "afternoon", etc.
        if (typeof timeOfDay === "string" && Array.isArray(activeTimeRange)) {
            return activeTimeRange.includes(timeOfDay as any)
        }

        // Se timeOfDay for um número (hora) e activeTimeRange for um intervalo de números
        if (
            typeof timeOfDay === "number" &&
            Array.isArray(activeTimeRange) &&
            activeTimeRange.length === 2 &&
            typeof activeTimeRange[0] === "number" &&
            typeof activeTimeRange[1] === "number"
        ) {
            const [start, end] = activeTimeRange as [number, number]

            // Verificar se está no intervalo, considerando que o intervalo pode atravessar a meia-noite
            if (start <= end) {
                return timeOfDay >= start && timeOfDay <= end
            } else {
                return timeOfDay >= start || timeOfDay <= end
            }
        }

        return false
    }
}
